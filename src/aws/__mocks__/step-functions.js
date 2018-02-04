const startExecution = jest.fn(() => Promise.resolve({}));
const createStateMachine = jest.fn(() => Promise.resolve({
    stateMachineArn: 'mock-state-machine-arn'
}));
const deleteStateMachine = jest.fn(() => Promise.resolve({}));
const getExecutionHistory = jest.fn(() => Promise.resolve({}));
const getActivityTask = jest.fn(() => Promise.resolve({taskToken: 'MOCK_TASK_TOKEN', input: 'MOCK_TASK_INPUT'}));
const sendTaskFailure = jest.fn(() => Promise.resolve({}));
const sendTaskHeartbeat = jest.fn(() => Promise.resolve({}));
const sendTaskSuccess = jest.fn(() => Promise.resolve({}));

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
