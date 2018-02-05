'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let startExecution = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (stateMachineArn, input, name, options = {}, params = {}) {
        const requiredParams = {
            stateMachineArn,
            input: (0, _stringify2.default)(input),
            name
        };
        const stepFunctions = new AWS.StepFunctions((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        return stepFunctions.startExecution(requiredParams).promise();
    });

    return function startExecution(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
})();

let createStateMachine = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (stepFunctionName, stepFunctionDefinition, role, options = {}, params = {}) {
        const requiredParams = {
            definition: (0, _stringify2.default)(stepFunctionDefinition),
            name: stepFunctionName,
            roleArn: role
        };

        const stepFunctions = new AWS.StepFunctions((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        return stepFunctions.createStateMachine((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function createStateMachine(_x4, _x5, _x6) {
        return _ref2.apply(this, arguments);
    };
})();

let deleteStateMachine = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (stateMachineArn, options = {}, params = {}) {
        const requiredParams = { stateMachineArn };

        const stepFunctions = new AWS.StepFunctions((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        return stepFunctions.deleteStateMachine((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function deleteStateMachine(_x7) {
        return _ref3.apply(this, arguments);
    };
})();

let getExecutionHistory = (() => {
    var _ref4 = (0, _asyncToGenerator3.default)(function* (executionArn, options = {}, params = {}) {
        const requiredParams = { executionArn };
        const stepFunctions = new AWS.StepFunctions((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        return stepFunctions.getExecutionHistory((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function getExecutionHistory(_x8) {
        return _ref4.apply(this, arguments);
    };
})();

let getActivityTask = (() => {
    var _ref5 = (0, _asyncToGenerator3.default)(function* (activityArn, workerName, options = {}, params = {}) {
        const requiredParams = { activityArn };
        if (workerName) requiredParams.workerName = workerName;

        const stepFunctions = new AWS.StepFunctions((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        return stepFunctions.getActivityTask((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function getActivityTask(_x9, _x10) {
        return _ref5.apply(this, arguments);
    };
})();

let sendTaskFailure = (() => {
    var _ref6 = (0, _asyncToGenerator3.default)(function* (taskToken, cause = 'Unknown reason', error = 'Unknown error', options = {}, params = {}) {
        const requiredParams = { taskToken, cause, error };

        const stepFunctions = new AWS.StepFunctions((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        return stepFunctions.sendTaskFailure((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function sendTaskFailure(_x11) {
        return _ref6.apply(this, arguments);
    };
})();

let sendTaskSuccess = (() => {
    var _ref7 = (0, _asyncToGenerator3.default)(function* (taskToken, output = {}, options = {}, params = {}) {
        const requiredParams = { taskToken, output: (0, _stringify2.default)(output) };

        const stepFunctions = new AWS.StepFunctions((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        return stepFunctions.sendTaskSuccess((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function sendTaskSuccess(_x12) {
        return _ref7.apply(this, arguments);
    };
})();

let sendTaskHeartbeat = (() => {
    var _ref8 = (0, _asyncToGenerator3.default)(function* (taskToken, options = {}, params = {}) {
        const requiredParams = { taskToken };

        const stepFunctions = new AWS.StepFunctions((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));
        return stepFunctions.sendTaskHeartbeat((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function sendTaskHeartbeat(_x13) {
        return _ref8.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};

const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

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