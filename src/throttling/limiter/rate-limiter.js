/* eslint-disable */
const moment = require('moment');

var TokenBucket = require('./token-bucket');

/**
 * A generic rate limiter. Underneath the hood, this uses a token bucket plus
 * an additional check to limit how many tokens we can remove each interval.
 * @author John Hurliman <jhurliman@jhurliman.org>
 *
 * @param {Number} tokensPerInterval Maximum number of tokens that can be
 *  removed at any given moment and over the course of one interval.
 * @param {String|Number} interval The interval length in milliseconds, or as
 *  one of the following strings: 'second', 'minute', 'hour', day'.
 * @param {Boolean} fireImmediately Optional. Whether or not the callback
 *  will fire immediately when rate limiting is in effect (default is false).
 */
var RateLimiter = function (tokensPerInterval, interval, fireImmediately) {
    this.tokenBucket = new TokenBucket(tokensPerInterval, tokensPerInterval,
        interval, null);

    // Fill the token bucket to start
    this.tokenBucket.content = tokensPerInterval;

    this.curIntervalStart = +new Date();
    this.tokensThisInterval = 0;
    this.fireImmediately = fireImmediately;
};

RateLimiter.prototype = {
    tokenBucket: null,
    curIntervalStart: 0,
    tokensThisInterval: 0,
    fireImmediately: false,

    /**
     * Remove the requested number of tokens and fire the given callback. If the
     * rate limiter contains enough tokens and we haven't spent too many tokens
     * in this interval already, this will happen immediately. Otherwise, the
     * removal and callback will happen when enough tokens become available.
     * @param {Number} count The number of tokens to remove.
     * @param {Function} callback(err, remainingTokens)
     * @returns {Boolean} True if the callback was fired immediately, otherwise
     *  false.
     */
    removeTokens: function (count, callback) {
        // Make sure the request isn't for more than we can handle
        if (count > this.tokenBucket.bucketSize) {
            process.nextTick(callback.bind(null, 'Requested tokens ' + count +
                ' exceeds maximum tokens per interval ' + this.tokenBucket.bucketSize,
                null));
            return false;
        }

        var self = this;
        var now = Date.now();

        // Advance the current interval and reset the current interval token count
        // if needed
        if (now - this.curIntervalStart >= this.tokenBucket.interval) {
            this.curIntervalStart = now;
            this.tokensThisInterval = 0;
        }

        // If we don't have enough tokens left in this interval, wait until the
        // next interval
        if (count > this.tokenBucket.tokensPerInterval - this.tokensThisInterval) {
            if (this.fireImmediately) {
                process.nextTick(callback.bind(null, null, -1));
            } else {
                var waitInterval = Math.ceil(
                    this.curIntervalStart + this.tokenBucket.interval - now);

                setTimeout(function () {
                    self.tokenBucket.removeTokens(count, afterTokensRemoved);
                }, waitInterval);
            }
            return false;
        }

        // Remove the requested number of tokens from the token bucket
        return this.tokenBucket.removeTokens(count, afterTokensRemoved);

        function afterTokensRemoved(err, tokensRemaining) {
            if (err) return callback(err, null);

            self.tokensThisInterval += count;
            callback(null, tokensRemaining);
        }
    },

    /**
     * Attempt to remove the requested number of tokens and return immediately.
     * If the bucket (and any parent buckets) contains enough tokens and we
     * haven't spent too many tokens in this interval already, this will return
     * true. Otherwise, false is returned.
     * @param {Number} count The number of tokens to remove.
     * @param {Boolean} True if the tokens were successfully removed, otherwise
     *  false.
     */
    tryRemoveTokens: function (count) {
        // Make sure the request isn't for more than we can handle
        if (count > this.tokenBucket.bucketSize)
            return false;

        var now = Date.now();

        // Advance the current interval and reset the current interval token count
        // if needed
        if (now - this.curIntervalStart >= this.tokenBucket.interval) {
            this.curIntervalStart = now;
            this.tokensThisInterval = 0;
        }

        // If we don't have enough tokens left in this interval, return false
        if (count > this.tokenBucket.tokensPerInterval - this.tokensThisInterval)
            return false;

        // Try to remove the requested number of tokens from the token bucket
        return this.tokenBucket.tryRemoveTokens(count);
    },

    /**
     * Returns the number of tokens remaining in the TokenBucket.
     * @returns {Number} The number of tokens remaining.
     */
    getTokensRemaining: function () {
        this.tokenBucket.drip();
        return this.tokenBucket.content;
    },
    /**
     * Ratelimiter::removeTokens explodes in case of a burst, instead of doing its purpose of throttling, effectively shaping the traffic
     * this behavior is not what is expected https://github.com/jhurliman/node-rate-limiter/blob/91e2d77fcb0cf25d2ee70a1f7cbdff89d1f41b75/lib/rateLimiter.js#L45
     * This method replaces `removeTokens` and achived the following behavior:
     * 1) Learning about the burst after the fact, it would keep the RateLimiter and potentially the parent Bucket Hierarchy in sync by consuming
     * the burst amount of tokens over the next n intervals.
     * 2) Burst on demand? what?
     * @param count
     * @param callback
     * @param chunkPercent
     * @returns [Promise(remaining)]
     */
    removeTokensSmoothly: async function (count, chunkPercent = 0.9) {
        const promisify = fn => (...args) => {
            return new Promise((resolve, reject) => {
                fn(...args, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
        };

        const removeTokens = promisify(this.removeTokens.bind(this));
        if (count <= this.tokenBucket.bucketSize) {
            return [removeTokens(count)];
            // [new Promise((resolve, reject) => {
            //     this.removeTokens(count, (err, remaining) => {
            //         if (err) return reject(err);
            //         resolve(remaining);
            //     });
            // })];
        } else {
            const interval = this.tokenBucket.interval;
            const tokensPerInterval = this.tokenBucket.tokensPerInterval;
            const numIntervals = Math.ceil(count / tokensPerInterval);
            const shapingTimeMs = numIntervals * interval;
            console.log(`removeTokensSmoothly::burst@${moment().format('HH:mm:ss:SSS')}`, {
                count,
                interval,
                tokensPerInterval,
                shapingTimeMs
            });
            console.log('-------------------------------------------------------------------------');
            let consumed = 0;
            let chunk = Math.floor(tokensPerInterval * chunkPercent);
            let remaining = 0; // remaining this interval, would eventually callbacl(remaining last interval)
            while (consumed < count) {
                chunk = Math.min(chunk, count - consumed);
                remaining = await removeTokens(chunk);
                //     new Promise((resolve, reject) => {
                //     this.removeTokens(chunk, (err, remaining) => {
                //         if (err) {
                //             callback(err);
                //             return reject(err);
                //         }
                //         return resolve(remaining);
                //     });
                // });
                consumed += chunk;
                console.log(`removeTokensSmoothly::chunk@${moment().format('HH:mm:ss:SSS')}`, {consumed, count, chunk});
                console.log('-------------------------------------------------------------------------');
            }
            // callback(null, remaining);
            return [Promise.resolve(remaining)];
        }
    }
};

module.exports = RateLimiter;
