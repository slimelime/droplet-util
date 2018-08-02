'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let updateTable = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (table, options = {}, params = {}) {
        const dynamoClient = new AWS.DynamoDB((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table
        };
        return dynamoClient.updateTable((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function updateTable(_x) {
        return _ref.apply(this, arguments);
    };
})();

let createTable = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (table, keys = [], ProvisionedThroughput = {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }, options = {}, params = {}) {

        keys = keys.slice(0, 2);
        const [hashKey, rangeKey] = keys;
        if (!hashKey) throw new Error('Must provide HashKey (a.k.a PartitionKey)');

        const KeySchema = [{
            AttributeName: hashKey,
            KeyType: "HASH"
        }];
        if (rangeKey) {
            KeySchema.push({
                AttributeName: rangeKey,
                KeyType: "RANGE"
            });
        }

        const AttributeDefinitions = keys.map(function (keyName) {
            return {
                AttributeName: keyName,
                AttributeType: "S"
            };
        });

        const dynamoClient = new AWS.DynamoDB((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table,
            AttributeDefinitions,
            KeySchema,
            ProvisionedThroughput
        };
        return dynamoClient.createTable((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function createTable(_x2) {
        return _ref2.apply(this, arguments);
    };
})();

let deleteTable = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (table, options = {}, params = {}) {
        const dynamoClient = new AWS.DynamoDB((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table
        };
        return dynamoClient.deleteTable((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function deleteTable(_x3) {
        return _ref3.apply(this, arguments);
    };
})();

let describeTable = (() => {
    var _ref4 = (0, _asyncToGenerator3.default)(function* (table, options = {}, params = {}) {

        const dynamoClient = new AWS.DynamoDB((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TableName: table
        };
        return dynamoClient.describeTable((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function describeTable(_x4) {
        return _ref4.apply(this, arguments);
    };
})();

let exportTable = (() => {
    var _ref5 = (0, _asyncToGenerator3.default)(function* (table, { bucket, file = `${datetimeProvider.getTimestamp()}-${table}`, EOL = '\n', filterExpression = null, expressionAttributeValues = null } = {}, options = {}, params = {}) {
        const complete$ = new Rx.Subject();

        const tableMetadata = yield describeTable(table, options, params);
        const readCapacityUnits = jp.value(tableMetadata, 'Table.ProvisionedThroughput.ReadCapacityUnits');
        logger.log({ readCapacityUnits });
        const generatorOfBatches = yield docClient.scanBatches(table, {
            filterExpression,
            expressionAttributeValues,
            flatten: false
        });
        // 'ProvisionedThroughput.WriteCapacityUnits'
        const throttlingParams = {
            objectMode: true,
            rate: readCapacityUnits, interval: 'second', burst: readCapacityUnits, initialContent: readCapacityUnits,
            consumedCapacityUnits: function ({ ConsumedCapacity: { CapacityUnits } }) {
                return CapacityUnits;
            }
        };
        const scanReadableStream = readableStream.fromAsyncGeneratorOfBatches(generatorOfBatches, throttlingParams);
        let writeStream;
        const ldJSONStream = streams.objectTransformStream(
        // eslint-disable-next-line prefer-arrow-callback
        function (chunk, enc, next) {
            next(null, Buffer.from(`${(0, _stringify2.default)(chunk, null, 0)}${EOL}`));
        });

        const readStream = scanReadableStream.on('error', function (error) {
            return complete$.error(error);
        }).pipe(ldJSONStream).on('error', function (error) {
            return complete$.error(error);
        });

        if (bucket) {
            try {
                yield s3.upload(bucket, file, readStream);
                complete$.complete();
            } catch (error) {
                complete$.error(error);
            }
        } else {
            writeStream = fs.createWriteStream(file);

            readStream.pipe(writeStream).on('error', function (error) {
                return complete$.error(error);
            }).on('end', function () {
                return complete$.complete();
            });
        }

        return complete$.toPromise();
    });

    return function exportTable(_x5) {
        return _ref5.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const fs = require('fs');
const jp = require('jsonpath');
const Rx = require('rxjs');

const docClient = require('./dynamo-document');
const s3 = require('./s3');
const readableStream = require('../readable-stream');
const streams = require('../streams');
const datetimeProvider = require('../datetime-provider');
const logger = require('../logger');

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

module.exports = {
    updateTable,
    createTable,
    deleteTable,
    describeTable,
    exportTable
};