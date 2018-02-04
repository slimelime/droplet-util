const request = require('superagent');

async function post(url, data, contentType = 'application/json') {
    return await request.post(url)
        .set('Content-Type', contentType)
        .send(data);
}

module.exports = {
    post
};
