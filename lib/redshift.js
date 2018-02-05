'use strict';

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

/**
 * currently used by the copy activity, it is not the narrowest query, but given the timestamp comparison and the ephemeral nature of the task at hand, it suffices for this slice
 * @param redshiftClient
 * @param sessionid
 * @param timestamp
 * @returns {Promise.<void>}
 */
let getSTLLoadErrors = (() => {
    var _ref = (0, _asyncToGenerator3.default)(function* (redshiftClient, sessionid, timestamp) {
        const redshiftTimestampFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
        const starttime = datetimeProvider.parseTimestamp(timestamp).format(redshiftTimestampFormat);

        const stlLoadErrorSQL = escape(`SELECT
session AS sessionid,
query   AS "queryid",
*
FROM stl_load_errors
WHERE
session = %s
AND TIMESTAMP_CMP(starttime, %L) > 0`, sessionid, starttime);

        const results = yield redshiftClient.execute(stlLoadErrorSQL);
        return trim(results.rows);
    });

    return function getSTLLoadErrors(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
})();

/**
 * Better version for getting load error, narrowed down by the queryid and timestamp
 * @param redshiftClient
 * @param sessionid
 * @param queryid
 * @param timestamp
 * @returns {Promise.<void>}
 */


let getSTLLoadError = (() => {
    var _ref2 = (0, _asyncToGenerator3.default)(function* (redshiftClient, sessionid, queryid, timestamp) {
        const redshiftTimestampFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
        const starttime = datetimeProvider.parseTimestamp(timestamp).format(redshiftTimestampFormat);

        const stlLoadErrorSQL = escape(`SELECT
session AS sessionid,
query AS "queryid",
*
FROM stl_load_errors
WHERE
session = %s
AND query = %s
AND TIMESTAMP_CMP(starttime, %L) > 0`, sessionid, queryid, starttime);

        const results = yield redshiftClient.execute(stlLoadErrorSQL);
        return trim(results.rows.slice(0, 1));
    });

    return function getSTLLoadError(_x4, _x5, _x6, _x7) {
        return _ref2.apply(this, arguments);
    };
})();

let getCurrentSessionId = (() => {
    var _ref3 = (0, _asyncToGenerator3.default)(function* (redshiftClient) {
        const currentSessionSQL = 'SELECT pg_backend_pid();';
        return jp.value((yield redshiftClient.execute(currentSessionSQL)), '$.rows[0].pg_backend_pid');
    });

    return function getCurrentSessionId(_x8) {
        return _ref3.apply(this, arguments);
    };
})();

let getSessionById = (() => {
    var _ref4 = (0, _asyncToGenerator3.default)(function* (redshiftClient, sessionid) {
        const getSessionSQL = escape(`SELECT * 
    FROM stv_sessions
    where process = %s;`, sessionid);
        return trim(jp.value((yield redshiftClient.execute(getSessionSQL)), '$.rows'));
    });

    return function getSessionById(_x9, _x10) {
        return _ref4.apply(this, arguments);
    };
})();

let getQueries = (() => {
    var _ref5 = (0, _asyncToGenerator3.default)(function* (database, username, redshiftClient, sessionid) {
        const sessionQueriesSQL = escape(`SELECT
pid AS sessionid, query AS "queryid", *
FROM stl_query
WHERE
pid = %s
AND database = %L;`, sessionid, database);
        return trim(jp.value((yield redshiftClient.execute(sessionQueriesSQL)), '$.rows'));
    });

    return function getQueries(_x11, _x12, _x13, _x14) {
        return _ref5.apply(this, arguments);
    };
})();

let getActiveQueries = (() => {
    var _ref6 = (0, _asyncToGenerator3.default)(function* (database, username, redshiftClient, sessionid) {

        /**
         * NOTE:
         * - STV_RECENTS holds `active` queries, which involves `pending` and `in-flight` and `recently-done`
         * - recently-done == Success or Error
         * - PG SELECT AS aliases do not respect Case, and always return lowercase column names
         * - When a query completes, its PID is set to `-1` in STV_RECENTS
         * - if a query has errored, and the query was a COPY command, errors can be found in STL_LOAD_ERRORS
         */

        const activeQueriesSQL = escape(`SELECT
sq.pid       AS sessionid,
sq.query     AS "queryid",
sr.status,
sr.duration,
sq.starttime,
sq.endtime,
sq.aborted,
sr.user_name AS username,
sq.querytxt,
sq.database
FROM
stv_recents sr, stl_query sq
WHERE
sr.pid = sq.pid AND
sr.pid = %s AND
sr.user_name = %L AND
sq.database = %L AND
SUBSTRING(sr.query, 0, 600) = SUBSTRING(sq.querytxt, 0, 600);`, sessionid, username, database);
        return trim(jp.value((yield redshiftClient.execute(activeQueriesSQL)), '$.rows'));
    });

    return function getActiveQueries(_x15, _x16, _x17, _x18) {
        return _ref6.apply(this, arguments);
    };
})();

/**
 * @param sessionid in Redshift terms, this is a connection, session, process, pid or procpid, among other aliases
 * @returns {Promise.<void>}
 */


let killSession = (() => {
    var _ref7 = (0, _asyncToGenerator3.default)(function* (database, username, redshiftClient, sessionid) {
        const killSessionSQL = escape(`SELECT pg_terminate_backend(procpid)
FROM pg_stat_activity
WHERE datname = %L
AND procpid = %s
AND usename = %L
AND procpid <> pg_backend_pid();`, database, sessionid, username);
        let killed = false;
        try {
            const result = yield redshiftClient.execute(killSessionSQL);
            killed = !!jp.value(result, '$.rows[0].pg_terminate_backend');
        } catch (error) {
            if (error.code === '22023') {
                logger.log(`sessionid [${sessionid}] is in a "Terminating" state`);
                killed = true;
            } else {
                throw error;
            }
        }
        return killed;
    });

    return function killSession(_x19, _x20, _x21, _x22) {
        return _ref7.apply(this, arguments);
    };
})();

let cancelQuery = (() => {
    var _ref8 = (0, _asyncToGenerator3.default)(function* (redshiftClient, sessionid) {
        // DataGrip console shows `[57014] ERROR: Query (2429893) cancelled on user's request`
        // Does the execute method reject with that error, or resolve with it ... @TODO: check in integrated test
        const cancelQuerySQL = escape(`CANCEL %s`, sessionid);
        return redshiftClient.execute(cancelQuerySQL);
    });

    return function cancelQuery(_x23, _x24) {
        return _ref8.apply(this, arguments);
    };
})();

let getTableDdl = (() => {
    var _ref9 = (0, _asyncToGenerator3.default)(function* (redshiftClient, tableName, schema = 'public') {
        const getTableDdlSQL = escape(`SELECT
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

        const { rows } = yield redshiftClient.query(getTableDdlSQL);
        return rows;
    });

    return function getTableDdl(_x25, _x26) {
        return _ref9.apply(this, arguments);
    };
})();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const escape = require('pg-escape');
const _ = require('lodash');
const jp = require('jsonpath');

const logger = require('./logger');
const datetimeProvider = require('./datetime-provider');

module.exports = {
    getSTLLoadError,
    getSTLLoadErrors,
    getCurrentSessionId,
    getSessionById,
    getActiveQueries,
    killSession,
    // cancelQuery,
    isLoadError,
    getQueries,
    getTableDdl
};

const trim = rows => rows.map(row => _.reduce(row, (acc, value, key) => {
    acc[key] = _.isString(value) ? value.trim() : value;
    return acc;
}, {}));

function isLoadError(error) {
    const loadErrorRegex = /^Load into table.*/;
    const loadRoutine = 'DoCopy';
    return loadErrorRegex.test(error.message) && error.routine === loadRoutine;
}