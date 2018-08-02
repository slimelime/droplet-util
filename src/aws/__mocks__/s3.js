const MemoryStream = require('memorystream');

const bucketExist = jest.fn(() => Promise.resolve(true));
const copyObject = jest.fn(() => Promise.resolve({CopyObjectResult: {LastModified: Date.now()}}));
const countLines = jest.fn(() => Promise.resolve(1000));
const createBucket = jest.fn(() => Promise.resolve({}));
const deleteObject = jest.fn(() => Promise.resolve({}));
const getBucketLocation = jest.fn(() => Promise.resolve({LocationConstraint: 'MOCK_LocationConstraint'}));
const putBucketEncryption = jest.fn(() => Promise.resolve({}));
const getBucketPolicy = jest.fn(() => Promise.resolve({Policy: '{}'}));
const getObject = jest.fn(() => Promise.resolve({Body: 'MOCK_Body', LastModified: Date.now()}));
const getObjectReadStream = jest.fn(() => () => MemoryStream.createReadStream('MOCK_Body'));
const listObjects = jest.fn(() => Promise.resolve([{ Key: 'mock1.csv' }, { Key: 'mock2.csv'}]));
const moveObject = jest.fn(() => Promise.resolve({}));
const objectExists = jest.fn(() => Promise.resolve(true));
const putBucketPolicy = jest.fn(() => Promise.resolve({}));
const readHeaderLine = jest.fn(() => Promise.resolve('"HEADER1","HEADER2"'));
const readLines = jest.fn(() => Promise.resolve(['f11,f12,f13', 'f21,f22,f23', 'f31,f32,f33']));
const upload = jest.fn(() => Promise.resolve({}));
const getBucketNotificationConfiguration = jest.fn(() => Promise.resolve({
    TopicConfigurations: [],
    QueueConfigurations: [],
    LambdaFunctionConfigurations: []
}));
const putBucketNotificationConfiguration = jest.fn(() => Promise.resolve({}));

module.exports = {
    bucketExist,
    copyObject,
    countLines,
    createBucket,
    deleteObject,
    getBucketLocation,
    putBucketEncryption,
    getBucketPolicy,
    getObject,
    getObjectReadStream,
    listObjects,
    moveObject,
    objectExists,
    putBucketPolicy,
    readHeaderLine,
    readLines,
    upload,
    getBucketNotificationConfiguration,
    putBucketNotificationConfiguration
};
