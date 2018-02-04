const through = require('through2');

const logger = require('./logger');
const collections = require('./collections');
const readableStream = require('./readable-stream');

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

async function* inctrementalBatchesAsync() {
    yield collections.iterator([{id: '1-1'}, {id: '1-2'}], {metadata: collections.lazy({ConsumedCapacity: 2})});
    yield collections.iterator([{id: '2-1'}, {id: '2-2'}, {id: '2-3'}, {id: '2-4'}, {id: '2-5'}], {metadata: collections.lazy({ConsumedCapacity: 5})});
    yield collections.iterator([{id: '3-1'}, {id: '3-2'}, {id: '3-3'}], {metadata: collections.lazy({ConsumedCapacity: 3})});
}

const unique = {};

const echoStream = through({objectMode: true, highWaterMark: 5}, function (chunk, enc, next) {
    if (chunk.id in unique) this.emit('error', new Error(`Duplicate Data Record: [${JSON.stringify(chunk, null, 0)}]`));
    unique[chunk.id] = chunk;
    logger.logLine('>>>>>', chunk);
    next(null, chunk);
});

describe('readable-stream', () => {
    it('throttles batches using Consumed Capacity in penalty mode', async done => {
        readableStream.fromAsyncGeneratorOfBatches({
            rate: 1,
            interval: 'second',
            burst: 1
        }, await inctrementalBatchesAsync())
            .pipe(echoStream)
            .resume()
            .on('error', error => done.fail(error))
            .on('end', () => {
                logger.log('END EVENT RECEIVED');
                done();
            });
    }, 30000);
});
