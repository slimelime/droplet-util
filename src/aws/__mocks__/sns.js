const publish = jest.fn(() => Promise.resolve({ MessageId: 'MOCK_MessageId' }));
const extractRecords = jest.fn(() => [{mockKey1: 'mockValue1'}]);

module.exports = {
    publish,
    extractRecords
};
