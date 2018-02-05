'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let getDatabaseClientConfig = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (requiredVars = databaseClientConfigVariables) {
        const envVars = validator.ensureEnvironmentVariables(...requiredVars);
        return decrypt(envVars);
    });

    return function getDatabaseClientConfig() {
        return _ref.apply(this, arguments);
    };
})();

let decrypt = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (config) {
        return {
            user: config.REDSHIFT_USER,
            password: yield kms.decrypt(config.REDSHIFT_PASSWORD),
            host: config.REDSHIFT_HOST,
            port: config.REDSHIFT_PORT,
            database: config.REDSHIFT_DATABASE
        };
    });

    return function decrypt(_x) {
        return _ref2.apply(this, arguments);
    };
})();

/**
 * @deprecated: Do not add any more functionality to this module, would be removed when custom lambdas are deprecated
 * @type {{databaseClientConfigVariables: [string,string,string,string,string], getDatabaseClientConfig: getDatabaseClientConfig, decrypt: decrypt}}
 */


function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// TODO: USE THE DYNAMO WRAPPER!!!

const AWSXRay = require('aws-xray-sdk-core');
//const AWS = process.env['AWS_DEFAULT_REGION'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');
const AWS = require('aws-sdk');

const kms = require('./aws/kms');
const validator = require('./property-validator');

// async function getPropertyValue(propertyName) {
//     const REQUIRED_VARIABLES = ['CONFIG_TABLE'];
//     const envVars = validator.ensureEnvironmentVariables(...REQUIRED_VARIABLES);
//
//     AWS.config.update({ region: envVars.TARGET_REGION });
//     const dynamodb = new AWS.DynamoDB();
//
//     const data = await dynamodb.getItem(buildConfigQuery(propertyName)).promise();
//     return extractValue(data);
// }

// function buildConfigQuery(propertyName) {
//     const params = {
//         TableName: process.env['CONFIG_TABLE'],
//         AttributesToGet: ['propertyValue'],
//         Key: {
//             propertyName: {
//                 S: propertyName
//             }
//         }
//     };
//
//     return params;
// }

// function extractValue(result) {
//     let returnValue;
//
//     if (Object.keys(result).length === 0) {
//         returnValue = '';
//     } else {
//         returnValue = result.Item.propertyValue.S;
//     }
//
//     return returnValue;
// }

const databaseClientConfigVariables = ['REDSHIFT_USER', 'REDSHIFT_PASSWORD', 'REDSHIFT_HOST', 'REDSHIFT_PORT', 'REDSHIFT_DATABASE'];

module.exports = {
    // getPropertyValue,
    databaseClientConfigVariables,
    getDatabaseClientConfig,
    // ensureEnvironmentVariables: validator.ensureEnvironmentVariables,
    decrypt
};