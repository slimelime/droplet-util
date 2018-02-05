'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let verifyToken = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (idamPortal, idamToken, idamApplicationId) {
        const authoriser = new JwtTokenVerifier(idamPortal);

        try {
            return yield authoriser.verifyToken(idamToken, idamApplicationId);
        } catch (err) {
            throw new AuthenticationError(`Validate IDAM token failed: ${err.message}`, errors.codes.Groups.Config, errors.codes.Config.Idam, errors.codes.Config.Token);
        }
    });

    return function verifyToken(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const JwtTokenVerifier = require('@myob/inbound-idam-auth');

const errors = require('./errors');
const { AuthenticationError } = errors;

module.exports = {
    verifyToken
};