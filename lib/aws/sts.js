'use strict';

var _asyncGenerator2 = require('babel-runtime/helpers/asyncGenerator');

var _asyncGenerator3 = _interopRequireDefault(_asyncGenerator2);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let assumeRole = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (roleArn, roleSessionName, options = {}, params = {}) {
        const sts = new AWS.STS((0, _extends3.default)({}, commonDefaultOptions, options));
        const requiredParams = {
            RoleArn: roleArn,
            RoleSessionName: roleSessionName
        };

        try {
            const {
                Credentials: {
                    AccessKeyId: accessKeyId,
                    SecretAccessKey: secretAccessKey,
                    SessionToken: sessionToken
                }
            } = yield sts.assumeRole((0, _extends3.default)({}, requiredParams, params)).promise();
            return { accessKeyId, secretAccessKey, sessionToken };
        } catch (error) {
            throw new errors.UnretryableError(error.message, errors.codes.Groups.Iam, errors.codes.Iam.AssumeRole);
        }
    });

    return function assumeRole(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();

/**
 * Calls assumeRole interactively for an iterable of role-arns, yielding intermediate credentials
 *
 * Works as an async generator, yields intermediate credentials (and pauses)
 * Can chain credentials to next steps in a feedback style, or use initial credentials to assume all roles
 * @param roleArns: iterable of role arns
 * @param roleSessionName: name for the STS session
 * @param initCredentials: initial credentials for the first call to sts.assumeRole, used for all subsequent steps if feedback = false
 * @default: {}
 * @param feedback: use credentials from step n - 1 as input to step n
 * @default = true
 * @returns {async-generator}
 */


let assumeRoleSequence = (() => {
    var _ref2 = _asyncGenerator3.default.wrap(function* (roleArns, roleSessionName, initCredentials = {}, feedback = true) {
        let credentials = initCredentials;
        for (const roleArn of roleArns) {
            credentials = yield _asyncGenerator3.default.await(exports.assumeRole(roleArn, roleSessionName, feedback ? credentials : initCredentials));
            yield credentials;
        }
    });

    return function assumeRoleSequence(_x3, _x4) {
        return _ref2.apply(this, arguments);
    };
})();

/**
 *Calls assumeRoleSequence interactively for an iterable of credentials, returning final list of credentials
 *
 * Can chain credentials to next steps in a feedback style, or use initial credentials to assume all roles
 * @param roleArns
 * @param roleSessionName
 * @param initCredentials
 * @param feedback
 * @returns {Promise}
 */


let assumeRoles = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (roleArns, roleSessionName, initCredentials = {}, feedback = true) {
        return collections.reduceAsync(collections.appendAsync(), function () {
            return [];
        }, assumeRoleSequence(roleArns, roleSessionName, initCredentials, feedback));
    });

    return function assumeRoles(_x5, _x6) {
        return _ref3.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const errors = require('../errors');
const collections = require('../collections');

const commonDefaultOptions = {};

exports.assumeRole = assumeRole;
exports.assumeRoles = assumeRoles;
exports.assumeRoleSequence = assumeRoleSequence;