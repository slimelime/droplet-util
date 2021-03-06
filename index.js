module.exports = {
    aws: {
        dynamo: require('./lib/aws/dynamo'),
        dynamoDocument: require('./lib/aws/dynamo-document'),
        iam: require('./lib/aws/iam'),
        kinesis: require('./lib/aws/kinesis'),
        kms: require('./lib/aws/kms'),
        lambda: require('./lib/aws/lambda'),
        redshift: require('./lib/aws/redshift'),
        s3: require('./lib/aws/s3'),
        sns: require('./lib/aws/sns'),
        sqs: require('./lib/aws/sqs'),
        stepFunctions: require('./lib/aws/step-functions'),
        sts: require('./lib/aws/sts')
    },
    collections: require('./lib/collections'),
    configManager: require('./lib/config-manager'),
    datetimeProvider: require('./lib/datetime-provider'),
    errorCodes: require('./lib/error-codes'),
    errors: require('./lib/errors'),
    idamTokenValidator: require('./lib/idam-token-validator'),
    jsonSchema: require('./lib/json-schema'),
    jsonTransformer: require('./lib/json-transformer'),
    logger: require('./lib/logger'),
    propertyValidator: require('./lib/property-validator'),
    readableStream: require('./lib/readable-stream'),
    redshift: require('./lib/redshift'),
    redshiftClient: require('./lib/redshift-client'),
    rxjs: require('./lib/rxjs'),
    stream: require('./lib/streams'),
    streamLineRanges: require('./lib/streams-line-ranges'),
    strings: require('./lib/strings')
};
