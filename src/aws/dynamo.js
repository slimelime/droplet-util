const fs = require('fs');
const jp = require('jsonpath');
const Rx = require('rxjs');

const docClient = require('./dynamo-document');
const s3 = require('./s3');
const readableStream = require('../readable-stream');
const streams = require('../streams');
const datetimeProvider = require('../datetime-provider');
const logger = require('../logger');

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');


const commonDefaultOptions = {};

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function updateTable(table, options = {}, params = {}) {
    const dynamoClient = new AWS.DynamoDB({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table
    };
    return dynamoClient.updateTable({...requiredParams, ...params}).promise();
}

async function createTable(table, keys = [],
                           ProvisionedThroughput = {
                               ReadCapacityUnits: 5,
                               WriteCapacityUnits: 5
                           }, options = {}, params = {}) {

    keys = keys.slice(0, 2);
    const [hashKey, rangeKey] = keys;
    if (!hashKey) throw new Error('Must provide HashKey (a.k.a PartitionKey)');

    const KeySchema = [
        {
            AttributeName: hashKey,
            KeyType: "HASH"
        }
    ];
    if (rangeKey) {
        KeySchema.push(
            {
                AttributeName: rangeKey,
                KeyType: "RANGE"
            }
        );
    }

    const AttributeDefinitions = keys.map(keyName => ({
        AttributeName: keyName,
        AttributeType: "S"
    }));


    const dynamoClient = new AWS.DynamoDB({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table,
        AttributeDefinitions,
        KeySchema,
        ProvisionedThroughput
    };
    return dynamoClient.createTable({...requiredParams, ...params}).promise();
}

async function deleteTable(table, options = {}, params = {}) {
    const dynamoClient = new AWS.DynamoDB({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table
    };
    return dynamoClient.deleteTable({...requiredParams, ...params}).promise();
}

async function describeTable(table, options = {}, params = {}) {

    const dynamoClient = new AWS.DynamoDB({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        TableName: table
    };
    return dynamoClient.describeTable({...requiredParams, ...params}).promise();
}

async function exportTable(table, {bucket, file = `${datetimeProvider.getTimestamp()}-${table}`, EOL = '\n', filterExpression = null, expressionAttributeValues = null} = {}, options = {}, params = {}) {
    const complete$ = new Rx.Subject();

    const tableMetadata = await describeTable(table, options, params);
    const readCapacityUnits = jp.value(tableMetadata, 'Table.ProvisionedThroughput.ReadCapacityUnits');
    logger.log({readCapacityUnits});
    const generatorOfBatches = await docClient.scanBatches(table, {
        filterExpression,
        expressionAttributeValues,
        flatten: false
    });
    // 'ProvisionedThroughput.WriteCapacityUnits'
    const throttlingParams = {
        objectMode: true,
        rate: readCapacityUnits, interval: 'second', burst: readCapacityUnits, initialContent: readCapacityUnits,
        consumedCapacityUnits: ({ConsumedCapacity: {CapacityUnits}}) => CapacityUnits
    };
    const scanReadableStream = readableStream.fromAsyncGeneratorOfBatches(generatorOfBatches, throttlingParams);
    let writeStream;
    const ldJSONStream = streams.objectTransformStream(
// eslint-disable-next-line prefer-arrow-callback
        function (chunk, enc, next) {
            next(null, Buffer.from(`${JSON.stringify(chunk, null, 0)}${EOL}`));
        }
    );

    const readStream = scanReadableStream
        .on('error', error => complete$.error(error))
        .pipe(ldJSONStream)
        .on('error', error => complete$.error(error));

    if (bucket) {
        try {
            await s3.upload(bucket, file, readStream);
            complete$.complete();
        } catch (error) {
            complete$.error(error);
        }
    } else {
        writeStream = fs.createWriteStream(file);

        readStream
            .pipe(writeStream)
            .on('error', error => complete$.error(error))
            .on('end', () => complete$.complete());
    }

    return complete$.toPromise();
}

module.exports = {
    updateTable,
    createTable,
    deleteTable,
    describeTable,
    exportTable
};
