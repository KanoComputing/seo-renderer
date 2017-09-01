const path = require('path');
const test = require('ava');
const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.static(path.resolve(__dirname, 'resources')));

const appInstances = [];
const testBase = 'http://localhost:1234/';

test.before(async(t) => {
    await app.listen(1234);
});

test.after.always(async(t) => {
    // Let the connections close
    await new Promise(resolve => setTimeout(resolve, 100));
    for (let app of appInstances) {
        await app.stop();
    }
});

/**
 * This deletes server from the require cache and reloads
 * the server, allowing for a clean state between each test.
 * @param {?Object} config
 * @return {!Object} app server
 */
async function createServer(config) {
    config = config || { caching: false };
    delete require.cache[require.resolve('../lib/main.js')];
    const app = await require('../lib/main.js')(config);
    appInstances.push(app);
    return request(app);
}

test('renders basic script', async(t) => {
    const server = await createServer();
    const res = await server.get(`/render/${testBase}basic-script.html`);
    t.is(res.status, 200);
    t.true(res.text.indexOf('document-title') !== -1);
});

test('appends custom query params when host matches', async(t) => {
    const server = await createServer({
        caching: false,
        extraParams: {
            'localhost': {
                'extra': 'param'
            }
        }
    });
    const res = await server.get(`/render/${testBase}basic-script.html`);
    t.is(res.status, 200);
    t.true(res.text.indexOf('<base href="http://localhost:1234/basic-script.html?extra=param">') !== -1);
});

test('conserves query parameters', async(t) => {
    const server = await createServer();
    const res = await server.get(`/render/${testBase}basic-script.html?my=param`);
    t.is(res.status, 200);
    t.true(res.text.indexOf('<base href="http://localhost:1234/basic-script.html?my=param">') !== -1);
});

test('merges params and extra params', async(t) => {
    const server = await createServer({
        caching: false,
        extraParams: {
            'localhost': {
                'extra': 'param'
            }
        }
    });
    const res = await server.get(`/render/${testBase}basic-script.html?my=param`);
    t.is(res.status, 200);
    t.true(res.text.indexOf('<base href="http://localhost:1234/basic-script.html?my=param&amp;extra=param">') !== -1);
});
