jest.disableAutomock();
jest.mock('pg');
jest.mock('fs');

const fs = require('fs');
const pg = require('pg');

const {RedshiftClient} = require('./redshift-client');

const connectFn = jest.fn();
const queryFn = jest.fn();
const endFn = jest.fn();

pg.Client = jest.fn();
pg.Client.mockImplementation(() => {
    return {
        connect: connectFn,
        query: queryFn,
        end: endFn,
        _connected: true
    };
});

fs.readFileSync.mockImplementation(() => 'CERT_TEXT');

const requiredConfig = {
    user: "USER",
    password: "PASSWORD",
    host: "HOST.COM",
    port: "1234",
    database: "DATABASE"
};

const expectedPGClientConfig = {...requiredConfig};
expectedPGClientConfig.ssl = {
    rejectUnauthorized: true,
    ca: 'CERT_TEXT'
};

describe('When instantiate the redshift client class', () => {

    describe('and a config JSON is missing', () => {
        it('throws user missing error', () => {
            expect(() => new RedshiftClient())
                .toThrow(Error('A connection config is missing'));
        });
    });

    describe('and required attributes are missing from a config JSON', () => {
        const config = {...requiredConfig};
        delete config.user;

        const requiredAttributes = ['user', 'password', 'host', 'port', 'database'];
        const errorMessage = `Attributes missing. Attributes required [${requiredAttributes}]`;

        it('throws missing attributes error', () => {
            expect(() => new RedshiftClient(config))
                .toThrow(Error(errorMessage));
        });
    });

    describe('and pg client has been instantiated successfully', () => {
        beforeEach(() => {
            pg.Client.mockClear();
            /* eslint no-new: "off" */
            new RedshiftClient(requiredConfig);
        });

        it('instantiate pg client with expected value', () => {
            expect(pg.Client).toBeCalledWith(expectedPGClientConfig);
        });
    });

});

describe('When opening a connection', () => {

    describe('and a connection is established successfully', () => {
        let redshiftClient;
        let results;
        beforeEach(async (done) => {
            results = {};
            endFn.mockClear();
            connectFn.mockReturnValue(Promise.resolve());

            redshiftClient = new RedshiftClient(requiredConfig);
            await redshiftClient.openConnection();
            done();
        });

        it('opens a connection', () => {
            expect(connectFn).toBeCalled();
        });
    });

    describe('and a connection cannot be established', () => {
        let redshiftClient;
        beforeEach(async (done) => {
            endFn.mockClear();
            connectFn.mockReturnValue(Promise.reject(Error('Failed')));

            redshiftClient = new RedshiftClient(requiredConfig);
            try {
                await redshiftClient.openConnection();
                done.fail('should throw');
            } catch (err) {
                done();
            }
        });

        it('tries to establish a connection', () => {
            expect(connectFn).toBeCalled();
        });
    });

});

describe('When closing a connection', () => {

    let redshiftClient;
    beforeEach(async (done) => {
        endFn.mockClear();
        endFn.mockReturnValueOnce(Promise.resolve());
        redshiftClient = new RedshiftClient(requiredConfig);
        await redshiftClient.closeConnection();
        done();
    });

    it('closes a connection', () => {
        expect(endFn).toBeCalled();
    });

});

describe('When executing a SQL command', () => {

    describe('and SQL is executed successfully', () => {
        let redshiftClient;
        let results;
        beforeEach(async (done) => {
            results = {};
            queryFn.mockClear();
            queryFn.mockReturnValue(Promise.resolve("DATA HERE"));

            redshiftClient = new RedshiftClient(requiredConfig);
            results.data = await redshiftClient.execute("SELECT * FROM SOMETHING");
            done();
        });

        it('queries redshift with the sql passed in', () => {
            expect(queryFn.mock.calls[0][0]).toEqual("SELECT * FROM SOMETHING");
        });

        it('resolves the promise with the results', () => {
            expect(results.data).toEqual("DATA HERE");
        });
    });

    describe('and SQL has failed to execute', () => {
        let redshiftClient;
        let results;
        beforeEach(async (done) => {
            results = {};
            queryFn.mockClear();
            queryFn.mockReturnValue(Promise.reject(Error("Failed")));

            redshiftClient = new RedshiftClient(requiredConfig);
            try {
                await redshiftClient.execute("SELECT * FROM SOMETHING");
                done.fail('should throw');
            } catch (err) {
                results.err = err;
                done();
            }
        });

        it('queries redshift with the sql passed in', () => {
            expect(queryFn.mock.calls[0][0]).toEqual("SELECT * FROM SOMETHING");
        });

        it('rejects the promise with the error', () => {
            expect(results.err).toEqual(Error("Failed"));
        });
    });

});

describe('When using a bundle query function', () => {

    describe('and query fails', () => {
        let redshiftClient;
        let results;
        beforeEach(async (done) => {
            results = {};
            connectFn.mockClear();
            queryFn.mockClear();
            endFn.mockClear();
            connectFn.mockReturnValue(Promise.resolve());
            queryFn.mockReturnValue(Promise.reject(Error("nope")));

            redshiftClient = new RedshiftClient(requiredConfig);
            try {
                await redshiftClient.query("SELECT * FROM SOMETHING");
                done.fail('should throw');
            } catch (err) {
                results.err = err;
                done();
            }
        });

        it('establishes a connection', () => {
            expect(connectFn).toBeCalled();
        });

        it('queries redshift with the sql passed in', () => {
            expect(queryFn.mock.calls[0][0]).toEqual("SELECT * FROM SOMETHING");
        });

        it('closes the PG connection', () => {
            expect(endFn).toBeCalled();
        });

        it('rejects the promise with the error', () => {
            expect(results.err).toEqual(Error("nope"));
        });
    });

    describe('and query succeeds', () => {
        let redshiftClient;
        let results;
        beforeEach(async (done) => {
            results = {};
            connectFn.mockClear();
            queryFn.mockClear();
            endFn.mockClear();
            connectFn.mockReturnValue(Promise.resolve());
            queryFn.mockReturnValue(Promise.resolve("DATA HERE"));

            redshiftClient = new RedshiftClient(requiredConfig);
            results.data = await redshiftClient.query("SELECT * FROM SOMETHING");
            done();
        });

        it('establishes a redshift connection', () => {
            expect(connectFn).toBeCalled();
        });

        it('queries redshift with the expected sql', () => {
            expect(queryFn.mock.calls[0][0]).toEqual("SELECT * FROM SOMETHING");
        });

        it('closes the PG connection', () => {
            expect(endFn).toBeCalled();
        });

        it('resolves the promise with the results', () => {
            expect(results.data).toEqual("DATA HERE");
        });
    });

});

describe('and query is executed successfully', () => {

    let result;
    const SQL = 'SELECT * FROM MOCK_TABLE';

    beforeEach((done) => {
        result = {};
        connectFn.mockClear();
        queryFn.mockClear();
        endFn.mockClear();
        connectFn.mockReturnValue(Promise.resolve());
        queryFn.mockReturnValue(Promise.resolve("DATA HERE"));
        const redshiftClient = new RedshiftClient(requiredConfig);
        redshiftClient.atomicQuery(SQL)
            .then(data => {
                result.data = data;
                done();
            })
            .catch(err => {
                result.err = err;
                done.fail(err);
            });
    });

    it('opens a connection', () => {
        expect(connectFn).toBeCalled();
    });

    it('starts a transaction', () => {
        expect(queryFn).toBeCalledWith('BEGIN;');
    });

    it('executes a SQL', () => {
        expect(queryFn).toBeCalledWith(SQL);
    });

    it('ends a transaction', () => {
        expect(queryFn).toBeCalledWith('END;');
    });

    it('closes a connection', () => {
        expect(endFn).toBeCalled();
    });
});

describe('and the query fails', () => {

    let result;
    const SQL = 'SELECT * FROM MOCK_TABLE';

    beforeEach((done) => {
        result = {};
        connectFn.mockClear();
        queryFn.mockClear();
        endFn.mockClear();
        connectFn.mockReturnValue(Promise.resolve());
        queryFn.mockReturnValueOnce(Promise.resolve());
        queryFn.mockReturnValueOnce(Promise.reject(Error('Failed')));
        const redshiftClient = new RedshiftClient(requiredConfig);

        redshiftClient.atomicQuery(SQL)
            .then(data => {
                result.data = data;
                done();
            })
            .catch(err => {
                result.err = err;
                done();
            });
    });

    it('opens a connection', () => {
        expect(connectFn).toBeCalled();
    });

    it('starts a transaction', () => {
        //expect(queryFn.mock.calls[0][0]).toEqual("SELECT * FROM SOMETHING");
        expect(queryFn).toBeCalledWith('BEGIN;');
    });

    it('executes a SQL', () => {
        expect(queryFn).toBeCalledWith(SQL);
    });

    it('does not end a transaction', () => {
        expect(queryFn).not.toBeCalledWith('END;');
    });

    it('closes a connection', () => {
        expect(endFn).toBeCalled();
    });
});
