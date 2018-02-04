const invoke = jest.fn(() => Promise.resolve({ StatusCode: 200 }));

module.exports = {
    invoke
};
