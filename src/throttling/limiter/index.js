/* eslint-disable no-loop-func */
const Rx = require('rxjs');
const moment = require('moment');
// exports.RateLimiter = require('./rate-limiter');
// exports.TokenBucket = require('./token-bucket');
const RateLimiter = require('./rateLimiter');
const TokenBucket = require('./tokenBucket');

const logger = require('../../logger');

RateLimiter.prototype.getTokens = async function (count) {
    // logger.logLine(`getTokens(${count})@${moment().format('HH:mm:ss:SSS')}`);
    const that = this;
    if (count <= this.tokenBucket.bucketSize) {
        // logger.logLine(`getTokens::bounded@${moment().format('HH:mm:ss:SSS')}`, count);
        return new Promise((resolve, reject) => {
            this.removeTokens(count, (err, remaining) => {
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
    // logger.logLine(`getTokens::burst:penalty@${moment().format('HH:mm:ss:SSS')}`, {
    //     count,
    //     interval,
    //     tokensPerInterval,
    //     totalWaitTimeMs: shapingTimeMs
    // });
    // logger.line(80);
    let consumed = 0;
    let chunk = this.tokenBucket.bucketSize;
    while (consumed < count) {
        chunk = Math.min(chunk, count - consumed);

        consumed += await new Promise((resolve, reject) => {
            that.removeTokens(chunk, (error, remaining) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(chunk);
                }
            });
        });

        // logger.logLine(`getTokens::chunk@${moment().format('HH:mm:ss:SSS')}`, {consumed, count, chunk});
        // logger.line(80);
    }
    return consumed;
};


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
