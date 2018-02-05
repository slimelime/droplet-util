'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable array-callback-return,max-statements-per-line,no-unused-expressions,no-template-curly-in-string */
const _ = require('lodash');
const uuid = require('uuid');
const traverse = require('traverse');
const jp = require('jsonpath');
const MD5 = require('md5.js');

const colls = require('./collections');
const datetimeProvider = require('./datetime-provider');
const logger = require('./logger');
const sx = require('./strings');

const regex = {
    safeDot: /\.(?![\w\.]+")/,
    memberOrDescendant: /^[\[\.]/,
    PIPE: /\s*\|\s*/
};

const jpify2 = path => path.startsWith('$') ? path : regex.memberOrDescendant.test(path) ? `$${path}` : `$.${path}`;

const castingFunctionError = sx.lazyTemplate('Error: value: [${value}] is not a valid ${type}');

const builtinFns = {
    now: () => datetimeProvider.getTimestamp(),
    nowAsISOString: () => datetimeProvider.getDateAsISOString(),
    uuid: () => uuid.v4(),
    hash: payload => new MD5().update((0, _stringify2.default)(payload, null, 0)).digest('hex'),
    toBool: value => ['true', 'yes', 'y'].includes(value ? value.toLowerCase() : value),
    toInteger: value => {
        const result = parseInt(value, 10);return _.isNaN(result) ? castingFunctionError({ value, type: 'integer' }) : result;
    },
    toFloat: value => {
        const result = parseFloat(value, 10);return _.isNaN(result) ? castingFunctionError({ value, type: 'float' }) : result;
    },
    // toFloat: value => parseFloat(value, 10),
    toNull: value => ['null'].includes(value ? value.toLowerCase() : value) ? null : value,
    toLowerCase: value => value ? value.toLowerCase() : value,
    toUpperCase: value => value ? value.toUpperCase() : value
};

const transform = (template, { functions = {}, args = {}, throws = false, nullifyMissing = true } = {}, { builtins = builtinFns } = {}) => data => {
    if (colls.isEmptyValue(template)) return data;

    const missingFunctionError = sx.lazyTemplate('Error: No such builtin function: [${node}]');

    const fns = (0, _extends3.default)({}, builtins, functions);

    return traverse(template).map(function (node) {
        const that = this;
        if (that.isRoot || !_.isString(node)) return;

        if (node.startsWith('@')) {
            const fnName = node.slice(1);
            const fn = fns[fnName] || (throws ? () => {
                throw new Error(missingFunctionError({ node }));
            } : colls.lazy(missingFunctionError({ node })));

            const arg = args[fnName] ? args[fnName].path ? jp.value(data, args[fnName].path) : args[fnName].value !== undefined ? args[fnName].value : args[fnName] : undefined;
            that.update(fn(arg), true);
        } else if (node.startsWith('$')) {
            const [path, ...fnNames] = node.split(regex.PIPE);
            let value = jp.value(data, path);
            value = value === undefined ? nullifyMissing ? null : value : value;
            const pipeline = fnNames.length === 0 ? colls.identity : colls.pipe(...colls.map(fnName => {
                return fns[fnName] || (throws ? () => {
                    throw new Error(missingFunctionError({ node }));
                } : colls.lazy(missingFunctionError({ node })));
            }, fnNames));
            value = pipeline(value);
            that.update(value); // if path is not found in data, the key would disappear upon JSON.stringify the result.
        }
    });
};

module.exports = {
    transform,
    builtinFns
};