const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};
const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function getClusterCredentials(clusterIdentifier, dbUser, {autoCreate = false, durationSeconds = 3600} = {}, options = {}, params = {}) {
    const requiredParams = {
        ClusterIdentifier: clusterIdentifier,
        DbUser: dbUser,
        //DbName: dbName,
        AutoCreate: autoCreate,
        DurationSeconds: durationSeconds
    };
    const redshift = new AWS.Redshift({...commonDefaultOptions, ...regionDefaultOptions(), ...options});

    return redshift.getClusterCredentials({...requiredParams, ...params}).promise();
}

module.exports = {
    getClusterCredentials
};
