const get = jest.fn(() => Promise.resolve({Item: {}}));
const deleteItem = jest.fn(() => Promise.resolve({Item: {}}));
const put = jest.fn(() => Promise.resolve({Attributes: {}}));
const query = jest.fn(() => Promise.resolve({Items: [{hkey: 'hkey'}, {hkey: 'hkey'}], Count: 2, ScannedCount: 2}));
const queryAll = jest.fn(() => Promise.resolve([{somekey: 'somevalue'}, {someOtherKey: 'someOtherValue'}]));
const scan = jest.fn(() => Promise.resolve({Items: [{somekey: 'somevalue'}, {someOtherKey: 'someOtherValue'}], Count: 2, ScannedCount: 2}));
const scanAll = jest.fn(() => Promise.resolve([{somekey: 'somevalue'}, {someOtherKey: 'someOtherValue'}]));
const update = jest.fn(() => Promise.resolve({}));

module.exports = {
    put,
    get,
    query,
    queryAll,
    scan,
    scanAll,
    deleteItem,
    update
};
