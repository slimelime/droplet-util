const getClusterCredentials = jest.fn(() => Promise.resolve({DbUser: 'MockDbUser', DbPassword: 'MockDbPassword', Expiration: new Date()}));

module.exports = {
    getClusterCredentials
};
