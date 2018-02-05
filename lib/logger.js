'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _getOwnPropertyNames = require('babel-runtime/core-js/object/get-own-property-names');

var _getOwnPropertyNames2 = _interopRequireDefault(_getOwnPropertyNames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const _ = require('lodash');

// JSON.stringify return empty object for Error otherwise
if (!('toJSON' in Error.prototype)) {
    Object.defineProperty(Error.prototype, 'toJSON', {
        value: function () {
            const alt = {};

            (0, _getOwnPropertyNames2.default)(this).forEach(function (key) {
                alt[key] = this[key];
            }, this);

            return alt;
        },
        configurable: true,
        writable: true
    });
}

function log(...params) {
    console.log(...serialize(4, ...params));
}

function logLine(...params) {
    console.log(...serialize(0, ...params));
}

function error(...params) {
    console.error('Error:', ...serialize(4, ...params));
}

function serialize(indent, ...params) {
    return params.map(stringify(indent));
}

const stringify = indent => value => _.isString(value) ? value : (0, _stringify2.default)(value, null, indent);

const repeat = str => count => {
    function* generate() {
        while (count) {
            yield str;
            count--;
        }
    }
    return [...generate()].join('');
};

const line = (count, sym = '-') => console.log(repeat(sym)(count));

module.exports = {
    log,
    error,
    repeat,
    logLine,
    line,
    time: label => console.time(label),
    timeEnd: label => console.timeEnd(label)
};

// function toObject(err) {
//     return JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err).filter(key => key !== 'stack')));
// }