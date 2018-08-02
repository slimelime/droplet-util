jest.disableAutomock();
jest.mock('./aws/sns');
jest.mock('./logger');

const MemoryStream = require('memorystream');
const fs = require('fs');
const _ = require('lodash');

const sns = require('./aws/sns');
const logger = require('./logger');
const streams = require('./streams');

const HEADERS = ['"HEADER1"', 'HEADER2', '"HEADER3"'];
const LINES = [
    ['"01VALUE1"', '01VALUE2', 1],
    ['02VALUE1', 2, '02VALUE3'],
    [3, '03VALUE2', '"03VALUE3"'],
    ['"04VALUE1"', '04VALUE2', 4],
    ['05VALUE1', 5, '05VALUE3'],
    [6, '06VALUE2', '"06VALUE3"']
];

function* content(headers, ...lines) {
    yield headers.join(',');
    yield* lines.map(line => line.join(','));
}

const CSV_FULL_TEXT = [...content(HEADERS, ...LINES)].join('\n');

const CSV_BODY = [...content(HEADERS, ...LINES)].slice(1).join('\n');

const expectedObjects = [
    {HEADER1: '01VALUE1', HEADER2: '01VALUE2', HEADER3: '1'},
    {HEADER1: '02VALUE1', HEADER2: '2', HEADER3: '02VALUE3'},
    {HEADER1: '3', HEADER2: '03VALUE2', HEADER3: '03VALUE3'},
    {HEADER1: '04VALUE1', HEADER2: '04VALUE2', HEADER3: '4'},
    {HEADER1: '05VALUE1', HEADER2: '5', HEADER3: '05VALUE3'},
    {HEADER1: '6', HEADER2: '06VALUE2', HEADER3: '06VALUE3'}
];

function unquote(value) {
    return String(value).replace(/"/g, '');
}

function* generateLines(fields, n = 1, index = true, join = true) {
    let counter = 0;
    do {
        counter++;
        const row = index ? [counter, ...fields] : fields;
        yield join ? row.join(',') : row;
    } while (counter < n);
}

describe('csvParserTransformStream', () => {
    describe('when reading from csv read stream', () => {

        describe('and headers are auto-detected {columns: true}', () => {
            let csvReadStream;
            let objectWriteStream;
            beforeEach(() => {
                csvReadStream = MemoryStream.createReadStream(CSV_FULL_TEXT);
                objectWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
            });

            it('it emits objects with headers as keys and `string` values', (done) => {
                csvReadStream
                    .pipe(streams.csvParserTransformStream({columns: true, quote: '"'}))
                    .pipe(objectWriteStream)
                    .on('finish', () => {
                        expect(objectWriteStream.queue).toEqual(expectedObjects);
                        done();
                    });
            });
        });

        describe('and headers are auto-detected {columns: null}', () => {
            let csvReadStream;
            let objectWriteStream;
            beforeEach(() => {
                csvReadStream = MemoryStream.createReadStream(CSV_FULL_TEXT);
                objectWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
            });

            it('it emits arrays of `string` values', (done) => {
                csvReadStream
                    .pipe(streams.csvParserTransformStream({columns: null, quote: '"'}))
                    .pipe(objectWriteStream)
                    .on('finish', () => {
                        expect(objectWriteStream.queue[0]).toEqual(HEADERS.map(unquote));
                        expect(objectWriteStream.queue[1]).toEqual(LINES[0].map(unquote));
                        expect(objectWriteStream.queue[2]).toEqual(LINES[1].map(unquote));
                        expect(objectWriteStream.queue[3]).toEqual(LINES[2].map(unquote));
                        expect(objectWriteStream.queue[4]).toEqual(LINES[3].map(unquote));
                        expect(objectWriteStream.queue[5]).toEqual(LINES[4].map(unquote));
                        expect(objectWriteStream.queue[6]).toEqual(LINES[5].map(unquote));
                        done();
                    });
            });
        });

        describe('and headers are not in text but are provided {columns: [headers]}', () => {
            let csvReadStream;
            let objectWriteStream;
            beforeEach(() => {
                csvReadStream = MemoryStream.createReadStream(CSV_BODY);
                objectWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
            });

            it('it emits objects with headers as keys and `string` values', (done) => {
                csvReadStream
                    .pipe(streams.csvParserTransformStream({columns: HEADERS.map(unquote), quote: '"'}))
                    .pipe(objectWriteStream)
                    .on('finish', () => {
                        expect(objectWriteStream.queue).toEqual(expectedObjects);
                        done();
                    });
            });
        });
    });
});

describe('objectTransformStream', () => {
    describe('when used as a pass through object stream', () => {
        let objectSourceStream;
        let objectWriteStream;
        beforeEach(() => {
            objectSourceStream = MemoryStream.createReadStream(CSV_FULL_TEXT)
                .pipe(streams.csvParserTransformStream({columns: true, quote: '"'}));
            objectWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
        });

        it('passes objects through', (done) => {
            objectSourceStream
                .pipe(streams.objectTransformStream())
                .pipe(objectWriteStream)
                .on('finish', () => {
                    expect(objectWriteStream.queue).toEqual(expectedObjects);
                    done();
                });
        });
    });

    describe('when used as an object transform stream', () => {
        let objectSourceStream;
        let objectWriteStream;
        const encodeKeys = (obj) => {
            return Object.keys(obj)
                .reduce((acc, key) => {
                    acc[`__${key}__`] = obj[key];
                    return acc;
                }, {});
        };

        const transformFn = (obj, enc, callback) => {
            callback(null, encodeKeys(obj));
        };

        beforeEach(() => {
            objectSourceStream = MemoryStream.createReadStream(CSV_FULL_TEXT)
                .pipe(streams.csvParserTransformStream({columns: true, quote: '"'}));
            objectWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
        });

        it('applies transform function to objects', (done) => {
            objectSourceStream
                .pipe(streams.objectTransformStream(transformFn))
                .pipe(objectWriteStream)
                .on('finish', () => {
                    expect(objectWriteStream.queue).toEqual(expectedObjects.map(obj => encodeKeys(obj)));
                    done();
                });
        });
    });

    describe('when used as pass through array (objects) stream', () => {
        let objectSourceStream;
        let objectWriteStream;
        beforeEach(() => {
            objectSourceStream = MemoryStream.createReadStream(CSV_FULL_TEXT)
                .pipe(streams.csvParserTransformStream({columns: null, quote: '"'}));
            objectWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
        });

        it('passes arrays through', (done) => {
            objectSourceStream
                .pipe(streams.objectTransformStream())
                .pipe(objectWriteStream)
                .on('finish', () => {
                    expect(objectWriteStream.queue[0]).toEqual(HEADERS.map(unquote));
                    expect(objectWriteStream.queue[1]).toEqual(LINES[0].map(unquote));
                    expect(objectWriteStream.queue[2]).toEqual(LINES[1].map(unquote));
                    expect(objectWriteStream.queue[3]).toEqual(LINES[2].map(unquote));
                    expect(objectWriteStream.queue[4]).toEqual(LINES[3].map(unquote));
                    expect(objectWriteStream.queue[5]).toEqual(LINES[4].map(unquote));
                    expect(objectWriteStream.queue[6]).toEqual(LINES[5].map(unquote));
                    done();
                });
        });
    });
});

describe('snsWriteStream', () => {
    // Transform stream is either drained via registering on('data'), piping into another stream, or end need to be called explicitly

    describe('when passing objects through the stream', () => {
        describe('and SNS publish succeeds', () => {
            let objectSourceStream;
            let objectWriteStream;
            const topicArn = 'MOCK_TOPIC_ARN';
            const subject = 'MOCK_SUBJECT';

            beforeEach(() => {
                objectSourceStream = MemoryStream.createReadStream(CSV_FULL_TEXT)
                    .pipe(streams.csvParserTransformStream({columns: true, quote: '"'}));
                objectWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});

                logger.error.mockClear();
                sns.publish.mockClear();
            });

            it('emits `end` event when done', (done) => {

                // What is the difference between end and fi?

                objectSourceStream
                    .pipe(streams.snsWriteStream(topicArn, subject))
                    .resume() // The readable.resume() method can be used to fully consume the data from a stream without actually processing any of that data
                    .on('end', () => {
                        expect(sns.publish.mock.calls.length).toEqual(expectedObjects.length);
                        expect(sns.publish.mock.calls).toEqual(expectedObjects.map(obj => [topicArn, subject, obj, {}, {}]));
                        expect(logger.error).not.toBeCalled();
                        done();
                    })
                    .on('error', (error) => {
                        done.fail(error);
                    });
            });


            it('publishes all objects upstream', (done) => {
                objectSourceStream
                    .pipe(streams.snsWriteStream(topicArn, subject))
                    .pipe(objectWriteStream)
                    .on('finish', () => {
                        expect(sns.publish.mock.calls.length).toEqual(expectedObjects.length);
                        expect(sns.publish.mock.calls).toEqual(expectedObjects.map(obj => [topicArn, subject, obj, {}, {}]));
                        expect(logger.error).not.toBeCalled();
                        done();
                    })
                    .on('error', (error) => {
                        done.fail(error);
                    });
            });

        });
        describe('and SNS publish fails halfway', () => {
            let objectSourceStream;
            let objectWriteStream;
            const topicArn = 'MOCK_TOPIC_ARN';
            const subject = 'MOCK_SUBJECT';
            const REJECTION_MESSAGE = 'SNS ERROR';

            beforeEach(() => {
                objectSourceStream = MemoryStream.createReadStream(CSV_FULL_TEXT)
                    .pipe(streams.csvParserTransformStream({columns: true, quote: '"'}));
                objectWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});

                logger.error.mockClear();
                sns.publish.mockClear();
                sns.publish
                    .mockImplementationOnce(() => Promise.resolve({MessageId: 'MOCK_MessageId'}))
                    .mockImplementationOnce(() => Promise.resolve({MessageId: 'MOCK_MessageId'}))
                    .mockImplementationOnce(() => Promise.reject(REJECTION_MESSAGE));
            });

            it('emits `delivery-stream-error` event upstream', (done) => {
                // Note that pipe doesn't propagate errors upstream, can't have a catch all handler at the end of the pipeline
                objectSourceStream
                    .pipe(streams.snsWriteStream(topicArn, subject))
                    .on('delivery-stream-error', (error) => {
                        expect(error).toEqual(REJECTION_MESSAGE);
                        done();
                    });
            });

            it('emits `end` event upstream', (done) => {
                objectSourceStream
                    .pipe(streams.snsWriteStream(topicArn, subject))
                    .on('end', () => {
                        expect(sns.publish.mock.calls.length).toEqual(3);
                        expect(sns.publish.mock.calls).toEqual(expectedObjects.slice(0, 3).map(obj => [topicArn, subject, obj, {}, {}]));
                        expect(logger.error).toBeCalledWith(REJECTION_MESSAGE);
                        done();
                    });
            });

            it('aborts the rest of the stream', (done) => {
                objectSourceStream
                    .pipe(streams.snsWriteStream(topicArn, subject))
                    .pipe(objectWriteStream)
                    .on('finish', () => {
                        expect(objectWriteStream.queue.length).toEqual(2);
                        expect(objectWriteStream.queue).toEqual(expectedObjects.slice(0, 2));
                        expect(logger.error).toBeCalledWith(REJECTION_MESSAGE);
                        done();
                    });
            });
        });
    });
});

describe('lineStream', () => {
    const HEADER_FIELDS = ['index', 'header-1', 'header-2', 'header-3'];
    const LINE_FIELDS = ['field-1', 'field-2', 'field-3'];
    const CSV_LINES = [HEADER_FIELDS.join(','), ...generateLines(LINE_FIELDS, 100)];
    const CSV_TEXT = `${CSV_LINES.join('\n')}\n`;

    describe('when reading from csv read stream', () => {
        describe('and `take` limit is not set', () => {
            let textReadStream;
            let targetWriteStream;
            const delimiter = '\n';
            beforeEach(() => {
                textReadStream = MemoryStream.createReadStream(CSV_TEXT);
                targetWriteStream = MemoryStream.createWriteStream();
            });

            it('it emits lines', (done) => {
                textReadStream
                    .pipe(streams.lineStream({delimiter}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES);
                        done();
                    });
            });
        });

        describe('and `take` limit is set', () => {
            let textReadStream;
            let targetWriteStream;
            const delimiter = '\n';
            beforeEach(() => {
                textReadStream = MemoryStream.createReadStream(CSV_TEXT);
                targetWriteStream = MemoryStream.createWriteStream();
            });

            it('take < total, it emits <take> lines', (done) => {
                const take = 1;
                textReadStream
                    .pipe(streams.lineStream({take, delimiter}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES.slice(0, take));
                        done();
                    });
            });

            it('take = total, it emits <total> lines', (done) => {
                const take = CSV_LINES.length;
                textReadStream
                    .pipe(streams.lineStream({take, delimiter}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES);
                        done();
                    });
            });

            it('take > total, it emits <total> lines', (done) => {
                const take = CSV_LINES.length + 10;
                textReadStream
                    .pipe(streams.lineStream({take, delimiter}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES);
                        done();
                    });
            });
        });

        describe('and both `skip` and `take` are set', () => {
            let textReadStream;
            let targetWriteStream;
            const delimiter = '\n';
            beforeEach(() => {
                textReadStream = MemoryStream.createReadStream(CSV_TEXT);
                targetWriteStream = MemoryStream.createWriteStream();
            });

            it('take < total, it emits <take> lines starting at #<skip + 1>', (done) => {
                const total = CSV_LINES.length;
                const skip = Math.floor(Math.random() * total);
                const take = Math.floor(Math.random() * (total - skip)) + 1;
                textReadStream
                    .pipe(streams.lineStream({skip, take, delimiter}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES.slice(skip, skip + take));
                        done();
                    });
            });

            it('take < total, and header line is included, it emits headers + <take> lines starting at #<skip + 1>', (done) => {
                const total = CSV_LINES.length;
                const skip = Math.floor(Math.random() * total);
                const take = Math.floor(Math.random() * (total - skip)) + 1;
                textReadStream
                    .pipe(streams.lineStream({skip, take, delimiter, header: true}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual([HEADER_FIELDS.join(','), ...CSV_LINES.slice(skip + 1, skip + take + 1)]);
                        done();
                    });
            });

            it('take = total, it emits <total - skip> lines starting at #<skip + 1>', (done) => {
                const total = CSV_LINES.length;
                const skip = Math.floor(Math.random() * total);
                const take = total;
                textReadStream
                    .pipe(streams.lineStream({skip, take, delimiter}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES.slice(-(total - skip)));
                        done();
                    });
            });

            it('skip >= total, it emits <0> lines', (done) => {
                const skip = CSV_LINES.length + 10;
                const take = CSV_LINES.length;
                textReadStream
                    .pipe(streams.lineStream({skip, take, delimiter}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual([]);
                        done();
                    });
            });

            it('skip >= total, and header = true, it emits header line', (done) => {
                const skip = CSV_LINES.length + 10;
                const take = CSV_LINES.length;
                textReadStream
                    .pipe(streams.lineStream({skip, take, delimiter, header: true}))
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual([HEADER_FIELDS.join(',')]);
                        done();
                    });
            });
        });

    });
});

describe('lineStreamWithByteRange', () => {
    const HEADER_FIELDS = ['index', 'header-1', 'header-2', 'header-3'];
    const LINE_FIELDS = ['I HEART JS', 'I ♥ JS', 'I ♥ JS ☺'];
    const CSV_LINES = [HEADER_FIELDS.join(','), ...generateLines(LINE_FIELDS, 100, true)];
    const CSV_TEXT = `${CSV_LINES.join('\n')}\n`;

    describe('when reading from csv read stream', () => {
        describe('and `take` limit is not set', () => {
            let textReadStream;
            let targetWriteStream;
            const delimiter = '\n';

            beforeEach(() => {
                textReadStream = MemoryStream.createReadStream(CSV_TEXT);
                targetWriteStream = MemoryStream.createWriteStream();
            });

            it('it emits lines', (done) => {
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES);
                        done();
                    });
            });

            it('keeps a counter of all `seen` lines', (done) => {
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(lineStreamWithByteRange.counter).toEqual(CSV_LINES.length);
                        done();
                    });
            });

            it('keeps lineRanges information for all `seen` lines', (done) => {
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(CSV_LINES.length);
                        done();
                    });
            });
        });

        describe('and `take` limit is set', () => {
            let textReadStream;
            let targetWriteStream;
            const delimiter = '\n';
            let lineStreamWithByteRange;
            beforeEach(() => {
                textReadStream = MemoryStream.createReadStream(CSV_TEXT);
                targetWriteStream = MemoryStream.createWriteStream();
            });

            it('take < total, it emits <take> lines', (done) => {
                const take = 10;
                lineStreamWithByteRange = streams.lineStreamWithByteRange({take, delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES.slice(0, take));
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(CSV_LINES.slice(0, take).length);
                        done();
                    });
            });

            it('take = total, it emits <total> lines', (done) => {
                const take = CSV_LINES.length;
                lineStreamWithByteRange = streams.lineStreamWithByteRange({take, delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES);
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(CSV_LINES.length);
                        done();
                    });
            });

            it('take > total, it emits <total> lines', (done) => {
                const take = CSV_LINES.length + 10;
                lineStreamWithByteRange = streams.lineStreamWithByteRange({take, delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES);
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(CSV_LINES.length);
                        done();
                    });
            });
        });

        describe('and both `skip` and `take` are set', () => {
            let textReadStream;
            let targetWriteStream;
            const delimiter = '\n';
            beforeEach(() => {
                textReadStream = MemoryStream.createReadStream(CSV_TEXT);
                targetWriteStream = MemoryStream.createWriteStream();
            });

            it('take < total, it emits <take> lines starting at #<skip + 1>', (done) => {
                const total = CSV_LINES.length;
                const skip = Math.floor(Math.random() * total);
                const take = Math.floor(Math.random() * (total - skip)) + 1;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES.slice(skip, skip + take));
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(skip + take);
                        done();
                    });
            });

            it.skip('take < total, and header line is included, it emits headers + <take> lines starting at #<skip + 1>', (done) => {
                const total = CSV_LINES.length;
                const skip = Math.floor(Math.random() * total);
                const take = Math.floor(Math.random() * (total - skip)) + 1;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter, header: true});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual([HEADER_FIELDS.join(','), ...CSV_LINES.slice(skip + 1, skip + take + 1)]);
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(skip + take + 1); // +1 for the header
                        done();
                    });
            });

            it('take = total, it emits <total - skip> lines starting at #<skip + 1>', (done) => {
                const total = CSV_LINES.length;
                const skip = Math.floor(Math.random() * total);
                const take = total;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual(CSV_LINES.slice(-(total - skip)));
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(total);
                        done();
                    });
            });

            it('skip >= total, it emits <0> lines', (done) => {
                const skip = CSV_LINES.length + 10;
                const take = CSV_LINES.length;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual([]);
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(CSV_LINES.length);
                        done();
                    });
            });

            it('skip >= total, and header = true, it emits header line', (done) => {
                const skip = CSV_LINES.length + 10;
                const take = CSV_LINES.length;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter, header: true});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        expect(targetWriteStream.queue.map(buffer => buffer.toString())).toEqual([HEADER_FIELDS.join(',')]);
                        expect(lineStreamWithByteRange.lineRanges.ranges.slice(-1)[0].lineNumber).toEqual(CSV_LINES.length);
                        done();
                    });
            });
        });

    });

    describe('when reading from a file starting at a specific byte range', () => {
        describe('and both `skip` and `take` are set', () => {
            let textReadStream;
            let targetWriteStream;
            const delimiter = '\n';
            const MOCK_FILE = './MOCK_LINES_DATA.txt';

            beforeAll(() => {
                fs.writeFileSync(MOCK_FILE, CSV_TEXT, {encoding: 'utf8'});
            });

            afterAll(() => {
                fs.unlinkSync(MOCK_FILE);
            });

            beforeEach(() => {
                textReadStream = MemoryStream.createReadStream(CSV_TEXT);
                targetWriteStream = MemoryStream.createWriteStream();
            });

            it('get the first line', (done) => {
                const total = CSV_LINES.length;
                const skip = 0;
                const take = -1;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter, header: true});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        const testLineNumber = 2;
                        const {lineNumber, byteRangeStart, byteRangeEnd} = lineStreamWithByteRange.lineRanges.start(testLineNumber);
                        const fileReadStream = fs.createReadStream(MOCK_FILE, {defaultEncoding: 'utf8', start: byteRangeStart, end: byteRangeEnd});

                        const fileWriteStream = MemoryStream.createWriteStream();
                        fileReadStream
                            .pipe(streams.lineStream())
                            .pipe(fileWriteStream)
                            .on('finish', () => {
                                expect(fileWriteStream.queue.map(buffer => buffer.toString())[0])
                                    .toEqual(CSV_LINES[testLineNumber - 1]);
                                done();
                            });
                    });
            });

            it('get the last line', (done) => {
                const total = CSV_LINES.length;
                const skip = 0;
                const take = -1;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter, header: true});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        const testLineNumber = total;
                        const {lineNumber, byteRangeStart, byteRangeEnd} = lineStreamWithByteRange.lineRanges.start(testLineNumber);
                        const fileReadStream = fs.createReadStream(MOCK_FILE, {defaultEncoding: 'utf8', start: byteRangeStart, end: byteRangeEnd});

                        const fileWriteStream = MemoryStream.createWriteStream();
                        fileReadStream
                            .pipe(streams.lineStream())
                            .pipe(fileWriteStream)
                            .on('finish', () => {
                                expect(fileWriteStream.queue.map(buffer => buffer.toString())[0])
                                    .toEqual(CSV_LINES[testLineNumber - 1]);
                                done();
                            });
                    });
            });

            it('get a correct byte range for a random line in ranges', (done) => {
                const total = CSV_LINES.length;
                const skip = 0;
                const take = -1;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter, header: true});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        const testLineNumber = _.random(1, total);
                        const {lineNumber, byteRangeStart, byteRangeEnd} = lineStreamWithByteRange.lineRanges.start(testLineNumber);
                        const fileReadStream = fs.createReadStream(MOCK_FILE, {defaultEncoding: 'utf8', start: byteRangeStart, end: byteRangeEnd});

                        const fileWriteStream = MemoryStream.createWriteStream();
                        fileReadStream
                            .pipe(streams.lineStream())
                            .pipe(fileWriteStream)
                            .on('finish', () => {
                                expect(fileWriteStream.queue.map(buffer => buffer.toString())[0])
                                    .toEqual(CSV_LINES[testLineNumber - 1]);
                                done();
                            });
                    });
            });

            it('when skip is set, get a correct byte range for the first taken line', (done) => {
                const total = CSV_LINES.length;
                const skip = _.random(1, total - 1);
                const take = total - skip;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter, header: true});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        const testLineNumber = skip + 2;
                        const {lineNumber, byteRangeStart, byteRangeEnd} = lineStreamWithByteRange.lineRanges.start(testLineNumber);

                        const fileReadStream = fs.createReadStream(MOCK_FILE, {defaultEncoding: 'utf8', start: byteRangeStart, end: byteRangeEnd});
                        const fileWriteStream = MemoryStream.createWriteStream();
                        fileReadStream
                            .pipe(streams.lineStream())
                            .pipe(fileWriteStream)
                            .on('finish', () => {
                                expect(fileWriteStream.queue.map(buffer => buffer.toString())[0])
                                    .toEqual(CSV_LINES[testLineNumber - 1]);
                                done();
                            });
                    });
            });

            it('when skip is set, get a correct byte range for the last taken line', (done) => {
                const total = CSV_LINES.length;
                const skip = _.random(1, total - 1);
                const take = total - skip;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter, header: true});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        const testLineNumber = total - 1;
                        const {lineNumber, byteRangeStart, byteRangeEnd} = lineStreamWithByteRange.lineRanges.start(testLineNumber);

                        const fileReadStream = fs.createReadStream(MOCK_FILE, {defaultEncoding: 'utf8', start: byteRangeStart, end: byteRangeEnd});
                        const fileWriteStream = MemoryStream.createWriteStream();
                        fileReadStream
                            .pipe(streams.lineStream())
                            .pipe(fileWriteStream)
                            .on('finish', () => {
                                expect(fileWriteStream.queue.map(buffer => buffer.toString())[0])
                                    .toEqual(CSV_LINES[testLineNumber - 1]);
                                done();
                            });
                    });
            });

            it('when skip is set, get a correct byte range for line in between', (done) => {
                const total = CSV_LINES.length;
                const skip = _.random(1, total - 1);
                const take = total - skip;
                const lineStreamWithByteRange = streams.lineStreamWithByteRange({skip, take, delimiter, header: true});
                textReadStream
                    .pipe(lineStreamWithByteRange)
                    .pipe(targetWriteStream)
                    .on('finish', () => {
                        const testLineNumber = _.random(skip + 2, total - 1);
                        const {lineNumber, byteRangeStart, byteRangeEnd} = lineStreamWithByteRange.lineRanges.start(testLineNumber);

                        const fileReadStream = fs.createReadStream(MOCK_FILE, {defaultEncoding: 'utf8', start: byteRangeStart, end: byteRangeEnd});
                        const fileWriteStream = MemoryStream.createWriteStream();
                        fileReadStream
                            .pipe(streams.lineStream())
                            .pipe(fileWriteStream)
                            .on('finish', () => {
                                expect(fileWriteStream.queue.map(buffer => buffer.toString())[0])
                                    .toEqual(CSV_LINES[testLineNumber - 1]);
                                done();
                            });
                    });
            });

        });
    });
});

