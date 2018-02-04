'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const _ = require('lodash');

const retryPeriod = 500;

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function createQueue(queueName, visibilityTimeout = 30, options = {}, params = {}) {
    const sqs = new AWS.SQS({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        QueueName: queueName,
        Attributes: {
            VisibilityTimeout: visibilityTimeout
        }
    };
    return sqs.createQueue({...requiredParams, ...params}).promise();
}

async function deleteQueue(queueUrl, options = {}, params = {}) {
    const sqs = new AWS.SQS({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        QueueUrl: queueUrl
    };
    return sqs.deleteQueue({...requiredParams, ...params}).promise();
}

async function sendMessage(queueUrl, messageBody, options = {}, params = {}) {
    const sqs = new AWS.SQS({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        QueueUrl: queueUrl,
        MessageBody: messageBody
    };
    return sqs.sendMessage({...requiredParams, ...params}).promise();
}

async function receiveMessage(queueUrl, options = {}, params = {}) {
    const sqs = new AWS.SQS({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        QueueUrl: queueUrl
    };
    return sqs.receiveMessage({...requiredParams, ...params}).promise();
}

module.exports = {
    createQueue,
    deleteQueue,
    sendMessage,
    receiveMessage
};
