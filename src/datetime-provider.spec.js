jest.unmock('./datetime-provider');
jest.mock('moment');

const datetimeProvider = require('./datetime-provider');
const moment = require('moment');

const momentMock = {};
const momentFn = jest.fn(() => momentMock);
moment.mockImplementation(momentFn);

const utcFn = jest.fn(() => momentMock);
const formatFn = jest.fn(() => momentMock);
const toDateFn = jest.fn();
momentMock.utc = utcFn;
momentMock.format = formatFn;
momentMock.toDate = toDateFn;

beforeEach(() => {
    momentFn.mockClear();
    utcFn.mockClear();
    formatFn.mockClear();
    toDateFn.mockClear();
});

describe('getDateString', () => {

    it('should return an ISO-like string', () => {
        // No easy way to mock "new Date"
        const timestamp = datetimeProvider.getDateString();
        expect(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/.test(timestamp)).toBe(true);
    });

});

describe('getDateAsISOString', () => {

    it('should return an ISO-like string', () => {
        const timestamp = datetimeProvider.getDateAsISOString();
        expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(timestamp)).toBe(true);
    });

});

describe('getBatchTimestamp', () => {

    it('calls moment with defaults', () => {
        const defaultDate = moment();
        const defaultFormat = 'YYYYMMDDTHHmmss';
        datetimeProvider.getBatchTimestamp();
        expect(momentFn).toHaveBeenCalledWith(defaultDate);
        expect(utcFn).toHaveBeenCalled();
        expect(formatFn).toHaveBeenCalledWith(defaultFormat);
    });

    it('calls moment with a defined format', () => {
        const date = new Date();
        const format = 'mock_format';
        datetimeProvider.getBatchTimestamp(date, format);
        expect(momentFn).toHaveBeenCalledWith(date);
        expect(formatFn).toHaveBeenCalledWith(format);
    });

});

describe('parseBatchTimestamp', () => {

    it('delegates to moment', () => {
        const timestamp = 'mock_timestamp';
        const defaultFormat = 'YYYYMMDDTHHmmss';
        datetimeProvider.parseBatchTimestamp(timestamp);
        expect(momentFn).toHaveBeenCalledWith(timestamp, defaultFormat);
    });

    it('delegates to moment, passing format', () => {
        const timestamp = 'mock_timestamp';
        const format = 'mock_format';
        datetimeProvider.parseBatchTimestamp(timestamp, format);
        expect(momentFn).toHaveBeenCalledWith(timestamp, format);
    });

    it('calls toDate if asMoment is false', () => {
        datetimeProvider.parseBatchTimestamp('', '', /* asMoment */ false);
        expect(toDateFn).toHaveBeenCalled();
    });

});

describe('getTimestamp', () => {

    it('calls moment with defaults', () => {
        const defaultDate = moment();
        const defaultFormat = 'YYYYMMDDTHHmmssSSS';
        datetimeProvider.getTimestamp();
        expect(momentFn).toHaveBeenCalledWith(defaultDate);
        expect(utcFn).toHaveBeenCalled();
        expect(formatFn).toHaveBeenCalledWith(defaultFormat);
    });

    it('calls moment with a defined format', () => {
        const date = new Date();
        const format = 'mock_format';
        datetimeProvider.getTimestamp(date, format);
        expect(momentFn).toHaveBeenCalledWith(date);
        expect(formatFn).toHaveBeenCalledWith(format);
    });

});

describe('parseTimestamp', () => {

    it('delegates to moment', () => {
        const timestamp = 'mock_timestamp';
        const defaultFormat = 'YYYYMMDDTHHmmssSSS';
        datetimeProvider.parseTimestamp(timestamp);
        expect(momentFn).toHaveBeenCalledWith(timestamp, defaultFormat);
    });

    it('delegates to moment, passing format', () => {
        const timestamp = 'mock_timestamp';
        const format = 'mock_format';
        datetimeProvider.parseTimestamp(timestamp, format);
        expect(momentFn).toHaveBeenCalledWith(timestamp, format);
    });

    it('calls toDate if asMoment is false', () => {
        datetimeProvider.parseTimestamp('', '', /* asMoment */ false);
        expect(toDateFn).toHaveBeenCalled();
    });

});
