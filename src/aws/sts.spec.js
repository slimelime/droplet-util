'use strict';

jest.disableAutomock();
jest.mock('aws-sdk');

const promiseFn = jest.fn();
const assumeRoleFn = jest.fn((params) => ({promise: promiseFn}));

const AWS = require('aws-sdk');
AWS.STS = jest.fn(() => ({
    assumeRole: assumeRoleFn
}));

const sts = require('./sts');

describe('assumeRole', () => {
    const RoleArn = 'mock-arn';
    const RoleSessionName = 'mock-session-name';
    const CREDENTIAL = {
        Credentials: {
            AccessKeyId: 'AKIAIOSFODNN7EXAMPLE',
            SecretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYzEXAMPLEKEY',
            SessionToken: 'AQoDYXdzEPXAMPLEtc764bNrC9SAPBSM22wDOk',
            Expiration: ''
        },
        AssumedRoleUser: {
            Arn: 'arn:aws:sts::123456789012:assumed-role/demo/Bob',
            AssumedRoleId: 'ARO123EXAMPLE123:Bob'
        },
        PackedPolicySize: 6
    };
    const credentialSet = {
        accessKeyId: CREDENTIAL.Credentials.AccessKeyId,
        secretAccessKey: CREDENTIAL.Credentials.SecretAccessKey,
        sessionToken: CREDENTIAL.Credentials.SessionToken
    };

    beforeEach(() => {
        promiseFn.mockClear();
        assumeRoleFn.mockClear();
        promiseFn.mockReturnValueOnce(Promise.resolve(CREDENTIAL));
    });

    it('passes user defined options', async () => {
        const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};
        await sts.assumeRole(RoleArn, RoleSessionName, userDefinedOptions);
        expect(AWS.STS).toBeCalledWith(expect.objectContaining(userDefinedOptions));
    });

    it('passes required params', async () => {
        await sts.assumeRole(RoleArn, RoleSessionName);
        expect(assumeRoleFn).toBeCalledWith({RoleArn, RoleSessionName});
    });

    it('passes user defined params', async () => {
        const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
        await sts.assumeRole(RoleArn, RoleSessionName, {}, userDefinedParams);
        expect(assumeRoleFn).toBeCalledWith({RoleArn, RoleSessionName, ...userDefinedParams});
    });

    it('returns accessKeyId, secretAccessKey, sessionToken', async () => {
        const result = await sts.assumeRole(RoleArn, RoleSessionName);
        expect(result).toEqual(credentialSet);
    });
});
