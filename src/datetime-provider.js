'use strict';

const moment = require('moment');


const nonISO8601CompliantFormatUsedInLegacyCode = 'YYYYMMDDTHHmmssSSS';

function getDateString() {
    return new Date().toISOString().replace(/:/g, '-');
}

function getDateAsISOString() {
    return new Date().toISOString();
}

function getBatchTimestamp(date = moment(), format = 'YYYYMMDDTHHmmss') {
    return moment(date).utc().format(format);
}

function parseBatchTimestamp(timestamp, format = 'YYYYMMDDTHHmmss', asMoment = true) {
    const momentDate = moment(timestamp, format);
    return asMoment ? momentDate : momentDate.toDate();
}

/**
 * @deprecated Use datetimeProvider.getIsoTimestamp instead.
 */
function getTimestamp(date = moment(), format = nonISO8601CompliantFormatUsedInLegacyCode) {
    return moment(date).utc().format(format);
}

/**
 * @deprecated Use new Date(timestamp) instead.
 */
function parseTimestamp(timestamp, format = nonISO8601CompliantFormatUsedInLegacyCode, asMoment = true) {
    const momentDate = moment(timestamp, format);
    return asMoment ? momentDate : momentDate.toDate();
}

const parseLegacyTimestamp = (timestamp) => {
    const formatWithoutMilliseconds = nonISO8601CompliantFormatUsedInLegacyCode.slice(0, -3);
    const compliantFormat = `${formatWithoutMilliseconds}.SSSZ`;
    const timestampWithTimezone = `${timestamp}Z`;

    return moment(timestampWithTimezone, compliantFormat);
};

const getIsoTimestamp = () => {
    return moment()
        .utc()
        .toISOString();
};

module.exports = {
    getDateString,
    getDateAsISOString,
    getBatchTimestamp,
    parseBatchTimestamp,
    getTimestamp,
    parseTimestamp,
    getIsoTimestamp,
    parseLegacyTimestamp
};
