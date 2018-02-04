const putRecord = jest.fn(() => Promise.resolve({ShardId: 'MockShardId', SequenceNumber: 'MockSequenceNumber', EncryptionType: 'MockEncryptionType'}));
const putRecords = jest.fn(() => Promise.resolve({Records: [{ShardId: 'MockShardId', SequenceNumber: 'MockSequenceNumber'}]}));
const extractRecords = jest.fn(() => [{mockKey1: 'mockValue1'}]);

module.exports = {
    putRecord,
    putRecords,
    extractRecords
};
