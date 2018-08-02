const createUser = jest.fn(() => Promise.resolve({}));
const createAccessKey = jest.fn(() => Promise.resolve({}));

module.exports = {
    createUser,
    createAccessKey
};
