'use strict';

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

let get = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (table, keyMap, options = {}, params = {}) {
        const docClient = new AWS.DynamoDB.DocumentClient((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table,
            Key: keyMap
        };
        return docClient.get((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function get(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();

// @TODO: should deleteItem be renamed to 'delete'


let deleteItem = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (table, keyMap, options = {}, params = {}) {
        const docClient = new AWS.DynamoDB.DocumentClient((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table,
            Key: keyMap
        };
        return docClient.delete((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function deleteItem(_x3, _x4) {
        return _ref2.apply(this, arguments);
    };
})();

let put = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (table, item, options = {}, params = {}) {
        const docClient = new AWS.DynamoDB.DocumentClient((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table,
            Item: item
        };
        return docClient.put((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function put(_x5, _x6) {
        return _ref3.apply(this, arguments);
    };
})();

let update = (() => {
    var _ref4 = (0, _asyncToGenerator3.default)(function* (table, keyMap, item, options = {}, params = {}) {
        const docClient = new AWS.DynamoDB.DocumentClient((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table,
            Key: keyMap
        };
        return docClient.update((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function update(_x7, _x8, _x9) {
        return _ref4.apply(this, arguments);
    };
})();

let query = (() => {
    var _ref5 = (0, _asyncToGenerator3.default)(function* (table, { keyConditionExpression, expressionAttributeValues } = {}, options = {}, params = {}) {
        const docClient = new AWS.DynamoDB.DocumentClient((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnConsumedCapacity: 'TOTAL'
        };
        return docClient.query((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function query(_x10) {
        return _ref5.apply(this, arguments);
    };
})();

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


let queryBatches = (() => {
    var _ref6 = _asyncGenerator3.default.wrap(function* (table, { keyConditionExpression, expressionAttributeValues, strict = false, limit, flatten = false } = {}, options = {}, params = {}) {
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
            } = yield _asyncGenerator3.default.await(query(table, { keyConditionExpression, expressionAttributeValues }, options, (0, _extends3.default)({}, params, continuation))));
            continuation = { ExclusiveStartKey: LastEvaluatedKey };
            const metadata = collections.lazy({ Count, ScannedCount, ConsumedCapacity, LastEvaluatedKey });
            const batchSize = itemsBatch.length;
            resultsCount += batchSize;
            if (strict && resultsCount >= limit) {
                const lastBatchSize = limit - yieldCount;
                if (flatten) {
                    yield* (0, _asyncGeneratorDelegate3.default)((0, _asyncIterator3.default)(itemsBatch.slice(0, lastBatchSize)), _asyncGenerator3.default.await);
                } else {
                    yield collections.iterator(itemsBatch.slice(0, lastBatchSize), { metadata });
                }
                yieldCount += lastBatchSize;
                return yieldCount; // TIP: the return value from a generator is ignored by for..of loop, only retrievable by calling .next() manually to get the last {value: returnValue, done: true}, or `const result = yield* gen1` inside gen2 function, result here would get the return value
            }
            yieldCount += batchSize;
            if (flatten) {
                yield* (0, _asyncGeneratorDelegate3.default)((0, _asyncIterator3.default)(itemsBatch), _asyncGenerator3.default.await);
            } else {
                yield collections.iterator(itemsBatch, { metadata });
            }
        } while (LastEvaluatedKey && (limit ? resultsCount < limit : true));
    });

    return function queryBatches(_x11) {
        return _ref6.apply(this, arguments);
    };
})();

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

let querySequence = (() => {
    var _ref7 = _asyncGenerator3.default.wrap(function* (table, { keyConditionExpression, expressionAttributeValues, strict = false, limit } = {}, options = {}, params = {}) {
        return yield* (0, _asyncGeneratorDelegate3.default)((0, _asyncIterator3.default)(queryBatches(table, { keyConditionExpression, expressionAttributeValues, strict, limit, flatten: true }, options, params)), _asyncGenerator3.default.await); // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*
    });

    return function querySequence(_x12) {
        return _ref7.apply(this, arguments);
    };
})();

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


let queryAll = (() => {
    var _ref8 = (0, _asyncToGenerator3.default)(function* (table, { keyConditionExpression, expressionAttributeValues, strict, limit } = {}, options = {}, params = {}) {
        return collections.reduceAsync(collections.append(), function () {
            return [];
        }, querySequence(table, { keyConditionExpression, expressionAttributeValues, limit, strict }, options, params));
    });

    return function queryAll(_x13) {
        return _ref8.apply(this, arguments);
    };
})();

let scan = (() => {
    var _ref9 = (0, _asyncToGenerator3.default)(function* (table, { filterExpression = null, expressionAttributeValues = null } = {}, options = {}, params = {}) {
        const docClient = new AWS.DynamoDB.DocumentClient((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
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

        return docClient.scan((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function scan(_x14) {
        return _ref9.apply(this, arguments);
    };
})();

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


let scanBatches = (() => {
    var _ref10 = _asyncGenerator3.default.wrap(function* (table, { filterExpression = null, expressionAttributeValues = null, strict = false, limit, flatten = false } = {}, options = {}, params = {}) {
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
            } = yield _asyncGenerator3.default.await(scan(table, { filterExpression, expressionAttributeValues }, options, (0, _extends3.default)({}, params, continuation))));
            continuation = { ExclusiveStartKey: LastEvaluatedKey };
            const metadata = collections.lazy({ Count, ScannedCount, ConsumedCapacity, LastEvaluatedKey });
            const batchSize = itemsBatch.length;
            resultsCount += batchSize;
            if (strict && resultsCount >= limit) {
                const lastBatchSize = limit - yieldCount;
                if (flatten) {
                    yield* (0, _asyncGeneratorDelegate3.default)((0, _asyncIterator3.default)(itemsBatch.slice(0, lastBatchSize)), _asyncGenerator3.default.await);
                } else {
                    yield collections.iterator(itemsBatch.slice(0, lastBatchSize), { metadata });
                }
                yieldCount += lastBatchSize;
                return yieldCount; // TIP: the return value from a generator is ignored by for..of loop, only retrievable by calling .next() manually to get the last {value: returnValue, done: true}, or `const result = yield* gen1` inside gen2 function, result here would get the return value
            }
            yieldCount += batchSize;
            if (flatten) {
                yield* (0, _asyncGeneratorDelegate3.default)((0, _asyncIterator3.default)(itemsBatch), _asyncGenerator3.default.await);
            } else {
                yield collections.iterator(itemsBatch, { metadata });
            }
        } while (LastEvaluatedKey && (limit ? resultsCount < limit : true));
    });

    return function scanBatches(_x15) {
        return _ref10.apply(this, arguments);
    };
})();

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

let scanSequence = (() => {
    var _ref11 = _asyncGenerator3.default.wrap(function* (table, { filterExpression = null, expressionAttributeValues = null, strict = false, limit } = {}, options = {}, params = {}) {
        return yield* (0, _asyncGeneratorDelegate3.default)((0, _asyncIterator3.default)(scanBatches(table, { filterExpression, expressionAttributeValues, strict, limit, flatten: true }, options, params)), _asyncGenerator3.default.await); // see: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/yield*
    });

    return function scanSequence(_x16) {
        return _ref11.apply(this, arguments);
    };
})();

let scanAll = (() => {
    var _ref12 = (0, _asyncToGenerator3.default)(function* (table, { filterExpression = null, expressionAttributeValues = null, strict = false, limit } = {}, options = {}, params = {}) {
        return collections.reduceAsync(collections.append(), function () {
            return [];
        }, scanSequence(table, { filterExpression, expressionAttributeValues, limit, strict }, options, params));
    });

    return function scanAll(_x17) {
        return _ref12.apply(this, arguments);
    };
})();

let batchWrite = (() => {
    var _ref13 = (0, _asyncToGenerator3.default)(function* (table, { Put = [], Delete = [], Keys = [] } = {}, options = {}, params = {}) {
        const docClient = new AWS.DynamoDB.DocumentClient((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));

        const deleteRequests = collections.map(function (item) {
            return { DeleteRequest: { Key: _.pick(item, Keys) } };
        }, Delete);
        const putRequests = collections.map(function (item) {
            return { PutRequest: { Item: item } };
        }, Put);

        // TODO: Is batch size limited to 25 total, or 25 puts and 25 deletes.
        const max = 25; //batchWrite allows batch size between 1 - 25 only
        let start = 0;
        let deleteChunk = deleteRequests.slice(start, start + max);
        let putChunk = putRequests.slice(start, start + max);
        const results = [];

        while (putChunk.length || deleteChunk.length) {
            const requiredParams = {
                RequestItems: { [table]: [...deleteChunk, ...putChunk] },
                ReturnConsumedCapacity: 'TOTAL'
            };
            const chunkResults = yield docClient.batchWrite((0, _extends3.default)({}, requiredParams, params)).promise();
            results.push(chunkResults);
            start += max;
            deleteChunk = deleteRequests.slice(start, start + max);
            putChunk = putRequests.slice(start, start + max);
        }
        return results;
    });

    return function batchWrite(_x18) {
        return _ref13.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWS = require('aws-sdk');
const _ = require('lodash');

const collections = require('../collections');

const commonDefaultOptions = {
    convertEmptyValues: true
};

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

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