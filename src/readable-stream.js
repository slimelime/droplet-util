/* eslint-disable max-statements-per-line */
const {Readable} = require('readable-stream');
const util = require('util');
const through = require('through2');
const Rx = require('rxjs');
const moment = require('moment');

const {RateLimiter} = require('./throttling/limiter');
const collections = require('./collections');
const logger = require('./logger');

module.exports = {
    fromGenerator,
    fromAsyncGenerator,
    fromAsyncGeneratorOfBatches
};

function ReadableStream(options, source) {
    Readable.call(this, options);
    this._source = source;
}

util.inherits(ReadableStream, Readable);

function fromGenerator(options = {objectMode: true, highWaterMark: 20}, generator) {

    // _read will be called when the stream wants to pull more data in
    ReadableStream.prototype._read = function (size) {
        this.counter = this.counter === undefined ? 0 : this.counter;

        // logger.log(`RESUME(${size}) FROM ${this.counter}`);
        for (let i = 0; i < size; i++) {
            const {value, done} = this._source.next();
            if (done) {
                this.push(null); // When the source ends, push the EOF-signaling `null` chunk
                this.emit('end');
                logger.log('------------------------------------- END OF DATA ------------------------------------- ');
                return;
            }
            const canAcceptMore = this.push(value);
            if (!canAcceptMore) {
                this.counter++;
                // logger.log(`- PAUSED after [${this.counter}/${size}] = `, value);
                break;
            } else {
                this.counter++;
                // logger.log(`+ PUSHED chunk [${this.counter}] = `, value);
            }
        }
    };
    return new ReadableStream(options, generator);
}

function fromAsyncGenerator(options = {objectMode: true, highWaterMark: 20}, generator) {

    // _read will be called when the stream wants to pull more data in
    ReadableStream.prototype._read = async function (size) {
        this.counter = this.counter === undefined ? 0 : this.counter;

        // logger.log(`RESUME(${size}) FROM ${this.counter}`);
        for (let i = 0; i < size; i++) {
            const {value, done} = await this._source.next();
            if (done) {
                this.push(null); // When the source ends, push the EOF-signaling `null` chunk
                this.emit('end');
                // logger.log('------------------------------------- END OF DATA ------------------------------------- ');
                return;
            }
            const canAcceptMore = this.push(value);
            if (!canAcceptMore) {
                this.counter++;
                // logger.log(`- PAUSED after [${this.counter}/${size}] = `, value);
                break;
            } else {
                this.counter++;
                // logger.log(`+ PUSHED chunk [${this.counter}] = `, value);
            }
        }
    };
    return new ReadableStream(options, generator);
}

function fromAsyncGeneratorOfBatches(options = {}, generator) {

    const {rate = 1, interval = 'second', burst = rate, initialContent = burst, consumedCapacityUnits = x => x} = options;
    // _read will be called when the stream wants to pull more data in
    ReadableStream.prototype._read = async function (size) {
        if (this._inProgress) return;

        this._inProgress = true;
        const wasPaused = this.isPaused();
        this.pause();


        this.counter = this.counter === undefined ? 0 : this.counter;
        this.debt = this.debt === undefined ? 0 : this.debt;
        this.throttle = this.throttle === undefined ? throttle(new RateLimiter(rate, interval, burst, initialContent)) : this.throttle;
        this._done = this._done === undefined ? false : this._done;

        // logger.log(`_read(${JSON.stringify({size, counter: this.counter, debt: this.debt, done: this._done})})`);

        let refreshed = false;
        ({
            value: this._iterator,
            done: this._done
        } = (this._iterator === undefined && !this._done) ? (refreshed = true, await this._source.next()) : {
            value: this._iterator,
            done: false
        });

        if (this._done) {
            this.push(null); // When the source ends, push the EOF-signaling `null` chunk
            this.emit('end');
            // logger.log('------------------------------------- END OF DATA ------------------------------------- ');
            return;
        }

        if (refreshed) {
            const metadata = this._iterator.metadata();
            logger.log({metadata});
            this.debt = consumedCapacityUnits(metadata);
        }
//         logger.log({debt: this.debt});

        // unless we pause or check an inProgress flag, as soon as we call push(), _read() would be called again. https://github.com/nodejs/node/issues/3203

        for (let i = 0; i < size; i++) {
            let {value, done: iDone} = this._iterator.next();
            // logger.log({/*value, */iDone, debt: this.debt});

            if (iDone) {
                if (this.debt) {
                    logger.log(`------------------------------------- Throttling accumulated ${this.debt} @ (${rate}/${interval}) ------------------------------------- `);
                    // logger.time(`refresh-iterator@${this.counter}`);
                    const consumed = await this.throttle(this.debt);
                    // logger.timeEnd(`refresh-iterator@${this.counter}`);
                    // logger.log({consumed});
                    this.debt = 0;
                }
                ({value: this._iterator, done: this._done} = await this._source.next()); // grab a fresh batch iterator
                if (this._done) {
                    this.push(null); // When the source ends, push the EOF-signaling `null` chunk
                    this.emit('end');
                    this.pause();
                    // logger.log('------------------------------------- END OF DATA ------------------------------------- ');
                    return;
                } else {
                    const metadata = this._iterator.metadata();
                    logger.log({metadata});
                    this.debt = consumedCapacityUnits(metadata);
                    ({value, done: iDone} = this._iterator.next());
                    // logger.log({/*value, */iDone, debt: this.debt});
                }
            }

            const canAcceptMore = this.push(value);
            if (!canAcceptMore) {
                this.counter++;
                // logger.log(`- PAUSED after [${this.counter}/${size}] = `/*, value*/);
                break;
            } else {
                this.counter++;
                // logger.log(`+ PUSHED chunk [${this.counter}] = `/*, value*/);
            }
        }

        if (this.debt) {
            logger.log(`------------------------------------- Throttling remaining ${this.debt} @ (${rate}/${interval}) ------------------------------------- `);
            await this.throttle(this.debt);
            this.debt = 0;
        }

        this._inProgress = false;
        if (!wasPaused) this.resume();
    };
    return new ReadableStream({objectMode: true, highWaterMark: 20, ...options}, generator);
}

const throttle = rateLimiter => async tokens => {
    logger.log(`throttle(${tokens})@${moment().format('HH:mm:ss:SSS')}`);
    return rateLimiter.getTokens(tokens);
};

function* incremental(take = 10) {
    let i = 1;
    while (i <= take) {
        yield {id: i};
        i++;
    }
}

async function* incrementalAsync(take = 10) {
    let i = 1;
    while (i <= take) {
        yield {id: i};
        i++;
    }
}

async function* incrementalBatchesAsync() {
    yield collections.iterator([{id: '1-1'}, {id: '1-2'}], {
        metadata: collections.lazy({
            ConsumedCapacity: {
                "TableName": "SirenCommandExecutionStateTest",
                "CapacityUnits": 2
            }
        })
    });
    yield collections.iterator([{id: '2-1'}, {id: '2-2'}, {id: '2-3'}, {id: '2-4'}, {id: '2-5'}], {
        metadata: collections.lazy({
            ConsumedCapacity: {
                "TableName": "SirenCommandExecutionStateTest",
                "CapacityUnits": 5
            }
        })
    });
    yield collections.iterator([{id: '3-1'}, {id: '3-2'}, {id: '3-3'}], {
        metadata: collections.lazy({
            ConsumedCapacity: {
                "TableName": "SirenCommandExecutionStateTest",
                "CapacityUnits": 3
            }
        })
    });
}

const unique = {};

const echoStream = through({objectMode: true, highWaterMark: 5}, function (chunk, enc, next) {
    if (chunk.id in unique) this.emit('error', new Error(`Duplicate Data Record: [${JSON.stringify(chunk, null, 0)}]`));
    unique[chunk.id] = chunk;
    logger.logLine('>>>>>', chunk);
    next(null, chunk);
});

async function main() {
    // fromGenerator(undefined, incremental(100))
    //     .pipe(echoStream)
    //     .resume()
    //     .on('end', () => logger.log('END EVENT RECEIVED'));

    // fromAsyncGenerator(undefined, await incrementalAsync(100))
    //     .pipe(echoStream)
    //     .resume()
    //     .on('end', () => logger.log('END EVENT RECEIVED'));
    const complete$ = new Rx.Subject();

    fromAsyncGeneratorOfBatches({
        rate: 60, interval: 'minute', burst: 1, initialContent: 0,
        consumedCapacityUnits: ({ConsumedCapacity: {CapacityUnits}}) => CapacityUnits
    }, await incrementalBatchesAsync())
        .pipe(echoStream)
        .resume()
        .on('end', () => {
            logger.log('END EVENT RECEIVED');
            complete$.complete();
        });

    return complete$.toPromise();
}


// logger.time('scenario');
// main()
//     .then(() => logger.timeEnd('scenario'));

// async function testThrottle(options = {}) {
//     const {rate = 1, interval = 'second', burst = rate} = options;
//     logger.time('throttle');
//     await throttle(new RateLimiter(rate, interval, burst))(5);
//     logger.timeEnd('throttle');
// }
//
// testThrottle();
