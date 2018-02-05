'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let decrypt = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (cipherText, options = {}, params = {}) {
        const kms = new AWS.KMS((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));

        const requiredParams = {
            CiphertextBlob: new Buffer(cipherText, 'base64')
        };

        const data = yield kms.decrypt((0, _extends3.default)({}, requiredParams, params)).promise();
        return data.Plaintext.toString();
    });

    return function decrypt(_x) {
        return _ref.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = { decrypt };

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};
const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });