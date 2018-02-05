'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let invoke = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (functionName, payload, async = true, options = {}, params = {}) {
        const lambda = new AWS.Lambda((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            FunctionName: functionName,
            Payload: (0, _stringify2.default)(payload),
            InvocationType: async ? 'Event' : 'RequestResponse'
        };
        return lambda.invoke((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function invoke(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

module.exports = {
    invoke
};