'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const pg = require('pg');
const fs = require('fs');

const logger = require('./logger');

const requiredAttributes = ['user', 'password', 'host', 'port', 'database'];
const SSL_CERT = 'redshift-ca-bundle.crt';

class RedshiftClient {

    constructor(config) {
        if (!config) throw Error('A connection config is missing');

        // @TODO: use property-validator.hasRequiredProperties
        requiredAttributes.forEach(attribute => {
            if (!config.hasOwnProperty(attribute)) {
                throw Error(`Attributes missing. Attributes required [${requiredAttributes}]`);
            }
        });

        this.client = new pg.Client(buildDatabaseClientConfig(config));
    }

    openConnection() {
        var _this = this;

        return (0, _asyncToGenerator3.default)(function* () {
            return _this.client.connect();
        })();
    }

    closeConnection(message = 'Closing connection!') {
        var _this2 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            // logger.log(message);
            return _this2.client.end();
        })();
    }

    execute(sql) {
        var _this3 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            if (!_this3.client._connected) {
                throw new Error('Invalid state: Not Connected. Call this.openConnection() first');
            }
            return _this3.client.query(sql);
        })();
    }

    query(sql) {
        var _this4 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            let results;
            yield _this4.openConnection();
            try {
                results = yield _this4.execute(sql);
            } finally {
                _this4.closeConnection(); // there is no value in awaiting for this to resolve, or throwing if it fails to close connection (work might have been done already)
            }
            return results;
        })();
    }

    atomicQuery(sql) {
        var _this5 = this;

        return (0, _asyncToGenerator3.default)(function* () {
            let results;
            yield _this5.openConnection();
            try {
                yield _this5.execute('BEGIN;');
                results = yield _this5.execute(sql);
                yield _this5.execute('END;');
            } finally {
                _this5.closeConnection();
            }
            return results;
        })();
    }
}

function getAbsoluteFileLocation(file) {
    return require('path').resolve(__dirname, file);
}

function buildDatabaseClientConfig(config) {
    // TODO: set connection timeout to 5 minutes
    config.ssl = {
        rejectUnauthorized: true,
        ca: fs.readFileSync(getAbsoluteFileLocation(SSL_CERT), 'utf-8').toString()
    };
    return config;
}

module.exports = { RedshiftClient, buildDatabaseClientConfig };