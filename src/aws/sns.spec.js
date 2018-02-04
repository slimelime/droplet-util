jest.mock('aws-sdk');
jest.unmock('./sns');

const AWS = require('aws-sdk');
const sns = require('./sns');

/** The only place where AWS.SNS.* should be mocked explicitly,
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

describe('publish', () => {
    const TopicArn = 'MOCK_TOPIC_ARN';
    const Subject = 'MOCK_SUBJECT';
    const Message = 'MOCK_MESSAGE';
    const expectedMessageId = 'MOCK_MessageId';
    promiseFn.mockReturnValue(Promise.resolve({MessageId: expectedMessageId}));

    describe('creating new SNS instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            promiseFn.mockClear();
            publishFn.mockClear();
            AWS.SNS.mockClear();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async() => {
            const {MessageId} = await sns.publish(TopicArn, Subject, Message);
            expect(AWS.SNS).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async() => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            const {MessageId} = await sns.publish(TopicArn, Subject, Message, userDefinedOptions);
            expect(AWS.SNS).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async() => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            const {MessageId} = await sns.publish(TopicArn, Subject, Message, userDefinedOptions);
            expect(AWS.SNS).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });

    });

    describe('calling AWS.SNS().publish with expected params', () => {
        beforeEach(() => {
            promiseFn.mockClear();
            publishFn.mockClear();
        });

        it('passes required params', async() => {
            const {MessageId} = await sns.publish(TopicArn, Subject, Message);
            expect(publishFn).toBeCalledWith({TopicArn, Subject, Message});
            expect(MessageId).toEqual(expectedMessageId);
        });

        it('Stringifies message objects', async() => {
            const messageObject = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            const {MessageId} = await sns.publish(TopicArn, Subject, messageObject);
            expect(publishFn).toBeCalledWith({TopicArn, Subject, Message: JSON.stringify(messageObject, null, 4)});
            expect(MessageId).toEqual(expectedMessageId);
        });

        it('passes user defined params', async() => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            const {MessageId} = await sns.publish(TopicArn, Subject, Message, {}, userDefinedParams);
            expect(publishFn).toBeCalledWith({TopicArn, Subject, Message, ...userDefinedParams});
            expect(MessageId).toEqual(expectedMessageId);
        });

        it('favours user defined params', async() => {
            const userDefinedParams = {
                Message: 'STRING_VALUE', /* required */
                MessageAttributes: {
                    someKey: {
                        DataType: 'STRING_VALUE', /* required */
                        BinaryValue: new Buffer('...') || 'STRING_VALUE',
                        StringValue: 'STRING_VALUE'
                    },
                    /* anotherKey: ... */
                },
                MessageStructure: 'STRING_VALUE',
                PhoneNumber: 'STRING_VALUE',
                Subject: 'STRING_VALUE',
                TargetArn: 'STRING_VALUE',
                TopicArn: 'STRING_VALUE'
            };
            const {MessageId} = await sns.publish(TopicArn, Subject, Message, {}, userDefinedParams);
            expect(publishFn).toBeCalledWith(userDefinedParams);
            expect(MessageId).toEqual(expectedMessageId);
        });

        describe('when publishing the SNS message fails', () => {

            let error;

            beforeEach((done) => {
                promiseFn.mockClear();
                publishFn.mockClear();
                promiseFn.mockReturnValue(Promise.reject(new Error('Mock message')));
                sns.publish(TopicArn, Subject, Message).catch(err => {
                    error = err;
                    done();
                });
            });

            it('returns the failure from SNS', async () => {
                expect(error).toEqual(new Error('Mock message'));
            });

        });
    });

});
