/* eslint-disable prefer-arrow-callback */
const {RateLimiter} = require('./limiter');
const through = require('through2');

function throttlingStream({rate = 1000, interval = 'second', burst = rate, initialContent = burst, tokensPerChunk = () => 1, objectMode = true, highWaterMark = 1} = {}) {
    const rateLimiter = new RateLimiter(rate, interval, burst, initialContent);
    return through({objectMode, highWaterMark}, function (chunk, enc, next) {
        rateLimiter.getTokens(tokensPerChunk(chunk))
            .then(() => next(null, chunk))
            .catch(error => next(error));
    }, function (next) {
        next();
    });
}

module.exports = {
    throttlingStream
};
