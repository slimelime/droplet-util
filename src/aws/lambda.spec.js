jest.disableAutomock();
jest.mock('aws-sdk');

const AWS = require('aws-sdk');
const _ = require('lodash');

const lambda = require('./lambda');

const invokePromiseFn = jest.fn(() => Promise.resolve({Payload: {}}));
const invokeFn = jest.fn(() => ({ promise: invokePromiseFn }));


AWS.Lambda = jest.fn(() => ({
    invoke: invokeFn
}));


const clearMocks = () => {
    invokePromiseFn.mockClear();
    invokeFn.mockClear();
};

describe('invoke Lambda', () => {
    beforeEach(() => {
        clearMocks();
        AWS.Lambda.mockClear();
    });
    const lambdaName = 'MOCK_LAMBDA_NAME';
    const payload = {
        key: 'MOCK_PAYLOAD_DATA'
    };
    const invokeAsync = true;

    invokePromiseFn.mockReturnValue(Promise.resolve({ StatusCode: 200 }));

    describe('creating new lambda instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const {AWS_DEFAULT_REGION} = process.env;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await lambda.invoke(lambdaName);
            expect(AWS.Lambda).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await lambda.invoke(lambdaName, payload, invokeAsync, userDefinedOptions);
            expect(AWS.Lambda).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await lambda.invoke(lambdaName, payload, invokeAsync, userDefinedOptions);
            expect(AWS.Lambda).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });

    });

    describe('calling AWS.Lambda.invoke with expected params', () => {
        beforeEach(() => {
            clearMocks();
            AWS.Lambda.mockClear();
        });

        it('passes required params and calls lambda asynchronously', async () => {
            await lambda.invoke(lambdaName, payload, invokeAsync);
            expect(invokeFn).toBeCalledWith({FunctionName: lambdaName, InvocationType: 'Event', Payload: JSON.stringify(payload)});
        });

        it('passes required params and calls lambda synchronously', async () => {
            const invokeLambdaAsync = false;
            await lambda.invoke(lambdaName, payload, invokeLambdaAsync);
            expect(invokeFn).toBeCalledWith({FunctionName: lambdaName, InvocationType: 'RequestResponse', Payload: JSON.stringify(payload)});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await lambda.invoke(lambdaName, payload, invokeAsync, {}, userDefinedParams);
            expect(invokeFn).toBeCalledWith({FunctionName: lambdaName, InvocationType: 'Event', Payload: JSON.stringify(payload), ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {FunctionName: 'ANOTHER_MOCK_LAMBDA_NAME'};
            await lambda.invoke(lambdaName, payload, invokeAsync, {}, userDefinedParams);
            expect(invokeFn).toBeCalledWith({InvocationType: 'Event', Payload: JSON.stringify(payload), ...userDefinedParams});
        });
    });

    describe('when AWS Lambda returns a response with { FunctionError }', () => {
        // Lambda SDK behaviour when the lambda fails is counter-intuitive - see
        //    https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invokeAsync-property
        const lambdaResponse = {
            StatusCode: '200',
            FunctionError: 'Handled',
            Payload: {}
        };

        const errorObject = { message: 'some error message', statusCode: '400' };

        beforeEach(() => {
            clearMocks();
            AWS.Lambda.mockClear();
        });

        it('lambda.invoke should reject with the response.Payload', async () => {
            invokePromiseFn.mockReturnValueOnce(Promise.resolve(_.assign({}, lambdaResponse, {Payload: errorObject})));

            // Expecting lambda.invoke to reject - try catch block used with await style code to catch rejection.
            try {
                await lambda.invoke(lambdaName, payload, invokeAsync);
            } catch (error) {
                expect(error).toEqual(errorObject);
            }
        });

        it('lambda.invoke should reject with the parsed response.Payload, if it is a string', async () => {
            invokePromiseFn.mockReturnValueOnce(Promise.resolve(_.assign({}, lambdaResponse, {Payload: JSON.stringify(errorObject)})));

            try {
                await lambda.invoke(lambdaName, payload, invokeAsync);
            } catch (error) {
                expect(error).toEqual(errorObject);
            }
        });
    });
});
