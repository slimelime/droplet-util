jest.mock('aws-sdk');
jest.unmock('./kinesis');

const AWS = require('aws-sdk');
const kinesis = require('./kinesis');

/** The only place where AWS.Kinesis.* should be mocked explicitly,
 * other AWS.* members would be mocked using similar boilerplate
 * */

const promiseFn = jest.fn();
const publishFn = jest.fn();

publishFn.mockImplementation(() => ({
    promise: promiseFn
}));

AWS.SNS = jest.fn();
AWS.SNS.mockImplementation(() => ({
    publish: publishFn
}));

describe('util/aws/kinesis', () => {

    describe('extractRecords', () => {

        const event = {
            Records: [{
                kinesis: {
                    // Encoded: { "payload": "Hello, this is a test 123." }
                    data: 'eyAicGF5bG9hZCI6ICJIZWxsbywgdGhpcyBpcyBhIHRlc3QgMTIzLiIgfQ=='
                }
            }, {
                kinesis: {
                    // Encoded: { "payload": "example" }
                    data: 'eyAicGF5bG9hZCI6ICJleGFtcGxlIiB9'
                }
            }]
        };

        it('extracts all records', () => {
            expect(kinesis.extractRecords(event)).toEqual([
                { payload: 'Hello, this is a test 123.' },
                { payload: 'example' }
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
                .toThrow(new Error('Error decoding JSON: [Hello, this is a test 123.]'));
        });
    });

});
