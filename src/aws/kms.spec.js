'use strict';

jest.disableAutomock();
jest.mock('aws-sdk');

const promiseFn = jest.fn();
const decryptFn = jest.fn();
decryptFn.mockImplementation((params) => {
    return {
        promise: promiseFn
    };
});

const AWS = require('aws-sdk');
AWS.KMS = jest.fn();
AWS.KMS.mockImplementation(() => {
    return {
        decrypt: decryptFn
    };
});

const kms = require('./kms');

describe('Decrypt data', () => {
    const CIPHER_TEXT = 'VEhJUyBJUyBBIFBMQUlOIFRFWFQ=';
    const EXPECTED_PARAMS = {
        CiphertextBlob: new Buffer(CIPHER_TEXT, 'base64')
    };

    const PLAIN_TEXT = 'THIS IS A PLAIN TEXT';
    const EXPECTED_RETURN = {
        Plaintext: new Buffer(CIPHER_TEXT, 'base64')
    };

    let result;
    beforeEach(async () => {
        promiseFn.mockClear();
        decryptFn.mockClear();
        promiseFn.mockReturnValue(Promise.resolve(EXPECTED_RETURN));

        result = await kms.decrypt(CIPHER_TEXT);
    });

    it('calls aws decrypt with expected value', async () => {
        expect(decryptFn).toBeCalledWith(EXPECTED_PARAMS);
    });

    it('returns plain text', async () => {
        expect(result).toEqual(PLAIN_TEXT);
    });
});
