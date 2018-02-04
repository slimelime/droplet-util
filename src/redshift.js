'use strict';

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

const trim = rows =>
    rows.map(row =>
        _.reduce(row, (acc, value, key) => {
            acc[key] = _.isString(value) ? value.trim() : value;
            return acc;
        }, {}));

/**
 * currently used by the copy activity, it is not the narrowest query, but given the timestamp comparison and the ephemeral nature of the task at hand, it suffices for this slice
 * @param redshiftClient
 * @param sessionid
 * @param timestamp
 * @returns {Promise.<void>}
 */
async function getSTLLoadErrors(redshiftClient, sessionid, timestamp) {
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

    const results = await redshiftClient.execute(stlLoadErrorSQL);
    return trim(results.rows);
}

/**
 * Better version for getting load error, narrowed down by the queryid and timestamp
 * @param redshiftClient
 * @param sessionid
 * @param queryid
 * @param timestamp
 * @returns {Promise.<void>}
 */
async function getSTLLoadError(redshiftClient, sessionid, queryid, timestamp) {
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

    const results = await redshiftClient.execute(stlLoadErrorSQL);
    return trim(results.rows.slice(0, 1));
}

function isLoadError(error) {
    const loadErrorRegex = /^Load into table.*/;
    const loadRoutine = 'DoCopy';
    return loadErrorRegex.test(error.message) && (error.routine === loadRoutine);
}

async function getCurrentSessionId(redshiftClient) {
    const currentSessionSQL = 'SELECT pg_backend_pid();';
    return jp.value(await redshiftClient.execute(currentSessionSQL), '$.rows[0].pg_backend_pid');
}

async function getSessionById(redshiftClient, sessionid) {
    const getSessionSQL = escape(`SELECT * 
    FROM stv_sessions
    where process = %s;`, sessionid);
    return trim(jp.value(await redshiftClient.execute(getSessionSQL), '$.rows'));
}

async function getQueries(database, username, redshiftClient, sessionid) {
    const sessionQueriesSQL = escape(`SELECT
pid AS sessionid, query AS "queryid", *
FROM stl_query
WHERE
pid = %s
AND database = %L;`, sessionid, database);
    return trim(jp.value(await redshiftClient.execute(sessionQueriesSQL), '$.rows'));
}

async function getActiveQueries(database, username, redshiftClient, sessionid) {

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
    return trim(jp.value(await redshiftClient.execute(activeQueriesSQL), '$.rows'));
}

/**
 * @param sessionid in Redshift terms, this is a connection, session, process, pid or procpid, among other aliases
 * @returns {Promise.<void>}
 */
async function killSession(database,
                           username,
                           redshiftClient,
                           sessionid) {
    const killSessionSQL = escape(`SELECT pg_terminate_backend(procpid)
FROM pg_stat_activity
WHERE datname = %L
AND procpid = %s
AND usename = %L
AND procpid <> pg_backend_pid();`, database, sessionid, username);
    let killed = false;
    try {
        const result = await redshiftClient.execute(killSessionSQL);
        killed = !!(jp.value(result, '$.rows[0].pg_terminate_backend'));
    } catch (error) {
        if (error.code === '22023') {
            logger.log(`sessionid [${sessionid}] is in a "Terminating" state`);
            killed = true;
        } else {
            throw error;
        }
    }
    return killed;
}

async function cancelQuery(redshiftClient, sessionid) {
    // DataGrip console shows `[57014] ERROR: Query (2429893) cancelled on user's request`
    // Does the execute method reject with that error, or resolve with it ... @TODO: check in integrated test
    const cancelQuerySQL = escape(`CANCEL %s`, sessionid);
    return redshiftClient.execute(cancelQuerySQL);
}

async function getTableDdl(redshiftClient, tableName, schema = 'public') {
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

    const {rows} = await redshiftClient.query(getTableDdlSQL);
    return rows;
}
