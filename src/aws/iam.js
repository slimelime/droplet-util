const AWS = require('aws-sdk');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function createUser(userName, options = {}, params = {}) {
    const iam = new AWS.IAM({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        UserName: userName
    };
    return iam.createUser({...requiredParams, ...params}).promise();
}

async function createAccessKey(userName, options = {}, params = {}) {
    const iam = new AWS.IAM({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    const requiredParams = {
        UserName: userName
    };
    return iam.createAccessKey({...requiredParams, ...params}).promise();
}

module.exports = {
    createUser,
    createAccessKey
};
