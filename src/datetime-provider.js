'use strict';

const moment = require('moment');

module.exports = { getDateString, getDateAsISOString, getBatchTimestamp, parseBatchTimestamp, getTimestamp, parseTimestamp };

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

function getTimestamp(date = moment(), format = 'YYYYMMDDTHHmmssSSS') {
    return moment(date).utc().format(format);
}

function parseTimestamp(timestamp, format = 'YYYYMMDDTHHmmssSSS', asMoment = true) {
    const momentDate = moment(timestamp, format);
    return asMoment ? momentDate : momentDate.toDate();
}
