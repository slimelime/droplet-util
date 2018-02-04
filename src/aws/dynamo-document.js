'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const _ = require('lodash');

const collections = require('../collections');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function get(table, keyMap, options = {}, params = {}) {
    const docClient = new AWS.DynamoDB.DocumentClient({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table,
        Key: keyMap
    };
    return docClient.get({...requiredParams, ...params}).promise();
}

async function deleteItem(table, keyMap, options = {}, params = {}) {
    const docClient = new AWS.DynamoDB.DocumentClient({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table,
        Key: keyMap
    };
    return docClient.delete({...requiredParams, ...params}).promise();
}

async function put(table, item, options = {}, params = {}) {
    const docClient = new AWS.DynamoDB.DocumentClient({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table,
        Item: item
    };
    return docClient.put({...requiredParams, ...params}).promise();
}

async function update(table, keyMap, item, options = {}, params = {}) {
    const docClient = new AWS.DynamoDB.DocumentClient({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table,
        Key: keyMap
    };
    return docClient.update({...requiredParams, ...params}).promise();
}

async function query(table, {keyConditionExpression, expressionAttributeValues} = {}, options = {}, params = {}) {
    const docClient = new AWS.DynamoDB.DocumentClient({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table,
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnConsumedCapacity: 'TOTAL'
    };
    return docClient.query({...requiredParams, ...params}).promise();
}

/**
 * query dynamoDB and yield results one batch at a time, effectively hiding the continuation retrieval process form the consumer.
 * @param table
 * @param keyConditionExpression
 * @param expressionAttributeValues
 * @param options
 * @param params
 * @param limit: approximate result size limit, if the limit value falls in the middle of a batch, the batch entries are yielded anyways, and no more batches are retrieved
 * @param strict: if true, would throw away any excess entries in the current batch and commit to yield exactly total of `n` records, where n == limit
 * @param flatten: if true, uses yield* to yield one item at a time from the iterable batch(es), aliased async querySequence*()
 * @yields if flatten, one record at a time, else, an iterator (not a concrete array)
 * @returns {Promise<yieldCount>}
 */
async function* queryBatches(table, {keyConditionExpression, expressionAttributeValues, strict = false, limit, flatten = false} = {}, options = {}, params = {}) {
    let LastEvaluatedKey;
    let Count;
    let ScannedCount;
    let ConsumedCapacity;
    let itemsBatch = [];
    let resultsCount = 0;
    let yieldCount = 0;
    let continuation = {};
    do {
        ({
            Items: itemsBatch,
            LastEvaluatedKey,
            Count,
            ScannedCount,
            ConsumedCapacity
        } = await query(table, {keyConditionExpression, expressionAttributeValues}, options, {...params, ...continuation}));
        continuation = {ExclusiveStartKey: LastEvaluatedKey};
        const metadata = collections.lazy({Count, ScannedCount, ConsumedCapacity, LastEvaluatedKey});
        const batchSize = itemsBatch.length;
        resultsCount += batchSize;
        if (strict && resultsCount >= limit) {
            const lastBatchSize = limit - yieldCount;
            if (flatten) {
                yield* itemsBatch.slice(0, lastBatchSize);
            } else {
                yield collections.iterator(itemsBatch.slice(0, lastBatchSize), {metadata});
            }
            yieldCount += lastBatchSize;
            return yieldCount; // TIP: the return value from a generator is ignored by for..of loop, only retrievable by calling .next() manually to get the last {value: returnValue, done: true}, or `const result = yield* gen1` inside gen2 function, result here would get the return value
        }
        yieldCount += batchSize;
        if (flatten) {
            yield* itemsBatch;
        } else {
            yield collections.iterator(itemsBatch, {metadata});
        }
    } while (LastEvaluatedKey && (limit ? resultsCount < limit : true));
}


/**
 * query dynamoDB and yield results one at a time, effectively hiding the batch retrieval process form the consumer.
 * @param table
 * @param keyConditionExpression
 * @param expressionAttributeValues
 * @param options
 * @param params
 * @param limit: approximate result size limit, if the limit value falls in the middle of a batch, the batch entries are yielded anyways, and no more batches are retrieved
 * @param strict: if true, would throw away any excess entries in the current batch and commit to yield exactly total of `n` records, where n == limit
 * @returns {Promise<yieldCount>}
 */

async function* querySequence(table, {keyConditionExpression, expressionAttributeValues, strict = false, limit} = {}, options = {}, params = {}) {
    return yield* queryBatches(table, {keyConditionExpression, expressionAttributeValues, strict, limit, flatten: true}, options, params); // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*
}

/**
 * queryAll consumes the querySequence until exhaustion, batches up all result into an array and returns them eventually
 *
 * WARNING: this function resolution time is nondeterministic and waiting for it to resolve might cause lambda functions to timeout
 * Only use for predictably small result sizes/seek time. Or better yet, consume one record at a time yourself from async querySequence*()
 * DynamoDB currently doesn't offer any help, neither does the aws-sdk offer a sequence or cursor implementation
 *
 * @param table
 * @param keyConditionExpression
 * @param expressionAttributeValues
 * @param options
 * @param params
 * @param limit: approximate result size limit, if the limit value falls in the middle of a batch, the batch entries are yielded anyways, and no more batches are retrieved
 * @param strict: if true, would throw away any excess entries in the current batch and commit to yield exactly n records, where n == limit
 * @returns {Promise}
 */
async function queryAll(table, {keyConditionExpression, expressionAttributeValues, strict, limit} = {}, options = {}, params = {}) {
    return collections.reduceAsync(collections.append(/*reducingFn*/), () => [], querySequence(table, {keyConditionExpression, expressionAttributeValues, limit, strict}, options, params));
}

async function scan(table, {filterExpression = null, expressionAttributeValues = null} = {}, options = {}, params = {}) {
    const docClient = new AWS.DynamoDB.DocumentClient({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table,
        ReturnConsumedCapacity: 'TOTAL'
    };

    if (filterExpression) {
        requiredParams.FilterExpression = filterExpression;
    }

    if (expressionAttributeValues) {
        requiredParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    return docClient.scan({...requiredParams, ...params}).promise();
}

/**
 * scan dynamoDB and yield results one batch at a time, effectively hiding the continuation retrieval process form the consumer.
 * @param table
 * @param keyConditionExpression
 * @param expressionAttributeValues
 * @param options
 * @param params
 * @param limit: approximate result size limit, if the limit value falls in the middle of a batch, the batch entries are yielded anyways, and no more batches are retrieved
 * @param strict: if true, would throw away any excess entries in the current batch and commit to yield exactly total of `n` records, where n == limit
 * @param flatten: if true, uses yield* to yield one item at a time from the iterable batch(es), aliased async scanSequence*()
 * @yields if flatten, one record at a time, else, an iterator (not a concrete array)
 * @returns {Promise<yieldCount>}
 */
async function* scanBatches(table, {filterExpression = null, expressionAttributeValues = null, strict = false, limit, flatten = false} = {}, options = {}, params = {}) {
    let LastEvaluatedKey;
    let Count;
    let ScannedCount;
    let ConsumedCapacity;
    let itemsBatch = [];
    let resultsCount = 0;
    let yieldCount = 0;
    let continuation = {};
    do {
        ({
            Items: itemsBatch,
            LastEvaluatedKey,
            Count,
            ScannedCount,
            ConsumedCapacity
        } = await scan(table, {filterExpression, expressionAttributeValues}, options, {...params, ...continuation}));
        continuation = {ExclusiveStartKey: LastEvaluatedKey};
        const metadata = collections.lazy({Count, ScannedCount, ConsumedCapacity, LastEvaluatedKey});
        const batchSize = itemsBatch.length;
        resultsCount += batchSize;
        if (strict && resultsCount >= limit) {
            const lastBatchSize = limit - yieldCount;
            if (flatten) {
                yield* itemsBatch.slice(0, lastBatchSize);
            } else {
                yield collections.iterator(itemsBatch.slice(0, lastBatchSize), {metadata});
            }
            yieldCount += lastBatchSize;
            return yieldCount; // TIP: the return value from a generator is ignored by for..of loop, only retrievable by calling .next() manually to get the last {value: returnValue, done: true}, or `const result = yield* gen1` inside gen2 function, result here would get the return value
        }
        yieldCount += batchSize;
        if (flatten) {
            yield* itemsBatch;
        } else {
            yield collections.iterator(itemsBatch, {metadata});
        }
    } while (LastEvaluatedKey && (limit ? resultsCount < limit : true));
}


/**
 * scan dynamoDB and yield results one at a time, effectively hiding the batch retrieval process form the consumer.
 * @param table
 * @param keyConditionExpression
 * @param expressionAttributeValues
 * @param options
 * @param params
 * @param limit: approximate result size limit, if the limit value falls in the middle of a batch, the batch entries are yielded anyways, and no more batches are retrieved
 * @param strict: if true, would throw away any excess entries in the current batch and commit to yield exactly total of `n` records, where n == limit
 * @returns {Promise<yieldCount>}
 */

async function* scanSequence(table, {filterExpression = null, expressionAttributeValues = null, strict = false, limit} = {}, options = {}, params = {}) {
    return yield* scanBatches(table, {filterExpression, expressionAttributeValues, strict, limit, flatten: true}, options, params); // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*
}

async function scanAll(table, {filterExpression = null, expressionAttributeValues = null, strict = false, limit} = {}, options = {}, params = {}) {
    return collections.reduceAsync(collections.append(/*reducingFn*/), () => [], scanSequence(table, {filterExpression, expressionAttributeValues, limit, strict}, options, params));
}

async function batchWrite(table, {Put = [], Delete = [], Keys = []} = {}, options = {}, params = {}) {
    const docClient = new AWS.DynamoDB.DocumentClient({...commonDefaultOptions, ...regionDefaultOptions(), ...options});

    const deleteRequests = collections.map(item => ({DeleteRequest: {Key: _.pick(item, Keys)}}), Delete);
    const putRequests = collections.map(item => ({PutRequest: {Item: item}}), Put);

    const max = 25; //batchWrite allows batch size between 1 - 25 only
    let start = 0;
    let deleteChunk = deleteRequests.slice(start, start + max);
    let putChunk = putRequests.slice(start, start + max);
    const results = [];

    while (putChunk.length || deleteChunk.length) {
        const requiredParams = {
            RequestItems: { [table]: [...deleteRequests, ...putRequests]},
            ReturnConsumedCapacity: 'TOTAL'
        };
        const chunkResults = await docClient.batchWrite({...requiredParams, ...params}).promise();
        results.push(chunkResults);
        start += max;
        deleteChunk = deleteRequests.slice(start, start + max);
        putChunk = putRequests.slice(start, start + max);
    }
    return results;
}

module.exports = {
    put,
    get,
    query,
    queryBatches,
    querySequence,
    queryAll,
    scan,
    scanBatches,
    scanSequence,
    scanAll,
    deleteItem,
    update,
    batchWrite
};
