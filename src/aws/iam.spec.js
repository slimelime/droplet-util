jest.disableAutomock();
jest.mock('aws-sdk');

const createUserPromiseFn = jest.fn();
const createUserFn = jest.fn(() => ({ promise: createUserPromiseFn }));
const createAccessKeyPromiseFn = jest.fn();
const createAccessKeyFn = jest.fn(() => ({ promise: createAccessKeyPromiseFn }));

const AWS = require('aws-sdk');
AWS.IAM = jest.fn(() => ({
    createUser: createUserFn,
    createAccessKey: createAccessKeyFn
}));

const clearMocks = () => {
    createUserPromiseFn.mockClear();
    createUserFn.mockClear();
    createAccessKeyPromiseFn.mockClear();
    createAccessKeyFn.mockClear();
    AWS.IAM.mockClear();
};

const iam = require('./iam');

describe('createUser', () => {
    const UserName = 'mock-user';

    describe('creating new IAM instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await iam.createUser(UserName);
            expect(AWS.IAM).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await iam.createUser(UserName, userDefinedOptions);
            expect(AWS.IAM).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await iam.createUser(UserName, userDefinedOptions);
            expect(AWS.IAM).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.IAM().createUser with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await iam.createUser(UserName);
            expect(createUserFn).toBeCalledWith({UserName});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await iam.createUser(UserName, {}, userDefinedParams);
            expect(createUserFn).toBeCalledWith({UserName, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {UserName: 'abc'};
            await iam.createUser(UserName, {}, userDefinedParams);
            expect(createUserFn).toBeCalledWith(userDefinedParams);
        });
    });
});

describe('createAccessKey', () => {
    const UserName = 'mock-user';

    describe('creating new IAM instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await iam.createAccessKey(UserName);
            expect(AWS.IAM).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await iam.createAccessKey(UserName, userDefinedOptions);
            expect(AWS.IAM).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await iam.createAccessKey(UserName, userDefinedOptions);
            expect(AWS.IAM).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.IAM().createAccessKey with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await iam.createAccessKey(UserName);
            expect(createAccessKeyFn).toBeCalledWith({UserName});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await iam.createAccessKey(UserName, {}, userDefinedParams);
            expect(createAccessKeyFn).toBeCalledWith({UserName, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {UserName: 'abc'};
            await iam.createAccessKey(UserName, {}, userDefinedParams);
            expect(createAccessKeyFn).toBeCalledWith(userDefinedParams);
        });
    });
});
