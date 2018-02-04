/* eslint-disable */
var TokenBucket = require('./tokenBucket');

const moment = require('moment');
const logger = require('../../logger');

/**
 * A generic rate limiter. Underneath the hood, this uses a token bucket plus
 * an additional check to limit how many tokens we can remove each interval.
 * @author John Hurliman <jhurliman@jhurliman.org>
 *
 * @param {Number} rate, a.k.a rate: Maximum number of tokens that can be
 *  removed at any given moment and over the course of one interval.
 * @param {String|Number} interval The interval length in milliseconds, or as
 *  one of the following strings: 'second', 'minute', 'hour', day'.
 *  @param {Number} burst, maximum allowed burst only if enough tokens have accumulated
 * @param {Boolean} fireImmediately Optional. Whether or not the callback
 *  will fire immediately when rate limiting is in effect (default is false).
 */
var RateLimiter = function(rate, interval, burst, initialContent, fireImmediately) {

    if (typeof interval === 'string') {
        // Normalize interval and rate to n/sec, otherwise default for burst and initial content defaults are dependant on the rate resolution (sec, min, hr, ...)
        switch (interval) {
            case 'sec': case 'second':
                break;
            case 'min': case 'minute':
                rate /= 60;
                break;
            case 'hr': case 'hour':
                rate /= 60 * 60;
                break;
            case 'day':
                rate /= 60 * 60 * 24;
                break;
        }
        interval = 'second';
    }

    burst = burst === undefined ? rate : burst;
    initialContent = initialContent === undefined ? burst : initialContent;

    // logger.log({rate, interval, burst, initialContent});

    this.tokenBucket = new TokenBucket(burst, rate, interval, null);

    // Fill the token bucket to start
    this.tokenBucket.content = initialContent;

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
    removeTokens: function(count, callback) {
        // logger.logLine(`removeTokens(${count})@${moment().format('HH:mm:ss:SSS')}`);
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
        if (count > this.tokenBucket.rate - this.tokensThisInterval) {
            if (this.fireImmediately) {
                process.nextTick(callback.bind(null, null, -1));
            } else {
                var waitInterval = Math.ceil(
                    this.curIntervalStart + this.tokenBucket.interval - now);

                setTimeout(function() {
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
    tryRemoveTokens: function(count) {
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
        if (count > this.tokenBucket.rate - this.tokensThisInterval)
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
    }
};

module.exports = RateLimiter;