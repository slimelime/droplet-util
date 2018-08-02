jest.mock('aws-sdk');
jest.unmock('./sqs');

const AWS = require('aws-sdk');
const sqs = require('./sqs');

/** The only place where AWS.sqs.* should be mocked explicitly,
 * other AWS.* members would be mocked using similar boilerplate
 * */

const promiseFn = jest.fn();
const createQueueFn = jest.fn();
const deleteQueueFn = jest.fn();
const sendMessageFn = jest.fn();
const receiveMessageFn = jest.fn();

createQueueFn.mockImplementation(() => ({
    promise: promiseFn
}));

deleteQueueFn.mockImplementation(() => ({
    promise: promiseFn
}));

sendMessageFn.mockImplementation(() => ({
    promise: promiseFn
}));

receiveMessageFn.mockImplementation(() => ({
    promise: promiseFn
}));

AWS.SQS = jest.fn();
AWS.SQS.mockImplementation(() => ({
    createQueue: createQueueFn,
    deleteQueue: deleteQueueFn,
    sendMessage: sendMessageFn,
    receiveMessage: receiveMessageFn
}));

describe('SQS', () => {
    const queueName = 'MOCK_QUEUE_NAME';
    const queueUrl = 'https://MOCK-REGION.amazonaws.com/15802785/MOCK_QUEUE_NAME';
    const visibilityTimeout = 'MOCK_TIMEOUT';
    const messageBody = 'MOCK_MESSAGE_BODY';
    const expectedMessageId = 'MOCK_MESSAGEID';

    const clearMocks = () => {
        promiseFn.mockReset();
        createQueueFn.mockClear();
        deleteQueueFn.mockClear();
        sendMessageFn.mockClear();
        receiveMessageFn.mockClear();
        AWS.SQS.mockClear();
    };

    describe('createQueue', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;
        const expectedCreateQueueParameters = {
            QueueName: queueName,
            Attributes: {
                VisibilityTimeout: visibilityTimeout
            }
        };
        const expectedRequestId = 'MOCK-ed51366c-85a7-558f-09e17';
        const expectedQueueUrl = 'https://MOCK-REGION.amazonaws.com/15802785/MOCK_QUEUE_NAME';

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
            promiseFn.mockReturnValueOnce(Promise.resolve({
                ResponseMetadata: {
                    RequestId: 'MOCK-ed51366c-85a7-558f-09e17',
                    QueueUrl: 'https://MOCK-REGION.amazonaws.com/15802785/MOCK_QUEUE_NAME'
                }
            }));
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('calls the SQS createQueue and gets the queue URL', async () => {
            const {
                ResponseMetadata: {
                    RequestId,
                    QueueUrl
                }
            } = await sqs.createQueue(queueName, visibilityTimeout);
            expect(createQueueFn).toBeCalledWith(expectedCreateQueueParameters);
            expect(RequestId).toEqual(expectedRequestId);
            expect(QueueUrl).toEqual(expectedQueueUrl);
            expect(AWS.SQS).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });
    });


    describe('deleteQueue', () => {
        const expectedRequestId = 'MOCK-ed51366c-85a7-558f-09e17';
        const expectedErrorMessage = 'The specified queue does not exist for this wsdl version';

        const expectedDeleteQueueParameters = {
            QueueUrl: 'https://MOCK-REGION.amazonaws.com/15802785/MOCK_QUEUE_NAME'
        };

        beforeEach(() => {
            clearMocks();
            promiseFn.mockReturnValueOnce(Promise.resolve({
                ResponseMetadata: {
                    RequestId: 'MOCK-ed51366c-85a7-558f-09e17'
                }
            }));

            promiseFn.mockReturnValueOnce(Promise.reject(
                new Error('The specified queue does not exist for this wsdl version')
            ));
        });

        it('deletes an existing queue successfully', async () => {
            const {
                ResponseMetadata: {
                    RequestId
                }
            } = await sqs.deleteQueue(queueUrl);
            expect(RequestId).toEqual(expectedRequestId);
            expect(deleteQueueFn).toBeCalledWith(expectedDeleteQueueParameters);
        });

        it('throws an error while trying to delete a non-existing queue', async () => {
            try {
                await sqs.deleteQueue(queueUrl);
            } catch (err) {
                expect(err.message).toEqual(expectedErrorMessage);
            }
        });
    });


    describe('sendMessage', () => {
        const expectedSendMessageParameters = {
            QueueUrl: 'https://MOCK-REGION.amazonaws.com/15802785/MOCK_QUEUE_NAME',
            MessageBody: messageBody
        };
        const expectedErrorMessage = 'The specified queue does not exist for this wsdl version';

        beforeEach(() => {
            clearMocks();
            promiseFn.mockReturnValueOnce(Promise.resolve(
                {
                    ResponseMetadata: {
                        RequestId: 'MOCK-ed51366c-85a7-558f-09e17',
                        MessageId: 'MOCK_MESSAGEID'
                    }
                }
            ));

            promiseFn.mockReturnValueOnce(Promise.reject(
                new Error('The specified queue does not exist for this wsdl version')
            ));
        });

        it('successfully sends a message to a queue', async () => {
            const {
                ResponseMetadata: {
                    MessageId
                }
            } = await sqs.sendMessage(queueUrl, messageBody);
            expect(sendMessageFn).toBeCalledWith(expectedSendMessageParameters);
        });

        it('throws an error while trying to send a message to a non-existing queue', async () => {
            try {
                const {
                    ResponseMetadata: {
                        MessageId
                    }
                } = await sqs.sendMessage(queueUrl, messageBody);
            } catch (err) {
                console.log('inside the catch????????????????????');
                expect(err.message).toEqual(expectedErrorMessage);
            }
        });
    });


    describe('receiveMessage', () => {
        const expectedReceiveMessageParameters = {
            QueueUrl: 'https://MOCK-REGION.amazonaws.com/15802785/MOCK_QUEUE_NAME'
        };
        const expectedMessageBody = 'MOCK_MESSAGE_BODY';

        beforeEach(() => {
            clearMocks();

            promiseFn.mockReturnValueOnce(Promise.resolve(
                {
                    ResponseMetadata: {
                        RequestId: 'MOCK-ed51366c-85a7-558f-09e17'
                    },
                    Messages: [{
                        MessageId: 'MOCK_MESSAGEID',
                        Body: 'MOCK_MESSAGE_BODY'
                    }]
                }
            ));

            promiseFn.mockReturnValueOnce(Promise.resolve(
                {
                    ResponseMetadata: {RequestId: 'MOCK-ed51366c-85a7-558f-09e17'}
                }
            ));
        });

        it('successfully receives a message from a queue', async () => {
            const {
                Messages: [
                    {
                        MessageId,
                        Body
                    }
                ]
            } = await sqs.receiveMessage(queueUrl);
            expect(receiveMessageFn).toBeCalledWith(expectedReceiveMessageParameters);
            expect(MessageId).toEqual(expectedMessageId);
            expect(Body).toEqual(expectedMessageBody);
        });

        it.skip('receives no messages if the queue does not contain any messages', async () => {

            const {
                Messages: [
                    {
                        MessageId,
                        Body
                    } = {}
                ] = []
            } = await sqs.receiveMessage(queueUrl);

            expect(MessageId).toBeUndefined();
            expect(Body).toBeUndefined();

        });
    });
});
