'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const errors = require('../errors');
const collections = require('../collections');

const commonDefaultOptions = {};

async function assumeRole(roleArn, roleSessionName, options = {}, params = {}) {
    const sts = new AWS.STS({...commonDefaultOptions, ...options});
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
        } = await sts.assumeRole({...requiredParams, ...params}).promise();
        return {accessKeyId, secretAccessKey, sessionToken};
    } catch (error) {
        throw new errors.UnretryableError(error.message, errors.codes.Groups.Iam, errors.codes.Iam.AssumeRole);
    }
}

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
async function* assumeRoleSequence(roleArns, roleSessionName, initCredentials = {}, feedback = true) {
    let credentials = initCredentials;
    for (const roleArn of roleArns) {
        credentials = await exports.assumeRole(roleArn, roleSessionName, feedback ? credentials : initCredentials);
        yield credentials;
    }
}

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
async function assumeRoles(roleArns, roleSessionName, initCredentials = {}, feedback = true) {
    return collections.reduceAsync(collections.appendAsync(/*reducingFn*/), () => [], assumeRoleSequence(roleArns, roleSessionName, initCredentials, feedback));
}

exports.assumeRole = assumeRole;
exports.assumeRoles = assumeRoles;
exports.assumeRoleSequence = assumeRoleSequence;
