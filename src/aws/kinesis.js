'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const sqs = require('./sqs');
const logger = require('../logger');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function putRecord(streamName, partitionKey, record, options = {}, params = {}) {
    const kinesis = new AWS.Kinesis({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Data: JSON.stringify(record),
        PartitionKey: partitionKey,
        StreamName: streamName
    };
    return kinesis.putRecord({...requiredParams, ...params}).promise();
}

async function putRecordWithBackupQueue(streamName, partitionKey, record, queueUrl, options = {}, params = {}) {
    const kinesis = new AWS.Kinesis({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Data: JSON.stringify(record),
        PartitionKey: partitionKey,
        StreamName: streamName
    };

    try {
        return await kinesis.putRecord({...requiredParams, ...params}).promise();
    } catch (err) {
        logger.error(err);
        return await sqs.sendMessage(queueUrl, record);
    }
}

/**
 * Writes records to the same shard
 *
 * Not useful for writing each record to its own shard
 * @param streamName
 * @param partitionKey
 * @param records
 * @param options
 * @param params
 * @returns {Promise<Kinesis.Types.PutRecordsOutput>}
 */
async function putRecords(streamName, partitionKey, records, options = {}, params = {}) {
    const kinesis = new AWS.Kinesis({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        Records: records.map(record => ({
            Data: JSON.stringify(record),
            PartitionKey: partitionKey
        })),
        StreamName: streamName
    };
    return kinesis.putRecords({...requiredParams, ...params}).promise();
}

function extractRecords(event) {
    return event.Records.map((record) => {
        // Kinesis data is base64 encoded so decode here
        const decodedData = new Buffer(record.kinesis.data, 'base64').toString('utf-8');
        try {
            return JSON.parse(decodedData);
        } catch (ex) {
            throw new Error(`Error decoding JSON: [${decodedData}]`, ex);
        }
    });
}

module.exports = {
    putRecord,
    putRecordWithBackupQueue,
    putRecords,
    extractRecords
};
