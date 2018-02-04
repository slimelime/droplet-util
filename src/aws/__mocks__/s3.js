const MemoryStream = require('memorystream');

const getBucketLocation = jest.fn(() => Promise.resolve({LocationConstraint: 'MOCK_LocationConstraint'}));

const getObject = jest.fn(() => Promise.resolve({Body: 'MOCK_Body', LastModified: Date.now()}));

const getObjectReadStream = jest.fn(() => () => MemoryStream.createReadStream('MOCK_Body'));

const copyObject = jest.fn(() => Promise.resolve({CopyObjectResult: {LastModified: Date.now()}}));

const deleteObject = jest.fn(() => Promise.resolve({}));

const moveObject = jest.fn(() => Promise.resolve({}));

const upload = jest.fn(() => Promise.resolve({}));

const objectExists = jest.fn(() => Promise.resolve(true));

const listObjects = jest.fn(() => Promise.resolve([{ Key: 'mock1.csv' }, { Key: 'mock2.csv'}]));

const readHeaderLine = jest.fn(() => Promise.resolve('"HEADER1","HEADER2"'));

const countLines = jest.fn(() => Promise.resolve(1000));

const readLines = jest.fn(() => Promise.resolve(['f11,f12,f13', 'f21,f22,f23', 'f31,f32,f33']));

module.exports = {
    getBucketLocation,
    getObject,
    getObjectReadStream,
    copyObject,
    deleteObject,
    moveObject,
    upload,
    objectExists,
    listObjects,
    readHeaderLine,
    countLines,
    readLines
};
