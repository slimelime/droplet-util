/* eslint-disable no-process-exit,prefer-template */

const AWS = require('aws-sdk');
const fs = require('fs');
const kms = new AWS.KMS({region: process.env['AWS_DEFAULT_REGION']});

function main(callback) {
    const sonarqubeToken = process.env['ENCRYPTED_KEY'];
    if (!sonarqubeToken) {
        throw new Error('Invalid KMS Key');
    }
    const requiredParams = {
        CiphertextBlob: Buffer.from(sonarqubeToken, 'base64')
    };

    kms.decrypt(requiredParams, (err, data) => {
        if (err || !data) callback(err);

        const npmAuthToken = data.Plaintext.toString();
        console.log(npmAuthToken);
        callback(null);
    });
}

main((err) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    } else {
        process.exit(0);
    }
});
