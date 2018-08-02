'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let createUser = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (userName, options = {}, params = {}) {
        const iam = new AWS.IAM((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            UserName: userName
        };
        return iam.createUser((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function createUser(_x) {
        return _ref.apply(this, arguments);
    };
})();

let createAccessKey = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (userName, options = {}, params = {}) {
        const iam = new AWS.IAM((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        const requiredParams = {
            UserName: userName
        };
        return iam.createAccessKey((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function createAccessKey(_x2) {
        return _ref2.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWS = require('aws-sdk');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

module.exports = {
    createUser,
    createAccessKey
};