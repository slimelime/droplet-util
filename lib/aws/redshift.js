'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

let getClusterCredentials = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (clusterIdentifier, dbUser, { autoCreate = false, durationSeconds = 3600 } = {}, options = {}, params = {}) {
        const requiredParams = {
            ClusterIdentifier: clusterIdentifier,
            DbUser: dbUser,
            //DbName: dbName,
            AutoCreate: autoCreate,
            DurationSeconds: durationSeconds
        };
        const redshift = new AWS.Redshift((0, _extends3.default)({}, commonDefaultOptions, regionDefaultOptions(), options));

        return redshift.getClusterCredentials((0, _extends3.default)({}, requiredParams, params)).promise();
    });

    return function getClusterCredentials(_x, _x2) {
        return _ref.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const AWSXRay = require('aws-xray-sdk-core');
const AWS = process.env['ENABLE_AWS_X_RAY'] ? AWSXRay.captureAWS(require('aws-sdk')) : require('aws-sdk');

const commonDefaultOptions = {};
const regionDefaultOptions = () => ({ region: process.env.AWS_DEFAULT_REGION });

module.exports = {
    getClusterCredentials
};