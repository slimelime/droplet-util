jest.mock('aws-sdk');

const AWS = require('aws-sdk');
const stepFunctions = require('./step-functions');

/** The only place where AWS.StepFunctions.* should be mocked explicitly,
 * other AWS.* members would be mocked using similar boilerplate
 * */

const promiseFn = jest.fn();
const startExecutionFn = jest.fn();
const createStateMachineFn = jest.fn();
const deleteStateMachineFn = jest.fn();
const getExecutionHistoryFn = jest.fn();
const getActivityTaskFn = jest.fn();

startExecutionFn.mockImplementation(() => ({
    promise: promiseFn
}));
createStateMachineFn.mockImplementation(() => ({
    promise: promiseFn
}));
deleteStateMachineFn.mockImplementation(() => ({
    promise: promiseFn
}));
getExecutionHistoryFn.mockImplementation(() => ({
    promise: promiseFn
}));
getActivityTaskFn.mockImplementation(() => ({
    promise: promiseFn
}));

AWS.StepFunctions = jest.fn();
AWS.StepFunctions.mockImplementation(() => ({
    startExecution: startExecutionFn,
    createStateMachine: createStateMachineFn,
    deleteStateMachine: deleteStateMachineFn,
    getExecutionHistory: getExecutionHistoryFn,
    getActivityTask: getActivityTaskFn
}));

const stateMachineArn = 'MOCK_ARN';
const payload = {};
const name = 'MOCK_NAME';

describe('step-functions', () => {

    beforeEach(() => {
        promiseFn.mockClear();
        startExecutionFn.mockClear();
        AWS.StepFunctions.mockClear();
        createStateMachineFn.mockClear();
        deleteStateMachineFn.mockClear();
        getExecutionHistoryFn.mockClear();
        promiseFn.mockReturnValue(Promise.resolve('OK'));
    });

    describe('startExecution', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const { AWS_DEFAULT_REGION } = process.env;

        beforeEach(() => {
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async() => {
            await stepFunctions.startExecution(payload);
            expect(AWS.StepFunctions).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('favours user defined options', async() => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await stepFunctions.startExecution(stateMachineArn, payload, name, userDefinedOptions);
            expect(AWS.StepFunctions).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });

        it('passes payload to step functions', async() => {
            await stepFunctions.startExecution(stateMachineArn, payload, name);
            expect(startExecutionFn).toBeCalledWith({stateMachineArn, input: JSON.stringify(payload), name});
        });

    });

    describe('createStateMachine', () => {

        const STEP_FUNCTION_DEFINITION = {
            States: 'MOCK'
        };

        const EXPECTED_CALL = {
            definition: JSON.stringify(STEP_FUNCTION_DEFINITION),
            name: 'mock-name',
            roleArn: 'mock-role'
        };

        let result;
        beforeEach((done) => {
            result = {};
            stepFunctions.createStateMachine('mock-name', STEP_FUNCTION_DEFINITION, 'mock-role', {region: 'mock-region'})
                .then(data => {
                    result.data = data;
                    done();
                })
                .catch(err => {
                    result.err = err;
                    done();
                });
        });

        it('sets AWS region', async() => {
            expect(AWS.StepFunctions).toBeCalledWith(expect.objectContaining({region: 'mock-region'}));
        });

        it('calls create step function with expected parameters', () => {
            expect(createStateMachineFn).toBeCalledWith(EXPECTED_CALL);
        });

        it('resolves promise', () => {
            expect(result.data).toEqual('OK');
        });

        it('does not return error', () => {
            expect(result.err).toBeUndefined();
        });

    });

    describe('deleteStateMachine', () => {
        const ARN = 'mock-arn';

        const EXPECTED_CALL = {
            stateMachineArn: ARN
        };

        let result;
        beforeEach((done) => {
            result = {};
            stepFunctions.deleteStateMachine(ARN, {region: 'mock-region'})
                .then(data => {
                    result.data = data;
                    done();
                })
                .catch(err => {
                    result.err = err;
                    done();
                });
        });

        it('sets AWS region', async() => {
            expect(AWS.StepFunctions).toBeCalledWith(expect.objectContaining({region: 'mock-region'}));
        });

        it('calls create step function with expected parameters', () => {
            expect(deleteStateMachineFn).toBeCalledWith(EXPECTED_CALL);
        });

        it('resolves promise', () => {
            expect(result.data).toEqual('OK');
        });

        it('does not return error', () => {
            expect(result.err).toBeUndefined();
        });

    });

    describe('getExecutionHistory', () => {
        const EXECUTION_ARN = 'mock-arn';
        const REGION = 'mock-region';

        let result;
        beforeEach((done) => {
            result = {};
            stepFunctions.getExecutionHistory(EXECUTION_ARN, {region: REGION})
                .then(data => {
                    result.data = data;
                    done();
                })
                .catch(err => {
                    result.err = err;
                    done();
                });
        });

        it('sets AWS region', async() => {
            expect(AWS.StepFunctions).toBeCalledWith(expect.objectContaining({region: REGION}));
        });

        it('calls create step function with expected parameters', () => {
            expect(getExecutionHistoryFn).toBeCalledWith({ executionArn: EXECUTION_ARN });
        });

        it('resolves promise', () => {
            expect(result.data).toEqual('OK');
        });

        it('does not return error', () => {
            expect(result.err).toBeUndefined();
        });

    });

    describe('getActivityTask', () => {
        const ACTIVITY_ARN = 'mock-activity-arn';
        const WORKER_NAME = 'MOCK_WORKER_NAME';
        const REGION = 'mock-region';

        let result;
        beforeEach((done) => {
            result = {};
            stepFunctions.getActivityTask(ACTIVITY_ARN, WORKER_NAME, {region: REGION})
                .then(data => {
                    result.data = data;
                    done();
                })
                .catch(err => {
                    result.err = err;
                    done();
                });
        });

        it('sets AWS region', async() => {
            expect(AWS.StepFunctions).toBeCalledWith(expect.objectContaining({region: REGION}));
        });

        it('calls get activity task with expected parameters', () => {
            expect(getActivityTaskFn).toBeCalledWith({ activityArn: ACTIVITY_ARN, workerName: WORKER_NAME});
        });

        it('resolves promise', () => {
            expect(result.data).toEqual('OK');
        });

        it('does not return error', () => {
            expect(result.err).toBeUndefined();
        });
    });

});
