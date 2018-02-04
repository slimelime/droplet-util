const assumeRole = jest.fn(() => Promise.resolve({accessKeyId: 'MockAccessKeyId', secretAccessKey: 'MockSecretAccessKey', sessionToken: 'MockSessionToken'}));
const assumeRoles = jest.fn(() => Promise.resolve([{accessKeyId: 'MockAccessKeyId', secretAccessKey: 'MockSecretAccessKey', sessionToken: 'MockSessionToken'}]));

module.exports = {
    assumeRole,
    assumeRoles
};
