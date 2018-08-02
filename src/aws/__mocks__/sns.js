const publish = jest.fn(() => Promise.resolve({ MessageId: 'MOCK_MessageId' }));
const extractRecords = jest.fn((event) => [event]);

module.exports = {
    publish,
    extractRecords
};
