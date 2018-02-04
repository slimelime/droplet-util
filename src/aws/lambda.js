'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function invoke(functionName, payload, async = true, options = {}, params = {}) {
    const lambda = new AWS.Lambda({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
        InvocationType: (async) ? 'Event' : 'RequestResponse'
    };
    return lambda.invoke({...requiredParams, ...params}).promise();
}


module.exports = {
    invoke
};
