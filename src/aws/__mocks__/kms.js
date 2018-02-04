const decrypt = jest.fn(() => Promise.resolve('PLAIN_TEXT_PASSWORD'));

module.exports = {
    decrypt
};
