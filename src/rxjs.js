const Rx = require('rxjs/Rx');
const _ = require('lodash');

const logger = require('./logger');
const sns = require('./aws/sns');

const sleep = async timeout => new Promise((resolve, reject) => setTimeout(resolve, timeout));

async function waitUntil(promise, timeout) {
    return Rx.Observable.fromPromise(promise).takeUntil(Rx.Observable.timer(timeout)).toPromise();
}

async function waitOrReject(promise, timeout, rejectWith = new Error(`Timeout after ${timeout}`)) {
    const promise$ = Rx.Observable.fromPromise(promise);
    const throwAfter$ = Rx.Observable.timer(timeout).flatMap(value => Rx.Observable.throw(rejectWith));
    return Rx.Observable.merge(promise$, throwAfter$).take(1).toPromise();
}

async function timeout(promise, timeout) {
    return Rx.Observable.fromPromise(promise).timeout(timeout).toPromise();
}

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
        sns.publish(topicArn, subject, record, options, params)
            .then(({MessageId}) => {
                snsStream$.next({MessageId, processed: ++index});
                snsStream$.complete();
            })
            .catch(error => {
                logger.error(error);
                snsStream$.error({error, processed: index});
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
    return Rx.Observable.create(async observer => {
        let result = await asyncFn(...args);
        while (!empty(result)) {
            _.map(result, x => observer.next(x));
            await sleep(delay);
            result = await asyncFn(...args);
        }
        observer.complete();
    }).share();
}

function pollUntil(asyncFn, {
    repeatDelay = 0, predicate = _.isEmpty, doAction = () => {
    }
}, ...args) {
    return Rx.Observable.create(async observer => {
        const result = await asyncFn(...args);
        if (predicate(result)) {
            observer.complete();
        } else {
            doAction(result);
            observer.error(result);
        }
    })
    // .catch((error, caught$) => Rx.Observable.timer(repeatDelay).ignoreElements().concat(caught$)); // identical to retry(count = -1) but with a chance to delay
        .retryWhen(error$ => error$
            .do(error => logger.log('predicate(intermediate-result) returned false, intermediate-result:', error))
            .delay(repeatDelay)); // identical to retry(count = -1) but with a chance to delay
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
    repeatDelay = 0, predicate = _.isEmpty, doAction = () => {
    }
}, ...args) {
    return Rx.Observable.create(async observer => {
        try {
            const result = await asyncFn(...args);
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
    })
    // .catch((error, caught$) => Rx.Observable.timer(repeatDelay).ignoreElements().concat(caught$)); // identical to retry(count = -1) but with a chance to delay
        .retryWhen(error$ => error$
            .do(error => logger.log('predicate(intermediate-result) returned false, intermediate-result:', error))
            .delay(repeatDelay)); // identical to retry(count = -1) but with a chance to delay
}

function retryWhile(asyncFn, delay = 0, predicate = _.isEmpty, doAction = () => {
}, ...args) {
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
