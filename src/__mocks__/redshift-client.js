const RedshiftClient = jest.fn();

const openConnection = jest.fn(() => Promise.resolve());
const execute = jest.fn(() => Promise.resolve({
    rows: ['value_1', 'value_2'],
    fields: [{name: 'field_1'}, {name: 'field_2'}]
}));
const closeConnection = jest.fn(() => Promise.resolve());
const query = jest.fn(() => Promise.resolve({
    rows: ['value_1', 'value_2'],
    fields: [{name: 'field_1'}, {name: 'field_2'}]
}));

const atomicQuery = jest.fn(() => Promise.resolve({
    rows: ['value_1', 'value_2'],
    fields: [{name: 'field_1'}, {name: 'field_2'}]
}));

RedshiftClient.mockImplementation(() => {
    return {
        openConnection,
        execute,
        closeConnection,
        query,
        atomicQuery
    };
});

module.exports = {RedshiftClient};

