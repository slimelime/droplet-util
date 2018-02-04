jest.disableAutomock();
jest.mock('superagent');

const superagent = require('superagent');
superagent.post = jest.fn();
const setFn = jest.fn();
superagent.post.mockImplementation(() => {
    return {set: setFn};
});

const sendFn = jest.fn();
setFn.mockImplementation(() => {
    return {send: sendFn};
});

const httpClient = require('./http-client');

const url = 'http://localhost:9000';
const data = {
    name: 'mock_data'
};

describe('http-client', () => {
    const clearMocks = () => {
        setFn.mockClear();
        superagent.post.mockClear();
    };

    beforeEach(() => {
        clearMocks();
    });

    describe('post', () => {
        it('post to the correct url', async () => {
            await httpClient.post(url, data);
            expect(superagent.post).toBeCalledWith(url);
        });
        it('correct headers are sent', async () => {
            await httpClient.post(url, data);
            expect(setFn).toBeCalledWith('Content-Type', 'application/json');
        });
        it('correct data is sent', async () => {
            await httpClient.post(url, data);
            expect(sendFn).toBeCalledWith(data);
        });
    });
});

