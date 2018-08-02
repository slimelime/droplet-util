'use strict';

const jp = require('jsonpath');
const _ = require('lodash');

const logger = require('./logger');
const errors = require('./errors');
const {UnretryableError} = errors;

module.exports = {
    hasRequiredProperties,
    getMissingProperties,
    ensureEnvironmentVariables,
    ensureObjectProperties

};

function hasRequiredProperties(objectToValidate, requiredProperties) {
    return getMissingProperties(objectToValidate, requiredProperties).length === 0;
}

function getMissingProperties(objectToValidate, requiredProperties) {
    return requiredProperties.filter(p => !objectToValidate.hasOwnProperty(p));
}

function hasRequiredPaths(obj, paths, log = false) {
    const values = paths.map(path => jp.query(obj, path).pop());
    const missingPaths = values.reduce((acc, value, index) => {
        if (!value) {
            acc.push(paths[index]);
        }
        return acc;
    }, []);
    if (log && missingPaths.length !== 0) logger.error('Error: Missing attributes:', missingPaths);
    return [missingPaths.length === 0, missingPaths];
}

function ensureEnvironmentVariables(...args) {
    const envVars = args.reduce((acc, arg) => {
        const value = process.env[arg];
        if (value) {
            acc[arg] = value;
        }
        return acc;
    }, {});

    const missingVars = _.difference(args, Object.keys(envVars));
    if (missingVars.length > 0) {
        const error = new UnretryableError(`Missing Environment Variables: [${missingVars}]`, errors.codes.Groups.Config, errors.codes.Config.Environment, errors.codes.Config.Variables);
        throw error;
    }
    return envVars;
}

function ensureObjectProperties(objectToValidate, requiredProperties) {
    if (!hasRequiredProperties(objectToValidate, requiredProperties)) {
        const error = new UnretryableError(
            `Missing Object Properties: [${getMissingProperties(objectToValidate, requiredProperties)}]`,
            errors.codes.Groups.Config,
            errors.codes.Config.$Object,
            errors.codes.Config.Properties
        );
        throw error;
    }

    return '';
}
