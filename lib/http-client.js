'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let post = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (url, data, contentType = 'application/json') {
        return yield request.post(url).set('Content-Type', contentType).send(data);
    });

    return function post(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const request = require('superagent');

module.exports = {
    post
};