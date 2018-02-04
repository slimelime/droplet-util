'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const MemoryStream = require('memorystream');

const collections = require('../collections');
const streams = require('../streams');
const errors = require('../errors');
const {UnretryableError} = errors;

const commonDefaultOptions = { signatureVersion: 'v4' };

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function getBucketLocation(bucket, options = {}, params = {}) {
    const s3 = new AWS.S3({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Bucket: bucket
    };
    return s3.getBucketLocation({...requiredParams, ...params}).promise();
}

async function getObject(bucket, key, options = {}, params = {}) {
    const s3 = new AWS.S3({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Bucket: bucket,
        Key: key
    };
    return s3.getObject({...requiredParams, ...params}).promise();
}

function getObjectReadStream(bucket, key, options = {}, params = {}) {
    const s3 = new AWS.S3({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Bucket: bucket,
        Key: key
    };
    return s3.getObject({...requiredParams, ...params}).createReadStream();
}

async function copyObject(bucket, key, copySource, options = {}, params = {}) {
    const s3 = new AWS.S3({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Bucket: bucket,
        Key: key,
        CopySource: copySource
    };
    return s3.copyObject({...requiredParams, ...params}).promise();
}

async function deleteObject(bucket, key, options = {}, params = {}) {
    const s3 = new AWS.S3({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Bucket: bucket,
        Key: key
    };
    return s3.deleteObject({...requiredParams, ...params}).promise();
}

async function moveObject(fromBucket, fromKey, toBucket, toKey = fromKey, options = {}) {
    await copyObject(toBucket, toKey, `${fromBucket}/${fromKey}`, options, {ServerSideEncryption: 'AES256'});
    await deleteObject(fromBucket, fromKey, options);
    return {fromBucket, fromKey, toBucket, toKey};
}

async function objectExists(bucket, key, options = {}, params = {}) {
    const s3 = new AWS.S3({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Bucket: bucket,
        Key: key
    };
    try {
        await s3.headObject({...requiredParams, ...params}).promise();
        return true;
    } catch (ex) {
        return false;
    }
}

async function upload(bucket, key, body, SSE = 'AES256', options = {}, params = {}) {
    const s3 = new AWS.S3({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Bucket: bucket,
        Key: key,
        Body: body,
        ServerSideEncryption: SSE
    };
    return s3.upload({...requiredParams, ...params}).promise();
}

async function listObjects(bucket, prefix, limit, options = {}, params = {}) {
    const s3 = new AWS.S3({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Bucket: bucket
    };
    if (prefix) {
        requiredParams.Prefix = prefix;
    }
    if (limit) {
        requiredParams.MaxKeys = limit;
    }
    return s3.listObjectsV2({...requiredParams, ...params}).promise();
}

async function* listObjectsBatches(bucket, prefix, {limit, flatten = false} = {}, options = {}, params = {}) {
// eslint-disable-next-line one-var
    let NextContinuationToken, Name, Prefix, MaxKeys, CommonPrefixes, KeyCount; // metadata
    let itemsBatch = [];
    let resultsCount = 0;
    let yieldCount = 0;
    let continuation = {};
    do {
        ({Contents: itemsBatch, NextContinuationToken, Name, Prefix, MaxKeys, CommonPrefixes, KeyCount} = await listObjects(bucket, prefix, limit, options, params));
        continuation = {ContinuationToken: NextContinuationToken};
        const metadata = collections.lazy({NextContinuationToken, Name, Prefix, MaxKeys, CommonPrefixes, KeyCount});
        const batchSize = itemsBatch.length;
        resultsCount += batchSize;
        yieldCount += batchSize;
        if (flatten) {
            yield* itemsBatch;
        } else {
            yield collections.iterator(itemsBatch, {metadata});
        }

    } while (NextContinuationToken);
}

async function* listObjectsSequence(bucket, prefix, {limit}, options = {}, params = {}) {
    return yield* listObjectsBatches(bucket, prefix, {limit, flatten: true}, options, params);
}

async function listObjectsAll(bucket, prefix, {limit}, options = {}, params = {}) {
    return collections.reduceAsync(collections.append(/*reducingFn*/), () => [], listObjectsSequence(bucket, prefix, {limit}, options, params));
}

async function readHeaderLine(bucket, key, delimiter = '\n', quote = true, options = {}, params = {}) {
    const targetStream = MemoryStream.createWriteStream();

    return new Promise((resolve, reject) => {
        getObjectReadStream(bucket, key, options, params)
            .on('error', err => {
                const error = new UnretryableError(err.message, errors.codes.Groups.S3, err.code);
                reject(error);
            })
            .pipe(streams.lineStream({take: 1, delimiter}))
            .pipe(targetStream)
            .on('finish', () => {
                let header = targetStream.queue.map(buffer => buffer.toString().trim()).pop();
                if (header) {
                    if (quote) {
                        header = header.includes('"') ? header : header.split(',')
                            .map(header => `"${header}"`)
                            .join(',');
                    }
                    resolve(header);
                } else {
                    const error = new UnretryableError(`No header found in file: [${bucket}/${key}]`, errors.codes.Groups.S3, errors.codes.S3.Format, errors.codes.S3.Header);
                    reject(error);
                }
            });
    });
}

async function readLines(bucket, key, skip = 0, take = -1, delimiter = '\n', options = {}, params = {}) {
    const lines = [];
    return new Promise((resolve, reject) => {
        getObjectReadStream(bucket, key, options, params)
            .on('error', err => {
                const error = new UnretryableError(err.message, errors.codes.Groups.S3, err.code);
                reject(error);
            })
            .pipe(streams.lineStream({skip, take, delimiter}))
            .on('data', line => lines.push(line.toString().trim()))
            .on('finish', () => {
                resolve(lines);
            });
    });
}

function lineStream(bucket, key, skip = 0, take = -1, delimiter = '\n', options = {}, params = {}) {
    return getObjectReadStream(bucket, key, options, params)
        .on('error', function (err) {
            const error = new UnretryableError(err.message, errors.codes.Groups.S3, err.code);
            this.emit('error', err);
            this.emit('end'); // Tells up-stream streams that we have ended, doesn't actually `close`/`destroy` the stream
            this.end(); // Won't trigger the `end` event, cleanup not necessary in our transform case, added for the sake of completeness
        })
        .pipe(streams.lineStream({skip, take, delimiter}));
}

async function countLines(bucket, key, delimiter = '\n', options = {}, params = {}) {
    let count = 0;
    return new Promise((resolve, reject) => {
        getObjectReadStream(bucket, key, options, params)
            .on('error', err => {
                const error = new UnretryableError(err.message, errors.codes.Groups.S3, err.code);
                reject(error);
            })
            .pipe(streams.lineStream({delimiter}))
            .on('data', () => count++)
            .on('finish', () => {
                resolve(count);
            });
    });
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
