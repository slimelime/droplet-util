'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncGenerator2 = require('babel-runtime/helpers/asyncGenerator');

var _asyncGenerator3 = _interopRequireDefault(_asyncGenerator2);

var _asyncIterator2 = require('babel-runtime/helpers/asyncIterator');

var _asyncIterator3 = _interopRequireDefault(_asyncIterator2);

var _asyncGeneratorDelegate2 = require('babel-runtime/helpers/asyncGeneratorDelegate');

var _asyncGeneratorDelegate3 = _interopRequireDefault(_asyncGeneratorDelegate2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let getBucketLocation = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (bucket, options = {}, params = {}) {
        const s3 = new AWS.S3((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Bucket: bucket
        };
        return s3.getBucketLocation((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function getBucketLocation(_x) {
        return _ref.apply(this, arguments);
    };
})();

let getObject = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (bucket, key, options = {}, params = {}) {
        const s3 = new AWS.S3((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Bucket: bucket,
            Key: key
        };
        return s3.getObject((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function getObject(_x2, _x3) {
        return _ref2.apply(this, arguments);
    };
})();

let copyObject = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (bucket, key, copySource, options = {}, params = {}) {
        const s3 = new AWS.S3((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Bucket: bucket,
            Key: key,
            CopySource: copySource
        };
        return s3.copyObject((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function copyObject(_x4, _x5, _x6) {
        return _ref3.apply(this, arguments);
    };
})();

let deleteObject = (() => {
    var _ref4 = (0, _asyncToGenerator3.default)(function* (bucket, key, options = {}, params = {}) {
        const s3 = new AWS.S3((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Bucket: bucket,
            Key: key
        };
        return s3.deleteObject((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function deleteObject(_x7, _x8) {
        return _ref4.apply(this, arguments);
    };
})();

let moveObject = (() => {
    var _ref5 = (0, _asyncToGenerator3.default)(function* (fromBucket, fromKey, toBucket, toKey = fromKey, options = {}) {
        yield copyObject(toBucket, toKey, `${fromBucket}/${fromKey}`, options, { ServerSideEncryption: 'AES256' });
        yield deleteObject(fromBucket, fromKey, options);
        return { fromBucket, fromKey, toBucket, toKey };
    });

    return function moveObject(_x9, _x10, _x11) {
        return _ref5.apply(this, arguments);
    };
})();

let objectExists = (() => {
    var _ref6 = (0, _asyncToGenerator3.default)(function* (bucket, key, options = {}, params = {}) {
        const s3 = new AWS.S3((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Bucket: bucket,
            Key: key
        };
        try {
            yield s3.headObject((0, _extends3.default)({}, requiredParams, params)).promise();
            return true;
        } catch (ex) {
            return false;
        }
    });

    return function objectExists(_x12, _x13) {
        return _ref6.apply(this, arguments);
    };
})();

let upload = (() => {
    var _ref7 = (0, _asyncToGenerator3.default)(function* (bucket, key, body, SSE = 'AES256', options = {}, params = {}) {
        const s3 = new AWS.S3((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Bucket: bucket,
            Key: key,
            Body: body,
            ServerSideEncryption: SSE
        };
        return s3.upload((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function upload(_x14, _x15, _x16) {
        return _ref7.apply(this, arguments);
    };
})();

let listObjects = (() => {
    var _ref8 = (0, _asyncToGenerator3.default)(function* (bucket, prefix, limit, options = {}, params = {}) {
        const s3 = new AWS.S3((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Bucket: bucket
        };
        if (prefix) {
            requiredParams.Prefix = prefix;
        }
        if (limit) {
            requiredParams.MaxKeys = limit;
        }
        return s3.listObjectsV2((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function listObjects(_x17, _x18, _x19) {
        return _ref8.apply(this, arguments);
    };
})();

let listObjectsBatches = (() => {
    var _ref9 = _asyncGenerator3.default.wrap(function* (bucket, prefix, { limit, flatten = false } = {}, options = {}, params = {}) {
        // eslint-disable-next-line one-var
        let NextContinuationToken, Name, Prefix, MaxKeys, CommonPrefixes, KeyCount; // metadata
        let itemsBatch = [];
        let resultsCount = 0;
        let yieldCount = 0;
        let continuation = {};
        do {
            ({ Contents: itemsBatch, NextContinuationToken, Name, Prefix, MaxKeys, CommonPrefixes, KeyCount } = yield _asyncGenerator3.default.await(listObjects(bucket, prefix, limit, options, params)));
            continuation = { ContinuationToken: NextContinuationToken };
            const metadata = collections.lazy({ NextContinuationToken, Name, Prefix, MaxKeys, CommonPrefixes, KeyCount });
            const batchSize = itemsBatch.length;
            resultsCount += batchSize;
            yieldCount += batchSize;
            if (flatten) {
                yield* (0, _asyncGeneratorDelegate3.default)((0, _asyncIterator3.default)(itemsBatch), _asyncGenerator3.default.await);
            } else {
                yield collections.iterator(itemsBatch, { metadata });
            }
        } while (NextContinuationToken);
    });

    return function listObjectsBatches(_x20, _x21) {
        return _ref9.apply(this, arguments);
    };
})();

let listObjectsSequence = (() => {
    var _ref10 = _asyncGenerator3.default.wrap(function* (bucket, prefix, { limit }, options = {}, params = {}) {
        return yield* (0, _asyncGeneratorDelegate3.default)((0, _asyncIterator3.default)(listObjectsBatches(bucket, prefix, { limit, flatten: true }, options, params)), _asyncGenerator3.default.await);
    });

    return function listObjectsSequence(_x22, _x23, _x24) {
        return _ref10.apply(this, arguments);
    };
})();

let listObjectsAll = (() => {
    var _ref11 = (0, _asyncToGenerator3.default)(function* (bucket, prefix, { limit }, options = {}, params = {}) {
        return collections.reduceAsync(collections.append(), function () {
            return [];
        }, listObjectsSequence(bucket, prefix, { limit }, options, params));
    });

    return function listObjectsAll(_x25, _x26, _x27) {
        return _ref11.apply(this, arguments);
    };
})();

let readHeaderLine = (() => {
    var _ref12 = (0, _asyncToGenerator3.default)(function* (bucket, key, delimiter = '\n', quote = true, options = {}, params = {}) {
        const targetStream = MemoryStream.createWriteStream();

        return new _promise2.default(function (resolve, reject) {
            getObjectReadStream(bucket, key, options, params).on('error', function (err) {
                const error = new UnretryableError(err.message, errors.codes.Groups.S3, err.code);
                reject(error);
            }).pipe(streams.lineStream({ take: 1, delimiter })).pipe(targetStream).on('finish', function () {
                let header = targetStream.queue.map(function (buffer) {
                    return buffer.toString().trim();
                }).pop();
                if (header) {
                    if (quote) {
                        header = header.includes('"') ? header : header.split(',').map(function (header) {
                            return `"${header}"`;
                        }).join(',');
                    }
                    resolve(header);
                } else {
                    const error = new UnretryableError(`No header found in file: [${bucket}/${key}]`, errors.codes.Groups.S3, errors.codes.S3.Format, errors.codes.S3.Header);
                    reject(error);
                }
            });
        });
    });

    return function readHeaderLine(_x28, _x29) {
        return _ref12.apply(this, arguments);
    };
})();

let readLines = (() => {
    var _ref13 = (0, _asyncToGenerator3.default)(function* (bucket, key, skip = 0, take = -1, delimiter = '\n', options = {}, params = {}) {
        const lines = [];
        return new _promise2.default(function (resolve, reject) {
            getObjectReadStream(bucket, key, options, params).on('error', function (err) {
                const error = new UnretryableError(err.message, errors.codes.Groups.S3, err.code);
                reject(error);
            }).pipe(streams.lineStream({ skip, take, delimiter })).on('data', function (line) {
                return lines.push(line.toString().trim());
            }).on('finish', function () {
                resolve(lines);
            });
        });
    });

    return function readLines(_x30, _x31) {
        return _ref13.apply(this, arguments);
    };
})();

let countLines = (() => {
    var _ref14 = (0, _asyncToGenerator3.default)(function* (bucket, key, delimiter = '\n', options = {}, params = {}) {
        let count = 0;
        return new _promise2.default(function (resolve, reject) {
            getObjectReadStream(bucket, key, options, params).on('error', function (err) {
                const error = new UnretryableError(err.message, errors.codes.Groups.S3, err.code);
                reject(error);
            }).pipe(streams.lineStream({ delimiter })).on('data', function () {
                return count++;
            }).on('finish', function () {
                resolve(count);
            });
        });
    });

    return function countLines(_x32, _x33) {
        return _ref14.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const MemoryStream = require('memorystream');

const collections = require('../collections');
const streams = require('../streams');
const errors = require('../errors');
const { UnretryableError } = errors;

const commonDefaultOptions = { signatureVersion: 'v4' };

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

function getObjectReadStream(bucket, key, options = {}, params = {}) {
    const s3 = new AWS.S3((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
    const requiredParams = {
        Bucket: bucket,
        Key: key
    };
    return s3.getObject((0, _extends3.default)({}, requiredParams, params)).createReadStream();
}

function lineStream(bucket, key, skip = 0, take = -1, delimiter = '\n', options = {}, params = {}) {
    return getObjectReadStream(bucket, key, options, params).on('error', function (err) {
        const error = new UnretryableError(err.message, errors.codes.Groups.S3, err.code);
        this.emit('error', err);
        this.emit('end'); // Tells up-stream streams that we have ended, doesn't actually `close`/`destroy` the stream
        this.end(); // Won't trigger the `end` event, cleanup not necessary in our transform case, added for the sake of completeness
    }).pipe(streams.lineStream({ skip, take, delimiter }));
}

module.exports = {
    getBucketLocation,
    getObject,
    getObjectReadStream,
    copyObject,
    deleteObject,
    moveObject,
    objectExists,
    upload,
    listObjects,
    listObjectsBatches,
    listObjectsSequence,
    listObjectsAll,
    readHeaderLine,
    countLines,
    readLines,
    lineStream
};