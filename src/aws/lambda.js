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

    const response = await (lambda.invoke({...requiredParams, ...params}).promise());

    if (response.FunctionError !== undefined) {
        if (typeof response.Payload !== 'string') {
            throw response.Payload;
        }
        throw JSON.parse(response.Payload);
    } else {
        return response;
    }
}


module.exports = {
    invoke
};
