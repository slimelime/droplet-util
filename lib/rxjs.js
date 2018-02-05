'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let waitUntil = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (promise, timeout) {
        return Rx.Observable.fromPromise(promise).takeUntil(Rx.Observable.timer(timeout)).toPromise();
    });

    return function waitUntil(_x2, _x3) {
        return _ref2.apply(this, arguments);
    };
})();

let waitOrReject = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (promise, timeout, rejectWith = new Error(`Timeout after ${timeout}`)) {
        const promise$ = Rx.Observable.fromPromise(promise);
        const throwAfter$ = Rx.Observable.timer(timeout).flatMap(function (value) {
            return Rx.Observable.throw(rejectWith);
        });
        return Rx.Observable.merge(promise$, throwAfter$).take(1).toPromise();
    });

    return function waitOrReject(_x4, _x5) {
        return _ref3.apply(this, arguments);
    };
})();

let timeout = (() => {
    var _ref4 = (0, _asyncToGenerator3.default)(function* (promise, timeout) {
        return Rx.Observable.fromPromise(promise).timeout(timeout).toPromise();
    });

    return function timeout(_x6, _x7) {
        return _ref4.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Rx = require('rxjs/Rx');
const _ = require('lodash');

const logger = require('./logger');
const sns = require('./aws/sns');

const sleep = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (timeout) {
        return new _promise2.default(function (resolve, reject) {
            return setTimeout(resolve, timeout);
        });
    });

    return function sleep(_x) {
        return _ref.apply(this, arguments);
    };
})();

function timeout$(timeout, timeoutError = new Error(`Timeout after ${timeout}`)) {
    return Rx.Observable.timer(timeout).concatMap(value => Rx.Observable.throw(timeoutError));
}

function timeoutWith$(timeout, errorWith = () => new Error(`Timeout after ${timeout}`)) {
    return Rx.Observable.timer(timeout).concatMap(value => Rx.Observable.throw(errorWith()));
}

function snsWriteStream(stream$, topicArn, subject = '', options = {}, params = {}) {
    return stream$.concatMap((record, index) => {
        const snsStream$ = new Rx.Subject();
        // @TODO: what about last api call that hasn't resolved yet, we might end up with an overlap of one record when we use continuation
        // console.log(index + 1, 'snsWriteStream, about to publish record:', record);
        sns.publish(topicArn, subject, record, options, params).then(({ MessageId }) => {
            snsStream$.next({ MessageId, processed: ++index });
            snsStream$.complete();
        }).catch(error => {
            logger.error(error);
            snsStream$.error({ error, processed: index });
        });
        return snsStream$;
    });
}

/**
 * Emits one value at a time from the asyncFn results, completes the observable when asyncFn returns an empty iterable
 * @param asyncFn: returns a promise of an iterable collection (list, map, ...)
 * @param timeout: sleep time between successive calls to asyncFn, default 0
 * @param empty: function to check if a collection/iterable is empty, defaults to lodash implementation
 * @param args: args for the asyncFn
 * @returns {*|Observable}
 */
function takeUntilEmpty(asyncFn, delay = 0, empty = _.isEmpty, ...args) {
    return Rx.Observable.create((() => {
        var _ref5 = (0, _asyncToGenerator3.default)(function* (observer) {
            let result = yield asyncFn(...args);
            while (!empty(result)) {
                _.map(result, function (x) {
                    return observer.next(x);
                });
                yield sleep(delay);
                result = yield asyncFn(...args);
            }
            observer.complete();
        });

        return function (_x8) {
            return _ref5.apply(this, arguments);
        };
    })()).share();
}

function pollUntil(asyncFn, {
    repeatDelay = 0, predicate = _.isEmpty, doAction = () => {}
}, ...args) {
    return Rx.Observable.create((() => {
        var _ref6 = (0, _asyncToGenerator3.default)(function* (observer) {
            const result = yield asyncFn(...args);
            if (predicate(result)) {
                observer.complete();
            } else {
                doAction(result);
                observer.error(result);
            }
        });

        return function (_x9) {
            return _ref6.apply(this, arguments);
        };
    })())
    // .catch((error, caught$) => Rx.Observable.timer(repeatDelay).ignoreElements().concat(caught$)); // identical to retry(count = -1) but with a chance to delay
    .retryWhen(error$ => error$.do(error => logger.log('predicate(intermediate-result) returned false, intermediate-result:', error)).delay(repeatDelay)); // identical to retry(count = -1) but with a chance to delay
}

// function pollUntilError(asyncFn, {
//     repeatDelay = 0, predicate = _.isEmpty, errorPredicate = () => true, doAction = () => {
//     }
// }, ...args) {
//     return Rx.Observable.create(async observer => {
//         asyncFn(...args)
//             .then(result => {
//                 if (predicate(result)) {
//                     observer.complete();
//                 } else {
//                     doAction(result);
//                     observer.error(result);
//                 }
//             })
//             .catch(error => {
//                 if (errorPredicate(error)) {
//                     observer.complete();
//                 } else {
//                     doAction(error);
//                     observer.error(error);
//                 }
//             });
//     })
//
//         .retryWhen(error$ => error$
//             .filter(error => errorPredicate(error))
//             .do(error => logger.log('predicate(intermediate-result) returned false, intermediate-result:', error))
//             .delay(repeatDelay)); // identical to retry(count = -1) but with a chance to delay
// }

/**
 *
 * @param asyncFn
 * @param repeatDelay
 * @param predicate
 * @param doAction
 * @param args
 * @returns {Observable<any> | *}
 */
function pollUntilRejectsWith(asyncFn, {
    repeatDelay = 0, predicate = _.isEmpty, doAction = () => {}
}, ...args) {
    return Rx.Observable.create((() => {
        var _ref7 = (0, _asyncToGenerator3.default)(function* (observer) {
            try {
                const result = yield asyncFn(...args);
                doAction(result);
                observer.error(result);
            } catch (err) {
                if (predicate(err)) {
                    observer.complete();
                } else {
                    doAction(err);
                    observer.error(err);
                }
            }
        });

        return function (_x10) {
            return _ref7.apply(this, arguments);
        };
    })())
    // .catch((error, caught$) => Rx.Observable.timer(repeatDelay).ignoreElements().concat(caught$)); // identical to retry(count = -1) but with a chance to delay
    .retryWhen(error$ => error$.do(error => logger.log('predicate(intermediate-result) returned false, intermediate-result:', error)).delay(repeatDelay)); // identical to retry(count = -1) but with a chance to delay
}

function retryWhile(asyncFn, delay = 0, predicate = _.isEmpty, doAction = () => {}, ...args) {
    return pollUntil(asyncFn, delay, result => !predicate(result), doAction, ...args);
}

function createFromPromise(asyncFn, ...args) {
    return Rx.Observable.defer(() => Rx.Observable.fromPromise(asyncFn(...args)));
}

module.exports = {
    waitUntil,
    waitOrReject,
    timeout,
    snsWriteStream,
    timeout$,
    timeoutWith$,
    takeUntilEmpty,
    pollUntil,
    retryWhile,
    pollUntilRejectsWith,
    sleep,
    createFromPromise
};