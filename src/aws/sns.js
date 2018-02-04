'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const _ = require('lodash');

const retryPeriod = 500;

const commonDefaultOptions = {
    maxRetries: 8,
    retryDelayOptions: {
        customBackoff(retryCount) {
            return Math.pow(2, retryCount) * retryPeriod;
        }
    }
};

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function publish(topicArn, subject, message, options = {}, params = {}) {
    const sns = new AWS.SNS({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TopicArn: topicArn,
        Subject: subject,
        Message: _.isString(message) ? message : JSON.stringify(message, null, 4)
    };
    return sns.publish({...requiredParams, ...params}).promise();
}

function extractRecords(event, take = 1) {
    const results = event.Records.map((record) => {
        const payload = record.Sns.Message;
        try {
            return JSON.parse(payload);
        } catch (ex) {
            throw new Error(`Error decoding JSON: [${payload}]`, ex);
        }
    });
    // seems that AWS SNS only sends one message to subscribed lambda currently. In case that changes, we can handle here.
    return results.slice(0, take);
}

module.exports = {
    publish,
    extractRecords
};
