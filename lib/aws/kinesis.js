'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let putRecord = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (streamName, partitionKey, record, options = {}, params = {}) {
        const kinesis = new AWS.Kinesis((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Data: (0, _stringify2.default)(record),
            PartitionKey: partitionKey,
            StreamName: streamName
        };
        return kinesis.putRecord((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function putRecord(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
})();

/**
 * Writes records to the same shard
 *
 * Not useful for writing each record to its own shard
 * @param streamName
 * @param partitionKey
 * @param records
 * @param options
 * @param params
 * @returns {Promise<Kinesis.Types.PutRecordsOutput>}
 */


let putRecords = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (streamName, partitionKey, records, options = {}, params = {}) {
        const kinesis = new AWS.Kinesis((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            Records: records.map(function (record) {
                return {
                    Data: (0, _stringify2.default)(record),
                    PartitionKey: partitionKey
                };
            }),
            StreamName: streamName
        };
        return kinesis.putRecords((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function putRecords(_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

function extractRecords(event) {
    return event.Records.map(record => {
        // Kinesis data is base64 encoded so decode here
        const decodedData = new Buffer(record.kinesis.data, 'base64').toString('ascii');
        try {
            return JSON.parse(decodedData);
        } catch (ex) {
            throw new Error(`Error decoding JSON: [${decodedData}]`, ex);
        }
    });
}

module.exports = {
    putRecord,
    putRecords,
    extractRecords
};