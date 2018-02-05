'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let main = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (take = 5, limit = 1000) {
        const tokensGenerator = throttle(take, 'second')(take);
        let consumed = 0;
        let remaining;
        let done = false;
        let burst = take;
        do {
            ({ remaining, done } = yield tokensGenerator.next(burst)); // <-- we communicate the next take into the generator
            // const remaining = await value; // <-- for a regular generator yielding a promise, it boxes value in a promise
            consumed += burst;
            logger.logLine(`throttle::next@${moment().format('HH:mm:ss:SSS')}`, { consumed, limit, remaining });
            logger.line(80);
            burst = Math.random() < 0.2 ? take * 10 : take;
            burst = Math.min(burst, limit - consumed);
            /**
             * NOTE: with dynamo or any AWS API, they might allow a burst and return consumed units after the fact, e.g. you hav econsumed 2n, where x is allowed capacity units.
             * In this case, the behavior of removeTokensWithPenalty is effectively payback by waiting 2 intervals, 1) playing it safe, 2) still consumes tokens from any HTB.
             * Other scenario would be a burst in demand for tokens, e.g. in the case of queue processing, the behavior would shape the token consumption over the required period of time.
             * In both cases, the behavior would respects the quota possibly enforced by a parent bucket.
             */
        } while (!done && consumed < limit);
        return tokensGenerator.return(consumed); // <-- cleanup generator resources
    });

    return function main() {
        return _ref2.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-loop-func */
const moment = require('moment');

const { RateLimiter, TokenBucket } = require('./limiter');
const logger = require('../logger');

module.exports = { throttle };

/*
 * Creates a token generator that blocks until the requested tokens are satisfiable, given the rate and refill interval constraints
 * @param rate: allowed rate per interval, i.e. initial burst rate == refill rate
 * @param interval: refill interval, RateLimiter refills fractions of tokens, but would callback when the content >= requested count
 * @returns removeTokens :: count -> generator of {done: true|false, value: Promise(remaining-tokens-in-interval)}
 */
function throttle(rate, interval, burst, initialContent) {
    const rateLimiter = new RateLimiter(rate, interval, burst, initialContent);

    return (() => {
        var _ref = (0, _asyncToGenerator3.default)(function* (tokens) {
            logger.log(`throttle(${tokens})@${moment().format('HH:mm:ss:SSS')}`);
            return rateLimiter.getTokens(tokens);
        });

        return function (_x) {
            return _ref.apply(this, arguments);
        };
    })();
}

const rate = parseInt(process.argv[2], 10) || 5;
const limit = parseInt(process.argv[3], 10) || 100;

// logger.time(`${limit}-tokens`)
main(rate, limit).then(result => {
    logger.logLine(result);
    logger.timeEnd(`${limit}-tokens`);
}).catch(error => {
    logger.error(error);
    logger.timeEnd(`${limit}-tokens`);
});