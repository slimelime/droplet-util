'use strict';

const pg = require('pg');
const fs = require('fs');

const logger = require('./logger');

const requiredAttributes = ['user', 'password', 'host', 'port', 'database'];
const SSL_CERT = 'redshift-ca-bundle.crt';

class RedshiftClient {

    constructor(config) {
        if (!config) throw Error('A connection config is missing');

        // @TODO: use property-validator.hasRequiredProperties
        requiredAttributes.forEach((attribute) => {
            if (!config.hasOwnProperty(attribute)) {
                throw Error(`Attributes missing. Attributes required [${requiredAttributes}]`);
            }
        });

        this.client = new pg.Client(buildDatabaseClientConfig(config));
    }

    async openConnection() {
        return this.client.connect();
    }

    async closeConnection(message = 'Closing connection!') {
        logger.log(message);
        return this.client.end();
    }

    async execute(sql) {
        if (!this.client._connected) {
            throw new Error('Invalid state: Not Connected. Call this.openConnection() first');
        }
        return this.client.query(sql);
    }

    async query(sql) {
        let results;
        await this.openConnection();
        try {
            results = await this.execute(sql);
        } finally {
            this.closeConnection(); // there is no value in awaiting for this to resolve, or throwing if it fails to close connection (work might have been done already)
        }
        return results;
    }

    async atomicQuery(sql) {
        let results;
        await this.openConnection();
        try {
            await this.execute('BEGIN;');
            results = await this.execute(sql);
            await this.execute('END;');
        } finally {
            this.closeConnection();
        }
        return results;
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

module.exports = {RedshiftClient, buildDatabaseClientConfig};
