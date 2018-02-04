const through = require('through2');
const csvparse = require('csv-parse');

const logger = require('./logger');
const sns = require('./aws/sns');
const kinesis = require('./aws/kinesis');
const {LineRanges} = require('./streams-line-ranges');

/**
 * Creates a CSV parser transform stream with the provided options
 * @param {array|boolean|function} columns
 * List of fields as an array, a user defined callback accepting the first line and returning the column names,
 * or true if autodiscovered in the first CSV line. Defaults to null.
 * Affects the result data set in the sense that records will be objects instead of arrays.
 * A value "false" skips the all column.
 * @param {char} delimiter
 * Set the field delimiter. One character only. Defaults to "," (comma).
 * @param {char} quote
 * Optional character surrounding a field. One character only. Defaults to double quote.
 * @param {boolean} trim
 * If true, ignore whitespace immediately around the delimiter.
 * Defaults to false. Does not remove whitespace in a quoted field.
 * @returns {TransformStream} Returns a transform stream, emits `readable`, `error` and `end` events.
 */
function csvParserTransformStream({columns = true, delimiter = ',', quote = '"', trim = true}) {
    return csvparse({columns, delimiter, quote, trim});
}

/**
 * Creates a transform stream, applying transformFn to each record/chunk
 * @param {function} transformFn function to be applied to each chunk
 * @param {function} flushFn function that is called just prior to the stream ending.
 * Can be used to finish up any processing that may be in progress.
 * @returns {TransformStream} Returns a transform stream, emits `data` and `end` events.
 */
function transformStream(transformFn = function (chunk, enc, next) {
    next(null, chunk);
}, flushFn = function (next) {
    next();
}) {
    return through(transformFn, flushFn);
}

/**
 * Creates an object transform stream, applying transformFn to each record/chunk
 * @param {function} transformFn function to be applied to each chunk
 * @param {function} flushFn function that is called just prior to the stream ending.
 * Can be used to finish up any processing that may be in progress.
 * @returns {TransformStream} Returns a transform stream, emits `data` and `end` events.
 */
function objectTransformStream(transformFn = function (chunk, enc, next) {
    next(null, chunk);
}, flushFn = function (next) {
    next();
}) {
    return through.obj(transformFn, flushFn);
}

/**
 * Creates an object transform stream, publishing each record/chunk to SNS
 * @param {string} topicArn SNS topic ARN
 * @param {string} subject SNS message subject
 * @param {object} options SNS() constructor options, override region or other options here
 * @param {object} params for SNS.publish() extended params,
 * merges/overrides already passed {TopciArn, Message, Subject} params.
 * @returns {TransformStream} Returns a transform stream, emits `data` and `finish` events. Emits `delivery-stream-error` then `end` in case of error.
 */
function snsWriteStream(topicArn, subject = '', options = {}, params = {}) {
    return through.obj(function (chunk, enc, next) {
        const that = this;
        sns.publish(topicArn, subject, chunk, options, params)
            .then(({MessageId}) => {
                next(null, chunk);
            })
            .catch(err => {
                logger.error(err);
                // next(err);
                // that.emit('error', err); // Might cause up-streams to unpipe, thus emitting `delivery-stream-error` instead
                that.emit('delivery-stream-error', err);
                that.emit('end'); // Tells up-stream streams that we have ended, doesn't actually `close`/`destroy` the stream
                that.end(); // Won't trigger the `end` event, cleanup not necessary in our transform case, added for the sake of completeness
            });
    });
}

/**
 * Creates an object transform stream, publishing each record/chunk to SNS then publish to an rxjs published$
 * @param {Rx.Subject} Rx.Subject or Rx.Observable
 * @param {string} topicArn SNS topic ARN
 * @param {string} subject SNS message subject
 * @param {object} options SNS() constructor options, override region or other options here
 * @param {object} params for SNS.publish() extended params,
 * merges/overrides already passed {TopciArn, Message, Subject} params.
 * @returns {TransformStream} Returns a transform stream, emits `data` and `finish` events. Emits `delivery-stream-error` then `end` in case of error.
 */
function snsWritePublishStream(published$, topicArn, subject = '', options = {}, params = {}, highWaterMark = 10) {
    return through({objectMode: true, highWaterMark}, function (chunk, enc, next) {
        const that = this;
        that.counter = that.counter || 0;
        sns.publish(topicArn, subject, chunk, options, params)
            .then(({MessageId}) => {
                published$.next({MessageId, processed: ++that.counter});
                next();
            })
            .catch(error => {
                logger.error(error);
                published$.error({error, processed: that.counter});
                published$.complete();
                // that.emit('error', err); // Might cause up-streams to unpipe, thus emitting `delivery-stream-error` instead
                that.emit('delivery-stream-error', error);
                that.emit('end'); // Tells up-stream streams that we have ended, doesn't actually `close`/`destroy` the stream
                that.end(); // Won't trigger the `end` event, cleanup not necessary in our transform case, added for the sake of completeness
            });
    }, next => {
        published$.complete();
        next();
    });
}

/**
 * Creates an object transform stream, publishing each record/chunk to Kinesis then publish to an rxjs published$
 * @param {Rx.Subject} Rx.Subject or Rx.Observable
 * @param {string} streamName Kinesis stream name
 * @param {string} partitionKey Kinesis partition key
 * @param {object} options Kinesis() constructor options, override region or other options here
 * @param {object} params for Kinesis.putRecord() extended params,
 * merges/overrides already passed {Data, PartitionKey, StreamName} params.
 * @returns {TransformStream} Returns a transform stream, emits `data` and `finish` events. Emits `delivery-stream-error` then `end` in case of error.
 */
function kinesisWritePublishStream(published$, streamName, partitionKey, options = {}, params = {}, highWaterMark = 10) {
    return through({objectMode: true, highWaterMark}, function (chunk, enc, next) {
        const that = this;
        that.counter = that.counter || 0;
        that.previousSequenceNumber = that.previousSequenceNumber || null;
        const orderingParams = that.previousSequenceNumber ? {SequenceNumberForOrdering: that.previousSequenceNumber} : {};

        kinesis.putRecord(streamName, partitionKey, chunk, options, {...params, ...orderingParams})
            .then(({ShardId, SequenceNumber, EncryptionType}) => {
                published$.next({SequenceNumber, processed: ++that.counter});
                that.previousSequenceNumber = SequenceNumber;
                next();
            })
            .catch(error => {
                logger.error(error);
                published$.error({error, processed: that.counter});
                published$.complete();
                // that.emit('error', err); // Might cause up-streams to unpipe, thus emitting `delivery-stream-error` instead
                that.emit('delivery-stream-error', error);
                that.emit('end'); // Tells up-stream streams that we have ended, doesn't actually `close`/`destroy` the stream
                that.end(); // Won't trigger the `end` event, cleanup not necessary in our transform case, added for the sake of completeness
            });
    }, next => {
        published$.complete();
        next();
    });
}

function lineStream({skip = 0, take = -1, delimiter = '\n', trimDelimiter = true, header = false} = {}) {
    let buffer = '';
    // let counter = 0;
    let taken = 0;
    let skipped = 0;
    return through(function (chunk, enc, next) {
        buffer += chunk.toString();
        const lines = buffer.split(delimiter);
        buffer = lines.pop();
        const that = this;
        that.counter = that.counter || 0;
        if (that.counter === 0 && header) {
            if (lines.length > 0) {
                const headerLine = lines.shift();
                that.push(trimDelimiter ? headerLine : headerLine + delimiter);
            }
        }

        that.counter += lines.length;
        lines.forEach(line => {
            if (skip <= skipped) {
                if (take < 0 || taken < take) {
                    that.push(trimDelimiter ? line : line + delimiter);
                    taken++;
                }
            } else {
                skipped++;
            }
        });
        if (take >= 0 && taken >= take) { // take last line into consideration?
            that.end();
        }
        next();
    }, function (next) {
        const that = this;
        if (buffer === '') {
            return next();
        }
        if (skip <= skipped) {
            if (take < 0 || taken < take) {
                that.push(trimDelimiter ? buffer : buffer + delimiter);
                taken++;
                that.counter++;
            }
        } else {
            skipped++;
            that.counter++;
        }
        next();
    });
}

function lineStreamWithByteRange({skip = 0, take = -1, byteRangeStart = 0, encoding = 'utf-8', delimiter = '\n', trimDelimiter = true, header = false, initHeader, probe = false} = {}) {
    let buffer = '';
    let taken = 0;
    let skipped = 0;
    const delimterSize = Buffer.from(delimiter, encoding).length;

    return through(function (chunk, enc, next) {
        buffer += chunk.toString();
        const lines = buffer.split(delimiter);
        buffer = lines.pop();
        const that = this;

        that.counter = that.counter || 0;
        // If we `skip` all the way to the end, we still want to record last known lineRange information
        that.lineRangeBuffer = that.lineRangeBuffer || {lineNumber: 1, byteRangeStart: 0, byteRangeEnd: 0};
        that.lineRanges = that.lineRanges || new LineRanges();
        that.byteRangeStart = that.byteRangeStart || byteRangeStart;

        if (that.counter === 0) {
            if (header && lines.length > 0) {
                const headerLine = lines.shift();
                that.push(trimDelimiter ? headerLine : headerLine + delimiter);
                const lineSize = Buffer.from(headerLine, encoding).length;
                that.lineRangeBuffer = {
                    lineNumber: that.counter + 1,
                    byteRangeStart: that.byteRangeStart,
                    byteRangeEnd: that.byteRangeStart + lineSize + delimterSize - 1, // https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35. bytes=start-end both inclusive
                    emitted: header
                };
                that.lineRanges.set(that.lineRangeBuffer.lineNumber, that.lineRangeBuffer.byteRangeStart, that.lineRangeBuffer.byteRangeEnd);
                that.byteRangeStart += lineSize + delimterSize;
                that.counter++; // we increment after publishing in order to align published index with `processed` record counter, i.e. we wouldn't want to count the header as a record
            } else if (initHeader) {
                that.push(trimDelimiter ? initHeader : initHeader + delimiter);
                // external initial header was used, doesn't affect our counters
            }
        }

        lines.forEach((line) => {
            let emitted = false;
            if (skip <= skipped) {
                if (take < 0 || taken < take) {
                    that.push(trimDelimiter ? line : line + delimiter);
                    taken++;
                    emitted = true;
                }
            } else {
                skipped++;
            }

            const lineSize = Buffer.from(line, encoding).length;
            that.lineRangeBuffer = {
                lineNumber: that.counter + 1,
                byteRangeStart: that.byteRangeStart,
                byteRangeEnd: that.byteRangeStart + lineSize + delimterSize - 1, // https://nodejs.org/api/fs.html, Both start and end are inclusive and start counting at 0
                emitted
            };
            if (probe || emitted) { // probe = true is discovery mode, suitable to prime a range with lineIndex-byteStart mapping continuation parameters
                that.lineRanges.set(that.lineRangeBuffer.lineNumber, that.lineRangeBuffer.byteRangeStart, that.lineRangeBuffer.byteRangeEnd);
            }
            that.byteRangeStart += lineSize + delimterSize;
            that.counter++;
        });

        if (take >= 0 && taken >= take) { // take last line into consideration?
            that.end();
        }
        next();
    }, function (next) {
        const that = this;
        let emitted = false;
        const stillSkipping = skip > skipped;

        if (buffer === '') { // delimiter-terminated file
            if (stillSkipping) {
                /**
                 * We might have been skipping all the way to the end, we need the last lineRange seen
                 * NOTE: this is useful in cases where file append is possible,
                 * previous run would inform us about the previous file limits,
                 * next run can work with the newly appended data only
                 */
                that.lineRanges.set(that.lineRangeBuffer.lineNumber, that.lineRangeBuffer.byteRangeStart, that.lineRangeBuffer.byteRangeEnd);
            } else {
                return next(); // Nothing to do, lineRange has been already recorded
            }
        } else {
            if (stillSkipping) {
                skipped++;
            } else if (take < 0 || taken < take) {
                that.push(trimDelimiter ? buffer : buffer + delimiter);
                taken++;
                emitted = true;
            }
            that.counter++;
            const lineSize = Buffer.from(buffer, encoding).length;
            that.lineRangeBuffer = {
                lineNumber: that.counter,
                byteRangeStart: that.byteRangeStart,
                byteRangeEnd: that.byteRangeStart + lineSize + delimterSize - 1, emitted
            };
            that.lineRanges.set(that.lineRangeBuffer.lineNumber, that.lineRangeBuffer.byteRangeStart, that.lineRangeBuffer.byteRangeEnd);
        }
        next();
    });
}

const {throttlingStream} = require('./throttling/stream');

module.exports = {
    csvParserTransformStream,
    transformStream,
    objectTransformStream,
    snsWriteStream,
    snsWritePublishStream,
    kinesisWritePublishStream,
    lineStream,
    lineStreamWithByteRange,
    throttlingStream
};
