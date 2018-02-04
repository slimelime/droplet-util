'use strict';

module.exports = { decrypt };

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};
const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function decrypt(cipherText, options = {}, params = {}) {
    const kms = new AWS.KMS({...commonDefaultOptions, ...regionDefaultOptions(), ...options});

    const requiredParams = {
        CiphertextBlob: new Buffer(cipherText, 'base64')
    };

    const data = await kms.decrypt({...requiredParams, ...params}).promise();
    return data.Plaintext.toString();
}
