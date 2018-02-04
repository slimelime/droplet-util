jest.mock('aws-sdk');

const AWS = require('aws-sdk');
const promiseFn = jest.fn();
const queryFn = jest.fn(() => ({
    promise: promiseFn
}));
const scanFn = jest.fn(() => ({
    promise: promiseFn
}));

AWS.DynamoDB = jest.fn();
AWS.DynamoDB.DocumentClient = jest.fn(() => ({
    query: queryFn,
    scan: scanFn
}));

const dynamoDoc = require('./dynamo-document');

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

    beforeEach(() => {
        queryFn.mockClear();
    });

    it('calls query function', async () => {
        await dynamoDoc.query(table, {keyConditionExpression, expressionAttributeValues});
        expect(queryFn).toBeCalledWith(expectedCalledParameters);
    });
});

describe('queryAll', () => {
    const table = 'mock_table';
    const keyConditionExpression = 'PrimaryKey = :primarykey';
    const expressionAttributeValues = {':primaryKey': 'mock_key'};
    const LastEvaluatedKey = 'continue_key';
    const expectedItems = [
        { PrimaryKey: '1' },
        { PrimaryKey: '2' }
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
        queryFn.mockClear();
        promiseFn.mockReset();
        promiseFn
            .mockReturnValueOnce({
                Items: [expectedItems[0]],
                LastEvaluatedKey
            })
            .mockReturnValueOnce({
                Items: [expectedItems[1]]
            });
    });

    it('calls query function twice', async () => {
        await dynamoDoc.queryAll(table, {keyConditionExpression, expressionAttributeValues});
        expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it('calls query with expected params', async () => {
        await dynamoDoc.queryAll(table, {keyConditionExpression, expressionAttributeValues});
        expect(queryFn).toBeCalledWith(expectedFirstCalledParameters);
        expect(queryFn).toBeCalledWith(expectedSecondCalledParameters);
    });

    it('respects item limitation', async () => {
        await dynamoDoc.queryAll(table, {keyConditionExpression, expressionAttributeValues, limit: 1});
        expect(queryFn).toBeCalledWith(expectedFirstCalledParameters);
        expect(queryFn).toHaveBeenCalledTimes(1);
    });

    it('returns expected items', async () => {
        const items = await dynamoDoc.queryAll(table, {keyConditionExpression, expressionAttributeValues});
        expect(items).toEqual(expectedItems);
    });

    //TODO: add test for strict = true, assert that excess results from the last batch are ignored and total results = limit
});

describe('scanAll', () => {
    const table = 'mock_table';
    const filterExpression = "status = :a";
    const expressionAttributeValues = {':a': 'InProgress'};
    const LastEvaluatedKey = 'continue_key';
    const expectedItems = [
        { PrimaryKey: '1' },
        { PrimaryKey: '2' }
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
        scanFn.mockClear();
        promiseFn.mockReset();
        promiseFn
            .mockReturnValueOnce({
                Items: [expectedItems[0]],
                LastEvaluatedKey
            })
            .mockReturnValueOnce({
                Items: [expectedItems[1]]
            });
    });

    it('calls scan function twice', async () => {
        await dynamoDoc.scanAll(table, filterExpression, expressionAttributeValues);
        expect(scanFn).toHaveBeenCalledTimes(2);
    });

    it('calls scan with expected params', async () => {
        await dynamoDoc.scanAll(table, {filterExpression, expressionAttributeValues});
        expect(scanFn).toBeCalledWith(expectedFirstCalledParameters);
        expect(scanFn).toBeCalledWith(expectedSecondCalledParameters);
    });

    it('respects item limitation', async () => {
        await dynamoDoc.scanAll(table, {filterExpression, expressionAttributeValues, limit: 1});
        expect(scanFn).toBeCalledWith(expectedFirstCalledParameters);
        expect(scanFn).toHaveBeenCalledTimes(1);
    });

    it('returns expected items', async () => {
        const items = await dynamoDoc.scanAll(table, {filterExpression, expressionAttributeValues});
        expect(items).toEqual(expectedItems);
    });

    //TODO: add test for strict = true, assert that excess results from the last batch are ignored and total results = limit
});
