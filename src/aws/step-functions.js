'use strict';

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({region: process.env.AWS_DEFAULT_REGION});

async function startExecution(stateMachineArn, input, name, options = {}, params = {}) {
    const requiredParams = {
        stateMachineArn,
        input: JSON.stringify(input),
        name
    };
    const stepFunctions = new AWS.StepFunctions({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    return stepFunctions.startExecution(requiredParams).promise();
}

async function createStateMachine(stepFunctionName, stepFunctionDefinition, role, options = {}, params = {}) {
    const requiredParams = {
        definition: JSON.stringify(stepFunctionDefinition),
        name: stepFunctionName,
        roleArn: role
    };

    const stepFunctions = new AWS.StepFunctions({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    return stepFunctions.createStateMachine({...requiredParams, ...params}).promise();
}

async function deleteStateMachine(stateMachineArn, options = {}, params = {}) {
    const requiredParams = { stateMachineArn };

    const stepFunctions = new AWS.StepFunctions({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    return stepFunctions.deleteStateMachine({...requiredParams, ...params}).promise();
}

async function getExecutionHistory(executionArn, options = {}, params = {}) {
    const requiredParams = { executionArn };
    const stepFunctions = new AWS.StepFunctions({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    return stepFunctions.getExecutionHistory({...requiredParams, ...params}).promise();
}

async function getActivityTask(activityArn, workerName, options = {}, params = {}) {
    const requiredParams = {activityArn};
    if (workerName) requiredParams.workerName = workerName;

    const stepFunctions = new AWS.StepFunctions({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    return stepFunctions.getActivityTask({...requiredParams, ...params}).promise();
}

async function sendTaskFailure(taskToken, cause = 'Unknown reason', error = 'Unknown error', options = {}, params = {}) {
    const requiredParams = {taskToken, cause, error};

    const stepFunctions = new AWS.StepFunctions({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    return stepFunctions.sendTaskFailure({...requiredParams, ...params}).promise();
}

async function sendTaskSuccess(taskToken, output = {}, options = {}, params = {}) {
    const requiredParams = {taskToken, output: JSON.stringify(output)};

    const stepFunctions = new AWS.StepFunctions({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    return stepFunctions.sendTaskSuccess({...requiredParams, ...params}).promise();
}

async function sendTaskHeartbeat(taskToken, options = {}, params = {}) {
    const requiredParams = {taskToken};

    const stepFunctions = new AWS.StepFunctions({...commonDefaultOptions, ...regionDefaultOptions(), ...options});
    return stepFunctions.sendTaskHeartbeat({...requiredParams, ...params}).promise();
}

module.exports = {
    startExecution,
    createStateMachine,
    deleteStateMachine,
    getExecutionHistory,
    getActivityTask,
    sendTaskFailure,
    sendTaskHeartbeat,
    sendTaskSuccess
};
