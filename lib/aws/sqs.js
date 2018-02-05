'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let createQueue = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (queueName, visibilityTimeout = 30, options = {}, params = {}) {
        const sqs = new AWS.SQS((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            QueueName: queueName,
            Attributes: {
                VisibilityTimeout: visibilityTimeout
            }
        };
        return sqs.createQueue((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function createQueue(_x) {
        return _ref.apply(this, arguments);
    };
})();

let deleteQueue = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (queueUrl, options = {}, params = {}) {
        const sqs = new AWS.SQS((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            QueueUrl: queueUrl
        };
        return sqs.deleteQueue((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function deleteQueue(_x2) {
        return _ref2.apply(this, arguments);
    };
})();

let sendMessage = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (queueUrl, messageBody, options = {}, params = {}) {
        const sqs = new AWS.SQS((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            QueueUrl: queueUrl,
            MessageBody: messageBody
        };
        return sqs.sendMessage((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function sendMessage(_x3, _x4) {
        return _ref3.apply(this, arguments);
    };
})();

let receiveMessage = (() => {
    var _ref4 = (0, _asyncToGenerator3.default)(function* (queueUrl, options = {}, params = {}) {
        const sqs = new AWS.SQS((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            QueueUrl: queueUrl
        };
        return sqs.receiveMessage((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function receiveMessage(_x5) {
        return _ref4.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const _ = require('lodash');

const retryPeriod = 500;

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

module.exports = {
    createQueue,
    deleteQueue,
    sendMessage,
    receiveMessage
};