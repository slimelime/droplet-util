/* eslint-disable no-loop-func */
jest.disableAutomock();

const Rx = require('rxjs');
const MemoryStream = require('memorystream');

const streams = require('../streams');
const throttler = require('./stream');
const rxjs = require('../rxjs');

const HEADERS = ['INDEX', 'HEADER1', 'HEADER2', 'HEADER3'];

function* generateLines({headers = HEADERS, fields = headers, n = 1, index = true, quote = ''} = {}) {
    let counter = 0;
    yield headers.map(header => `${quote}${header}${quote}`);
    const quotedFields = fields.map(field => `${quote}${field}-${counter}${quote}`);
    do {
        counter++;
        const row = index ? [counter, ...fields.slice(1).map(field => `${quote}${field}-${counter}${quote}`)] : quotedFields;
        yield row;
    } while (counter < n);
}

describe('throttlingStream', () => {
    const expectedRecordsTotal = 1000;
    let CSV_TEXT;
    const delimiter = '\n';
    let csvTransformStream;

    const toleranceFactor = 0;
    const allowedTime = expectedRecordsTotal * (1 + toleranceFactor);

    beforeEach(() => {
        CSV_TEXT = `${[...generateLines({n: expectedRecordsTotal, quote: '"'})].join('\n')}\n`;

        csvTransformStream = streams.csvParserTransformStream(
            {
                columns: true,
                delimiter: ',',
                quote: null,
                trim: true
            });

        // console.log(records);
    });

    it('when allowed time is sufficient, streams all records through', done => {
        const textReadStream = MemoryStream.createReadStream(CSV_TEXT);
        const recordWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});

        const timeout$ = rxjs.timeoutWith$(allowedTime, () => new Error('Timeout before streaming all records'));
        const completed$ = new Rx.BehaviorSubject();
        timeout$.subscribe(() => {}, error => completed$.error(error));

        completed$.subscribe(() => {}, error => {
            done.fail(error);
        }, () => {
            expect(recordWriteStream.queue.length).toEqual(expectedRecordsTotal);
            done();
        });

        textReadStream
            .pipe(streams.lineStream({delimiter, trimDelimiter: false, header: true}))
            .on('error', error => done.fail(error))
            .pipe(csvTransformStream)
            .on('error', error => done.fail(error))
            .pipe(throttler.throttlingStream())
            .on('error', error => done.fail(error))
            .pipe(recordWriteStream)
            .on('error', error => done.fail(error))
            .on('finish', async () => {
                completed$.complete();
            });
    });

    it('when allowed time is not sufficient, streams range of records through', done => {
        const textReadStream = MemoryStream.createReadStream(CSV_TEXT);
        const recordWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});

        const fraction = 0.1;
        const timeout$ = rxjs.timeoutWith$(allowedTime * fraction, () => new Error('Timeout before streaming all records')); // allowedTime in ms = expectedRecordTotal = 1000
        const rate = 10;
        const interval = 'second';

        const completed$ = new Rx.BehaviorSubject();
        timeout$.subscribe(() => {}, error => completed$.error(error));

        completed$.subscribe(() => {}, () => {
            expect(recordWriteStream.queue.length).toBeLessThanOrEqual(rate);
            done();
        }, () => {
            // expect(recordWriteStream.queue.length).toBeLessThanOrEqual(rate);
            done.fail('should not complete streaming all records');
        });

        textReadStream
            .pipe(streams.lineStream({delimiter, trimDelimiter: false, header: true}))
            .on('error', error => done.fail(error))
            .pipe(csvTransformStream)
            .on('error', error => done.fail(error))
            .pipe(throttler.throttlingStream({rate, interval}))
            // .on('data', () => console.log('------------------- LINE --------------------'))
            .on('error', error => done.fail(error))
            .pipe(recordWriteStream)
            .on('error', error => done.fail(error))
            .on('finish', async () => {
                completed$.complete();
            });
    });
});
