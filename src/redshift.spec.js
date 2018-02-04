/* eslint-disable new-cap */

jest.disableAutomock();
jest.mock('./redshift-client');

const escape = require('pg-escape');

const {RedshiftClient} = require('./redshift-client');
const {openConnection, execute, closeConnection, query} = RedshiftClient();

const redshift = require('./redshift');

const clearMocks = () => {
    openConnection.mockClear();
    execute.mockClear();
    query.mockClear();
    closeConnection.mockClear();
};

describe('getStlLoadError', () => {

    const bucket = 'mock-bucket';
    const key = 'unprocessed/mock-file.csv';
    const timestamp = '20170723T153054236';
    const expectedTimestamp = '2017-07-23 15:30:54.236';
    const sessionid = 1000;
    const queryid = 2000;

    const expectedSTLLoadErrorSQL = escape(`SELECT
session AS sessionid,
query AS "queryid",
*
FROM stl_load_errors
WHERE
session = %s
AND query = %s
AND TIMESTAMP_CMP(starttime, %L) > 0`, sessionid, queryid, expectedTimestamp);

    const redshiftClient = new RedshiftClient();

    beforeEach(() => {
        clearMocks();
    });

    describe('and error record is "found"', () => {

        const stlLoadErrorsResults = {
            rows: [
                {
                    starttime: '2017-07-23T15:30:54.236Z',
                    filename: 's3://monitoring-droplet-staging/unprocessed/COPY20_integration_test_suite_big.csv',
                    line_number: '2',
                    colname: 'header_1',
                    type: 'int4      ',
                    col_length: '0         ',
                    position: 0,
                    raw_line: 'world,bar        ',
                    raw_field_value: 'world',
                    err_code: 100,
                    err_reason: "Invalid digit, Value 'w', Pos 0, Type: Integer       "
                }
            ],
            fields: [
                {name: 'starttime'},
                {name: 'filename'},
                {name: 'line_number'},
                {name: 'colname'},
                {name: 'type'},
                {name: 'col_length'},
                {name: 'position'},
                {name: 'raw_line'},
                {name: 'raw_field_value'},
                {name: 'err_code'},
                {name: 'err_reason'}
            ]
        };

        let result;

        const expectedReturnValues = [{
            starttime: '2017-07-23T15:30:54.236Z',
            filename: 's3://monitoring-droplet-staging/unprocessed/COPY20_integration_test_suite_big.csv',
            line_number: '2',
            colname: 'header_1',
            type: 'int4',
            col_length: '0',
            position: 0,
            raw_line: 'world,bar',
            raw_field_value: 'world',
            err_code: 100,
            err_reason: "Invalid digit, Value 'w', Pos 0, Type: Integer"
        }];

        beforeEach((done) => {
            result = {};
            execute.mockReturnValueOnce(Promise.resolve(stlLoadErrorsResults));
            redshift.getSTLLoadError(redshiftClient, sessionid, queryid, timestamp)
                .then(data => {
                    result.data = data;
                    done();
                })
                .catch(err => {
                    result.err = err;
                    done.fail(err);
                });
        });

        it('executes a SQL', () => {
            expect(execute).toBeCalledWith(expectedSTLLoadErrorSQL);
        });

        it('returns error record', () => {
            expect(result.data).toEqual(expectedReturnValues);
        });
    });

    describe('and error record is "not found"', () => {
        let result;
        const stlLoadErrorsResults = {
            rows: [],
            fields: [
                {name: 'starttime'},
                {name: 'filename'},
                {name: 'line_number'},
                {name: 'colname'},
                {name: 'type'},
                {name: 'col_length'},
                {name: 'position'},
                {name: 'raw_line'},
                {name: 'raw_field_value'},
                {name: 'err_code'},
                {name: 'err_reason'}
            ]
        };

        beforeEach((done) => {
            result = {};
            execute.mockReturnValueOnce(Promise.resolve(stlLoadErrorsResults));
            redshift.getSTLLoadError(redshiftClient, sessionid, queryid, timestamp)
                .then(data => {
                    result.data = data;
                    done();
                })
                .catch(err => {
                    result.err = err;
                    done.fail(err);
                });
        });

        it('executes a SQL', () => {
            expect(execute).toBeCalledWith(expectedSTLLoadErrorSQL);
        });

        it('returns error record', () => {
            expect(result.data).toEqual([]);
        });
    });
});

describe('isLoadError', () => {
    const expectedReturnValue = {
        message: `Load into table 'integration_test_suite' failed.  Check 'stl_load_errors' system table for details.`,
        name: 'error',
        length: 199,
        severity: 'ERROR',
        code: 'XX000',
        file: '/home/ec2-user/padb/src/pg/src/backend/commands/commands_copy.c',
        line: '2426',
        routine: 'DoCopy'
    };

    it('detects if the error object is a Load Error', () => {
        expect(redshift.isLoadError(expectedReturnValue)).toBe(true);
    });

    it('detects if the error object is not a Load Error', () => {
        expect(redshift.isLoadError({error: "The specified S3 prefix 'processed/20170809T085600_integration_test_suite.csv' does not exist", code: 'XX000', routine: 'pg_throw'})).toBe(false);
    });

    it('detects if the error object is not a Load Error', () => {
        expect(redshift.isLoadError({error: "syntax error at or near \"integration_test_suite\"", code: '42601'})).toBe(false);
    });
});

describe('getTableDdl', () => {
    const redshiftClient = new RedshiftClient();
    const tableName = 'mock_table';
    const schema = 'public';

    const SQL = escape(`SELECT
columns.column_name,
columns.data_type,
columns.column_default,
CASE
    WHEN columns.is_nullable = 'YES' THEN true
    WHEN columns.is_nullable = 'NO' THEN false
END as is_nullable,
columns.character_maximum_length
FROM
    information_schema.columns AS columns
WHERE
    columns.table_schema = %L
    AND columns.table_name = %L
ORDER BY ordinal_position;`, schema, tableName);

    const queryResult = {
        "command": "SELECT",
        "rowCount": null,
        "oid": null,
        "rows": [
            {
                "column_name": "text_column",
                "data_type": "character varying",
                "column_default": null,
                "is_nullable": true,
                "character_maximum_length": 50
            }
        ]
    };

    let result = {};
    beforeEach((done) => {
        result = {};
        clearMocks();
        query.mockReturnValueOnce(Promise.resolve(queryResult));
        redshift.getTableDdl(redshiftClient, tableName, schema)
            .then(data => {
                result.data = data;
                done();
            })
            .catch(err => {
                result.err = err;
                done.fail(err);
            });
    });

    it('executes a SQL', () => {
        expect(query).toBeCalledWith(SQL);
    });

    it('returns error record', () => {
        expect(result.data).toEqual(queryResult.rows);
    });
});
