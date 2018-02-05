'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let publish = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (topicArn, subject, message, options = {}, params = {}) {
        const sns = new AWS.SNS((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            TopicArn: topicArn,
            Subject: subject,
            Message: _.isString(message) ? message : (0, _stringify2.default)(message, null, 4)
        };
        return sns.publish((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function publish(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const _ = require('lodash');

const retryPeriod = 500;

const commonDefaultOptions = {
    maxRetries: 8,
    retryDelayOptions: {
        customBackoff(retryCount) {
            return Math.pow(2, retryCount) * retryPeriod;
        }
    }
};

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

function extractRecords(event, take = 1) {
    const results = event.Records.map(record => {
        const payload = record.Sns.Message;
        try {
            return JSON.parse(payload);
        } catch (ex) {
            throw new Error(`Error decoding JSON: [${payload}]`, ex);
        }
    });
    // seems that AWS SNS only sends one message to subscribed lambda currently. In case that changes, we can handle here.
    return results.slice(0, take);
}

module.exports = {
    publish,
    extractRecords
};