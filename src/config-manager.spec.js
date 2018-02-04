'use strict';

jest.disableAutomock();
jest.mock('aws-sdk');
jest.mock('./aws/kms');

const configManager = require('./config-manager');
const getItemFn = jest.fn();
const getItemPromiseFn = jest.fn();

getItemFn.mockImplementation(() => ({
    promise: getItemPromiseFn
}));

const AWS = require('aws-sdk');
AWS.DynamoDB = jest.fn();
AWS.DynamoDB.mockImplementation(() => ({
    getItem: getItemFn
}));

const kms = require('./aws/kms');

describe('When lambda environment variables are not set properly', () => {

    // describe('and CONFIG_TABLE variable is missing', () => {
    //
    //     let result;
    //     beforeEach((done) => {
    //         result = {};
    //         delete process.env['CONFIG_TABLE'];
    //         configManager.getPropertyValue('mockPropertyName')
    //             .then(data => {
    //                 result.data = data;
    //                 done();
    //             })
    //             .catch(err => {
    //                 result.err = err;
    //                 done();
    //             });
    //     });
    //
    //     it('return CONFIG_TABLE missing error', () => {
    //         expect(result.err.message).toEqual(expect.stringContaining('CONFIG_TABLE'));
    //     });
    //
    // });

    describe('and Redshift connection environment variables are not set', () => {
        const requiredVars = ['REDSHIFT_USER', 'REDSHIFT_PASSWORD', 'REDSHIFT_HOST', 'REDSHIFT_PORT', 'REDSHIFT_DATABASE'];

        beforeEach(() => {
            requiredVars.forEach(v => delete process.env[v]);
        });

        it('should reject a promise with a missing environment variables error', async () => {
            try {
                await configManager.getDatabaseClientConfig();
                // Jest doesn't have mocha/jasmin fail() method.
                // Waiting for https://github.com/facebook/jest/pull/3068 in jest v20
                throw new Error('Fail');
            } catch (err) {
                expect(err.message).toEqual(expect.stringContaining(`${requiredVars}`));
            }
        });


    });

});

describe('When Redshift connection environment variables are set correctly', () => {
    const requiredVars = ['REDSHIFT_USER', 'REDSHIFT_PASSWORD', 'REDSHIFT_HOST', 'REDSHIFT_PORT', 'REDSHIFT_DATABASE'];
    const expectedConfig = {
        database: 'REDSHIFT_DATABASE',
        host: 'REDSHIFT_HOST',
        password: 'PLAIN_TEXT_PASSWORD',
        port: 'REDSHIFT_PORT',
        user: 'REDSHIFT_USER'
    };

    beforeEach(() => {
        requiredVars.forEach(v => process.env[v] = v);
    });

    afterEach(() => {
        requiredVars.forEach(v => delete process.env[v]);
    });

    it('should return an object with required variables keys/values', async () => {
        const envVars = await configManager.getDatabaseClientConfig();
        expect(kms.decrypt).toBeCalledWith('REDSHIFT_PASSWORD');
        expect(envVars).toEqual(expect.objectContaining(expectedConfig));
    });
});

// describe('When getting config manager property value', () => {
//
//     beforeEach(() => {
//         process.env['CONFIG_TABLE'] = 'MockTable';
//     });
//
//     describe('and a property value is found', () => {
//
//         const expectedSQL = {
//             TableName: 'MockTable',
//             AttributesToGet: ['propertyValue'],
//             Key: {
//                 propertyName: {
//                     S: 'mockPropertyName'
//                 }
//             }
//         };
//
//         const returnValue = {
//             Item: {
//                 propertyValue: {
//                     S: 'mockPropertyValue'
//                 }
//             }
//         };
//
//         let result;
//         beforeEach((done) => {
//             result = {};
//             getItemFn.mockClear();
//             getItemPromiseFn.mockClear();
//             getItemPromiseFn.mockReturnValueOnce(Promise.resolve(returnValue));
//             configManager.getPropertyValue('mockPropertyName')
//                 .then(data => {
//                     result.data = data;
//                     done();
//                 })
//                 .catch(err => {
//                     result.err = err;
//                     done();
//                 });
//         });
//
//         it('queries config table with expected SQL Structure', () => {
//             expect(getItemFn.mock.calls[0][0]).toEqual(expectedSQL);
//         });
//
//         it('returns expected value', () => {
//             expect(result.data).toEqual('mockPropertyValue');
//         });
//     });
//
//     describe('and a property value is not found', () => {
//
//         const returnValue = {};
//
//         let result;
//         beforeEach((done) => {
//             result = {};
//             getItemFn.mockClear();
//             getItemPromiseFn.mockClear();
//             getItemPromiseFn.mockReturnValueOnce(Promise.resolve(returnValue));
//             configManager.getPropertyValue('mockPropertyName')
//                 .then(data => {
//                     result.data = data;
//                     done();
//                 })
//                 .catch(err => {
//                     result.err = err;
//                     done();
//                 });
//         });
//
//         it('returns expected value', () => {
//             expect(result.data).toEqual('');
//         });
//     });
//
//     describe('and dynamo DB encounter error', () => {
//
//         const error = Error('MOCK-ERROR');
//
//         let result;
//         beforeEach((done) => {
//             result = {};
//             getItemFn.mockClear();
//             getItemPromiseFn.mockClear();
//             getItemPromiseFn.mockReturnValueOnce(Promise.reject(error));
//             configManager.getPropertyValue('mockPropertyName')
//                 .then(data => {
//                     result.data = data;
//                     done();
//                 })
//                 .catch(err => {
//                     result.err = err;
//                     done();
//                 });
//         });
//
//         it('returns error', () => {
//             expect(result.err).toEqual(error);
//         });
//     });
//
// });

// describe('ensureEnvironmentVariables', () => {
//     const VAR1 = 'ensureEnvironmentVariables_1';
//     const VAR2 = 'ensureEnvironmentVariables_2';
//     const MISSING_VAR1 = 'missing_ensureEnvironmentVariables_1';
//     const MISSING_VAR2 = 'missing_ensureEnvironmentVariables_2';
//
//     beforeEach(() => {
//         process.env[VAR1] = VAR1;
//         process.env[VAR2] = VAR2;
//     });
//
//     afterEach(() => {
//         delete process.env[VAR1];
//         delete process.env[VAR2];
//     });
//
//     it('returns an object with environment variables keys/values', () => {
//         const envVars = configManager.ensureEnvironmentVariables(VAR1, VAR2);
//         expect(envVars).toEqual({[VAR1]: VAR1, [VAR2]: VAR2 });
//     });
//
//     it('throws an Error with a list of missing variables in the message', () => {
//         try {
//             configManager.ensureEnvironmentVariables(VAR1, MISSING_VAR1, VAR2, MISSING_VAR2);
//         } catch (err) {
//             expect(err.message).toEqual(expect.stringContaining(`${[MISSING_VAR1, MISSING_VAR2]}`));
//         }
//     });
// });
