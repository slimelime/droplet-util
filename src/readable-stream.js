/* eslint-disable max-statements-per-line */
const {Subject} = require('rxjs');
const rxStream = require('rxjs-stream');
const moment = require('moment');

const {RateLimiter} = require('./throttling/limiter');
const logger = require('./logger');

module.exports = {
    fromGenerator,
    fromAsyncGenerator,
    fromAsyncGeneratorOfBatches,
    throttledStreamFromAsyncGeneratorOfBatches
};

function toReadableStream(source$, options) {
    const readableStream = rxStream.rxToStream(source$, {objectMode: true, ...options});
    readableStream._source$ = source$;
    return readableStream;
}

const pumpGeneratorToStream = (generator, stream$, options) => () => {
    for (const value of generator) {
        stream$.next(value);
    }
    stream$.complete();
};

const throttle = rateLimiter => async tokens => {
    // logger.log(`throttle(${tokens})@${moment().format('HH:mm:ss:SSS')}`);
    return rateLimiter.getTokens(tokens);
};

const pumpAsyncGeneratorToStream = (generator, stream$, options) => async () => {
    //eslint-disable-next-line semi
    for await (const value of generator) {
        stream$.next(value);
    }
    stream$.complete();
};

const pumpAsyncGeneratorOfBatchesToStream = (generator, stream$, options) => async () => {
    const {rate = 1, interval = 'second', burst = rate, initialContent = burst, consumedCapacityUnits = ({ConsumedCapacity: {CapacityUnits}}) => CapacityUnits} = options;
    const throttleFn = throttle(new RateLimiter(rate, interval, burst, initialContent));
    let debt = 0;
    //eslint-disable-next-line semi
    for await (const iterator of generator) {
        const metadata = iterator.metadata();
        debt = consumedCapacityUnits(metadata);
        for (const iValue of iterator) {
            stream$.next(iValue);
        }
        if (debt) {
            await throttleFn(debt);
        }
    }
    stream$.complete();

};

function from(source, options, pipeFn) {
    const stream$ = new Subject();
    const readableStream = toReadableStream(stream$, options);
    process.nextTick(pipeFn(source, stream$, options));
    return readableStream;
}

function throttled(source, options, pipeFn) {
    const stream$ = new Subject();
    process.nextTick(pipeFn(source, stream$, options));
    return stream$;
}

function fromGenerator(source, options = {objectMode: true, highWaterMark: 20}) {
    return from(source, options, pumpGeneratorToStream);
}

function fromAsyncGenerator(source, options = {objectMode: true, highWaterMark: 20}) {
    return from(source, options, pumpAsyncGeneratorToStream);
}

function fromAsyncGeneratorOfBatches(source, options = {objectMode: true, highWaterMark: 20}) {
    return from(source, options, pumpAsyncGeneratorOfBatchesToStream);
}

function throttledStreamFromAsyncGeneratorOfBatches(source, options) {
    return throttled(source, options, pumpAsyncGeneratorOfBatchesToStream);
}

