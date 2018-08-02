jest.disableAutomock();
jest.mock('aws-sdk');
jest.mock('./sqs');
jest.mock('../logger');

const AWS = require('aws-sdk');
const sqs = require('./sqs');
const kinesis = require('./kinesis');

const putRecordPromiseFn = jest.fn();
const putRecordFn = jest.fn(() => ({ promise: putRecordPromiseFn }));
const putRecordsPromiseFn = jest.fn();
const putRecordsFn = jest.fn(() => ({ promise: putRecordsPromiseFn }));

AWS.Kinesis = jest.fn(() => ({
    putRecord: putRecordFn,
    putRecords: putRecordsFn
}));

const clearMocks = () => {
    putRecordFn.mockClear();
    putRecordPromiseFn.mockClear();
    putRecordsFn.mockClear();
    putRecordsPromiseFn.mockClear();
    sqs.sendMessage.mockClear();
};

describe('putRecord', () => {
    const streamName = 'stream_name';
    const partitionKey = 'partition_key';
    const record = {
        kinesis: {
            // Encoded: { "payload": "Hello, this is a test 123." }
            data: 'eyAicGF5bG9hZCI6ICJIZWxsbywgdGhpcyBpcyBhIHRlc3QgMTIzLiIgfQ=='
        }
    };

    beforeEach(() => {
        clearMocks();
    });

    it('calls putRecord function', async () => {
        const expectedCalledParameters = {
            Data: JSON.stringify(record),
            PartitionKey: partitionKey,
            StreamName: streamName
        };

        await kinesis.putRecord(streamName, partitionKey, record);
        expect(putRecordFn).toBeCalledWith(expectedCalledParameters);
    });
});

describe('putRecordWithBackupQueue', () => {
    const streamName = 'stream_name';
    const partitionKey = 'partition_key';
    const record = {
        kinesis: {
            // Encoded: { "payload": "Hello, this is a test 123." }
            data: 'eyAicGF5bG9hZCI6ICJIZWxsbywgdGhpcyBpcyBhIHRlc3QgMTIzLiIgfQ=='
        }
    };
    const queueUrl = 'queue_url';

    beforeEach(() => {
        clearMocks();
    });

    describe('When put record successful', () => {
        beforeEach(() => {
            putRecordPromiseFn.mockReturnValueOnce(Promise.resolve());
        });

        it('calls putRecord function', async () => {
            const expectedCalledParameters = {
                Data: JSON.stringify(record),
                PartitionKey: partitionKey,
                StreamName: streamName
            };

            await kinesis.putRecordWithBackupQueue(streamName, partitionKey, record, queueUrl);
            expect(putRecordFn).toBeCalledWith(expectedCalledParameters);
        });

        it('does not send message to queue', async () => {
            await kinesis.putRecordWithBackupQueue(streamName, partitionKey, record, queueUrl);
            expect(sqs.sendMessage).not.toBeCalled();
        });
    });

    describe('When put record fail', () => {
        beforeEach(() => {
            putRecordPromiseFn.mockReturnValueOnce(Promise.reject(Error('ERROR')));
        });

        it('sends message to queue', async () => {
            await kinesis.putRecordWithBackupQueue(streamName, partitionKey, record, queueUrl);
            expect(sqs.sendMessage).toBeCalledWith(queueUrl, record);
        });
    });
});

describe('putRecords', () => {
    const streamName = 'stream_name';
    const partitionKey = 'partition_key';
    const records = [
        {
            kinesis: {
                // Encoded: { "payload": "Hello, this is a test 123." }
                data: 'eyAicGF5bG9hZCI6ICJIZWxsbywgdGhpcyBpcyBhIHRlc3QgMTIzLiIgfQ=='
            }
        },
        {
            kinesis: {
                // Encoded: { "payload": "example" }
                data: 'eyAicGF5bG9hZCI6ICJleGFtcGxlIiB9'
            }
        }
    ];

    beforeEach(() => {
        clearMocks();
    });

    it('calls putRecords function', async () => {
        const expectedCalledParameters = {
            Records: records.map((record) => ({
                Data: JSON.stringify(record),
                PartitionKey: partitionKey
            })),
            StreamName: streamName
        };

        await kinesis.putRecords(streamName, partitionKey, records);
        expect(putRecordsFn).toBeCalledWith(expectedCalledParameters);
    });
});

describe('extractRecords', () => {
    const event = {
        Records: [
            {
                kinesis: {
                    // Encoded: { "payload": "Hello, this is a test 123." }
                    data: 'eyAicGF5bG9hZCI6ICJIZWxsbywgdGhpcyBpcyBhIHRlc3QgMTIzLiIgfQ=='
                }
            },
            {
                kinesis: {
                    // Encoded: { "payload": "Chinese ¢ㅋㅋで漢字汉字" }
                    data: 'eyAicGF5bG9hZCI6ICJDaGluZXNlIMKi44WL44WL44Gn5ryi5a2X5rGJ5a2XIn0='
                }
            }
        ]
    };

    beforeEach(() => {
        clearMocks();
    });

    it('extracts all records', () => {
        expect(kinesis.extractRecords(event)).toEqual([
            { payload: 'Hello, this is a test 123.' },
            { payload: 'Chinese ¢ㅋㅋで漢字汉字' }
        ]);
    });

    it('throws error when data is not a JSON object representation', () => {
        const invalidEvent = {
            Records: [{
                kinesis: {
                    // Encoded: "Hello, this is a test 123."
                    data: 'SGVsbG8sIHRoaXMgaXMgYSB0ZXN0IDEyMy4='
                }
            }]
        };
        expect(() => kinesis.extractRecords(invalidEvent))
            .toThrow('Error decoding JSON: [Hello, this is a test 123.]');
    });
});
