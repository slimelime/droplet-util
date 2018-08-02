module.exports = {
    logger: require('./lib/logger'),
    propertyValidator: require('./lib/property-validator'),
    idamTokenValidator: require('./lib/idam-token-validator'),
    datetimeProvider: require('./lib/datetime-provider'),
    jsonTransformer: require('./lib/json-transformer'),
    kms: require('./lib/aws/kms')
};
