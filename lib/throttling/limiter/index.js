'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-loop-func */
const Rx = require('rxjs');
const moment = require('moment');
// exports.RateLimiter = require('./rate-limiter');
// exports.TokenBucket = require('./token-bucket');
const RateLimiter = require('./rateLimiter');
const TokenBucket = require('./tokenBucket');

const logger = require('../../logger');

RateLimiter.prototype.getTokens = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (count) {
        var _this = this;

        logger.logLine(`getTokens(${count})@${moment().format('HH:mm:ss:SSS')}`);
        const that = this;
        if (count <= this.tokenBucket.bucketSize) {
            logger.logLine(`getTokens::bounded@${moment().format('HH:mm:ss:SSS')}`, count);
            return new _promise2.default(function (resolve, reject) {
                _this.removeTokens(count, function (err, remaining) {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(count);
                });
            });
        }

        const interval = this.tokenBucket.interval;
        const tokensPerInterval = this.tokenBucket.tokensPerInterval;
        const shapingTimeMs = Math.ceil(count * (interval / tokensPerInterval));
        const numIntervals = shapingTimeMs / interval;
        logger.logLine(`getTokens::burst:penalty@${moment().format('HH:mm:ss:SSS')}`, {
            count,
            interval,
            tokensPerInterval,
            totalWaitTimeMs: shapingTimeMs
        });
        logger.line(80);
        let consumed = 0;
        let chunk = this.tokenBucket.bucketSize;
        while (consumed < count) {
            chunk = Math.min(chunk, count - consumed);

            consumed += yield new _promise2.default(function (resolve, reject) {
                that.removeTokens(chunk, function (error, remaining) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(chunk);
                    }
                });
            });

            logger.logLine(`getTokens::chunk@${moment().format('HH:mm:ss:SSS')}`, { consumed, count, chunk });
            logger.line(80);
        }
        return consumed;
    });

    return function (_x) {
        return _ref.apply(this, arguments);
    };
})();

module.exports = {
    RateLimiter,
    TokenBucket
};

/**
 * - RateLimiter should allow consumer to return unused tokens
 * - RateLimiter should use an alternative for callbacks to allow chaining, e.g. Generators, AsyncGenerators or Observables
 * - RateLimiter should not error if consumer asks for n > rate, alternatively it should block for n * period
 * - RateLimiter should refill whole tokens or at least avoid floating point numbers rounding off
 * - RateLimiter should use process.hrtime instaed of +new Date()
 */