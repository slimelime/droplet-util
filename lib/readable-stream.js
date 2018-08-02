'use strict';

var _asyncIterator2 = require('babel-runtime/helpers/asyncIterator');

var _asyncIterator3 = _interopRequireDefault(_asyncIterator2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable max-statements-per-line */
const { Subject } = require('rxjs');
const rxStream = require('rxjs-stream');
const moment = require('moment');

const { RateLimiter } = require('./throttling/limiter');
const logger = require('./logger');

module.exports = {
    fromGenerator,
    fromAsyncGenerator,
    fromAsyncGeneratorOfBatches,
    throttledStreamFromAsyncGeneratorOfBatches
};

function toReadableStream(source$, options) {
    const readableStream = rxStream.rxToStream(source$, (0, _extends3.default)({ objectMode: true }, options));
    readableStream._source$ = source$;
    return readableStream;
}

const pumpGeneratorToStream = (generator, stream$, options) => () => {
    for (const value of generator) {
        stream$.next(value);
    }
    stream$.complete();
};

const throttle = rateLimiter => (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (tokens) {
        // logger.log(`throttle(${tokens})@${moment().format('HH:mm:ss:SSS')}`);
        return rateLimiter.getTokens(tokens);
    });

    return function (_x) {
        return _ref.apply(this, arguments);
    };
})();

const pumpAsyncGeneratorToStream = (generator, stream$, options) => (0, _asyncToGenerator3.default)(function* () {
    //eslint-disable-next-line semi
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = (0, _asyncIterator3.default)(generator), _step, _value; _step = yield _iterator.next(), _iteratorNormalCompletion = _step.done, _value = yield _step.value, !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
            const value = _value;

            stream$.next(value);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                yield _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    stream$.complete();
});

const pumpAsyncGeneratorOfBatchesToStream = (generator, stream$, options) => (0, _asyncToGenerator3.default)(function* () {
    const { rate = 1, interval = 'second', burst = rate, initialContent = burst, consumedCapacityUnits = function ({ ConsumedCapacity: { CapacityUnits } }) {
            return CapacityUnits;
        } } = options;
    const throttleFn = throttle(new RateLimiter(rate, interval, burst, initialContent));
    let debt = 0;
    //eslint-disable-next-line semi
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = (0, _asyncIterator3.default)(generator), _step2, _value2; _step2 = yield _iterator2.next(), _iteratorNormalCompletion2 = _step2.done, _value2 = yield _step2.value, !_iteratorNormalCompletion2; _iteratorNormalCompletion2 = true) {
            const iterator = _value2;

            const metadata = iterator.metadata();
            debt = consumedCapacityUnits(metadata);
            for (const iValue of iterator) {
                stream$.next(iValue);
            }
            if (debt) {
                yield throttleFn(debt);
            }
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                yield _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    stream$.complete();
});

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

function fromGenerator(source, options = { objectMode: true, highWaterMark: 20 }) {
    return from(source, options, pumpGeneratorToStream);
}

function fromAsyncGenerator(source, options = { objectMode: true, highWaterMark: 20 }) {
    return from(source, options, pumpAsyncGeneratorToStream);
}

function fromAsyncGeneratorOfBatches(source, options = { objectMode: true, highWaterMark: 20 }) {
    return from(source, options, pumpAsyncGeneratorOfBatchesToStream);
}

function throttledStreamFromAsyncGeneratorOfBatches(source, options) {
    return throttled(source, options, pumpAsyncGeneratorOfBatchesToStream);
}