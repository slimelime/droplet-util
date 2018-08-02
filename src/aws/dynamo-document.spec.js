jest.disableAutomock();
jest.mock('aws-sdk');

const { DynamoDB } = require('aws-sdk');
const promiseFn = jest.fn();

const getFn = jest.fn(() => ({ promise: promiseFn }));
const deleteFn = jest.fn(() => ({ promise: promiseFn }));
const putFn = jest.fn(() => ({ promise: promiseFn }));
const updateFn = jest.fn(() => ({ promise: promiseFn }));
const queryPromiseFn = jest.fn();
const queryFn = jest.fn(() => ({ promise: queryPromiseFn }));
const scanPromiseFn = jest.fn();
const scanFn = jest.fn(() => ({ promise: scanPromiseFn }));
const batchWriteFn = jest.fn(() => ({ promise: promiseFn }));

DynamoDB.DocumentClient = jest.fn(() => ({
    get: getFn,
    delete: deleteFn,
    put: putFn,
    update: updateFn,
    query: queryFn,
    scan: scanFn,
    batchWrite: batchWriteFn
}));

const docClient = require('./dynamo-document');

describe('util/aws/dynamo-document', () => {
    beforeEach(() => {
        getFn.mockClear();
        deleteFn.mockClear();
        putFn.mockClear();
        updateFn.mockClear();
        queryFn.mockClear();
        queryPromiseFn.mockClear();
        scanFn.mockClear();
        scanPromiseFn.mockClear();
        batchWriteFn.mockClear();
    });

    describe('get', () => {
        const table = 'mock_table';
        const keyMap = {
            someKey: 'key_value'
        };

        const expectedCalledParameters = {
            TableName: table,
            Key: keyMap
        };

        it('calls get function', async () => {
            await docClient.get(table, keyMap);
            expect(getFn).toBeCalledWith(expectedCalledParameters);
        });
    });

    describe('deleteItem', () => {
        const table = 'mock_table';
        const keyMap = {
            someKey: 'key_value'
        };

        const expectedCalledParameters = {
            TableName: table,
            Key: keyMap
        };

        it('calls delete function', async () => {
            await docClient.deleteItem(table, keyMap);
            expect(deleteFn).toBeCalledWith(expectedCalledParameters);
        });
    });

    describe('put', () => {
        const table = 'mock_table';
        const item = {someKey: 'some_value'};

        const expectedCalledParameters = {
            TableName: table,
            Item: item
        };

        it('calls put function', async () => {
            await docClient.put(table, item);
            expect(putFn).toBeCalledWith(expectedCalledParameters);
        });
    });

    describe('update', () => {
        const table = 'mock_table';
        const keyMap = {someKey: 'some_value'};
        const expectedCalledParameters = {
            TableName: table,
            Key: keyMap
        };

        it('calls update function', async () => {
            await docClient.update(table, keyMap);
            expect(updateFn).toBeCalledWith(expectedCalledParameters);
        });
    });

    describe('query', () => {
        const table = 'mock_table';
        const keyConditionExpression = 'PrimaryKey = :primarykey';
        const expressionAttributeValues = {':primaryKey': 'mock_key'};

        const expectedCalledParameters = {
            TableName: table,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnConsumedCapacity: 'TOTAL'
        };

        it('calls query function', async () => {
            await docClient.query(table, {keyConditionExpression, expressionAttributeValues});
            expect(queryFn).toBeCalledWith(expectedCalledParameters);
        });
    });

    describe('queryAll', () => {
        const table = 'mock_table';
        const keyConditionExpression = 'PrimaryKey = :primarykey';
        const expressionAttributeValues = {':primaryKey': 'mock_key'};
        const LastEvaluatedKey = 'continue_key';
        const expectedItems = [
            {PrimaryKey: '1'},
            {PrimaryKey: '2'}
        ];

        const expectedFirstCalledParameters = {
            TableName: table,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnConsumedCapacity: 'TOTAL'
        };
        const expectedSecondCalledParameters = {
            TableName: table,
            KeyConditionExpression: keyConditionExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExclusiveStartKey: LastEvaluatedKey,
            ReturnConsumedCapacity: 'TOTAL'
        };

        beforeEach(() => {
            queryPromiseFn
                .mockReturnValueOnce(Promise.resolve({
                    Items: [expectedItems[0]],
                    LastEvaluatedKey
                }))
                .mockReturnValueOnce(Promise.resolve({
                    Items: [expectedItems[1]]
                }));
        });

        it('returns expected items', async () => {
            // Shared state is being reset during this test? Causing it to fail - but only this test?
            const items = await docClient.queryAll(table, {keyConditionExpression, expressionAttributeValues});
            expect(queryFn).toHaveBeenCalledTimes(2);
            expect(items).toEqual(expectedItems);
        });

        it('calls query function twice', async () => {
            await docClient.queryAll(table, {keyConditionExpression, expressionAttributeValues});
            expect(queryFn).toHaveBeenCalledTimes(2);
        });

        it('calls query with expected params', async () => {
            await docClient.queryAll(table, {keyConditionExpression, expressionAttributeValues});
            expect(queryFn).toBeCalledWith(expectedFirstCalledParameters);
            expect(queryFn).toBeCalledWith(expectedSecondCalledParameters);
            expect(queryFn).toHaveBeenCalledTimes(2);
        });

        it('respects item limitation', async () => {
            await docClient.queryAll(table, {keyConditionExpression, expressionAttributeValues, limit: 1});
            expect(queryFn).toBeCalledWith(expectedFirstCalledParameters);
            expect(queryFn).toHaveBeenCalledTimes(1);
        });

        it('respects strict item limitation', async () => {
            queryPromiseFn.mockReset();
            queryPromiseFn.mockReturnValueOnce(Promise.resolve({
                    Items: [expectedItems[1]],
                    LastEvaluatedKey
                }))
                .mockReturnValueOnce(Promise.resolve({
                    // Require extra items returned in the second batch past the strict limit
                    Items: [expectedItems[0], {PrimaryKey: 'dropped'}, {PrimaryKey: 'dropped'}]
                }));
            queryFn.mockClear();

            const items = await docClient.queryAll(table, {
                keyConditionExpression,
                expressionAttributeValues,
                strict: true,
                limit: 2
            });
            expect(queryFn).toHaveBeenCalledTimes(2);
            expect(items).toEqual([expectedItems[1], expectedItems[0]]);
        });
    });

    describe('scanAll', () => {
        const table = 'mock_table';
        const filterExpression = 'status = :a';
        const expressionAttributeValues = {':a': 'InProgress'};
        const LastEvaluatedKey = 'continue_key';
        const expectedItems = [
            {PrimaryKey: '1'},
            {PrimaryKey: '2'}
        ];

        const expectedFirstCalledParameters = {
            TableName: table,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnConsumedCapacity: 'TOTAL'
        };
        const expectedSecondCalledParameters = {
            TableName: table,
            FilterExpression: filterExpression,
            ExpressionAttributeValues: expressionAttributeValues,
            ExclusiveStartKey: LastEvaluatedKey,
            ReturnConsumedCapacity: 'TOTAL'
        };

        beforeEach(() => {
            scanPromiseFn.mockReset();
            scanPromiseFn
                .mockReturnValueOnce(Promise.resolve({
                    Items: [expectedItems[0]],
                    LastEvaluatedKey
                }))
                .mockReturnValueOnce(Promise.resolve({
                    Items: [expectedItems[1]]
                }));
        });

        it('calls scan function twice', async () => {
            await docClient.scanAll(table, filterExpression, expressionAttributeValues);
            expect(scanFn).toHaveBeenCalledTimes(2);
        });

        it('calls scan with expected params', async () => {
            await docClient.scanAll(table, {filterExpression, expressionAttributeValues});
            expect(scanFn).toBeCalledWith(expectedFirstCalledParameters);
            expect(scanFn).toBeCalledWith(expectedSecondCalledParameters);
        });

        it('respects item limitation', async () => {
            const items = await docClient.scanAll(table, {filterExpression, expressionAttributeValues, limit: 1});
            expect(scanFn).toBeCalledWith(expectedFirstCalledParameters);
            expect(scanFn).toHaveBeenCalledTimes(1);
            expect(items.length).toEqual(1);
        });

        it('returns expected items', async () => {
            const items = await docClient.scanAll(table, {filterExpression, expressionAttributeValues});
            expect(items).toEqual(expectedItems);
        });

        it('respects strict item limitation', async () => {
            scanPromiseFn.mockClear();
            scanPromiseFn.mockReturnValueOnce(Promise.resolve({
                    Items: [expectedItems[0]],
                    LastEvaluatedKey
                }))
                .mockReturnValueOnce(Promise.resolve({
                    Items: [expectedItems[1], {PrimaryKey: 'dropped'}, {PrimaryKey: 'dropped'}]
                }));

            const items = await docClient.scanAll(table, {
                filterExpression,
                expressionAttributeValues,
                strict: true,
                limit: 2
            });
            expect(scanFn).toHaveBeenCalledTimes(2);
            expect(items).toEqual(expectedItems);
        });

    });

    describe('batchWrite', () => {
        const batchLimit = 25;
        const table = 'mock_table';
        const Keys = ['someKey'];
        const items = Array.from(Array(batchLimit + 1).keys()).map((i) => ({[Keys[0]]: `some_value_${i}`})); // eslint-disable-line no-magic-numbers

        it('does not call batchWrite if there are no operations', async () => {
            await docClient.batchWrite(table);
            expect(batchWriteFn).not.toHaveBeenCalled();
        });

        it('calls batchWrite once if there is less than 25 operations', async () => {
            const expectedCalledParameters = {
                RequestItems: {
                    [table]: [{DeleteRequest: {Key: {someKey: items[1].someKey}}}, {PutRequest: {Item: items[0]}}] // eslint-disable-line no-magic-numbers
                },
                ReturnConsumedCapacity: 'TOTAL'
            };
            await docClient.batchWrite(table, {Put: [items[0]], Delete: [items[1]], Keys}); // eslint-disable-line no-magic-numbers
            expect(batchWriteFn).toHaveBeenCalledTimes(1); // eslint-disable-line no-magic-numbers
            expect(batchWriteFn).toHaveBeenCalledWith(expectedCalledParameters);
        });

        it('calls batchWrite twice if there are more than 25 operations', async () => {
            const expectedFirstCalledParameters = {
                RequestItems: {
                    [table]: items.slice(0, 25).map((item) => ({PutRequest: {Item: item}}))
                },
                ReturnConsumedCapacity: 'TOTAL'
            };
            const expectedSecondCalledParameters = {
                RequestItems: {
                    [table]: [{PutRequest: {Item: items[25]}}]
                },
                ReturnConsumedCapacity: 'TOTAL'
            };
            await docClient.batchWrite(table, {Put: items});
            expect(batchWriteFn).toHaveBeenCalledTimes(2);
            expect(batchWriteFn.mock.calls[0][0]).toEqual(expectedFirstCalledParameters);
            expect(batchWriteFn.mock.calls[1][0]).toEqual(expectedSecondCalledParameters);
        });
    });
});
