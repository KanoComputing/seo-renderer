const url = require('url');
const express = require('express');
const compression = require('compression');
const chromeLauncher = require('chrome-launcher');
const renderer = require('./renderer');
const cache = require('./cache');


function SeoRenderer (config) {
    const app = express();
    
    /**
     * Parses the target url and embed the query params and extra params from configuration
     */
    app.get('/render/:url(*)', (request, response, next) => {
        let urlObj = url.parse(request.params.url, true),
            originUrlObj = url.parse(request.url, true);
        urlObj.query = originUrlObj.query;
        if (!!config.extraParams && !!config.extraParams[urlObj.hostname]) {
            const extraParams = config.extraParams[urlObj.hostname];
            Object.assign(urlObj.query, extraParams);
        }
        request.targetUrl = url.format(urlObj);
        next();
    });
    
    /**
     * If caching is enabled, add the caching middleware
     */
    if (!!config.caching && !!config.caching.enabled) {
        cache.configure(config.caching);
        app.get('/render/:url(*)', cache.middleware());
    }
    
    app.use(compression());
    
    app.get('/render/:url(*)', async(request, response) => {
        try {
            const result = await renderer.serialize(request.targetUrl, request.query, config);
            response.status(result.status).send(result.body);
        } catch (err) {
            response.status(400).send('Cannot render requested URL');
            console.error(err);
        }
    });
    
    app.stop = async() => {
        await config.chrome.kill();
    };
    
    // Allows the config to be overriden
    app.setConfig = (newConfig) => {
        const oldConfig = config;
        config = newConfig;
        config.chrome = oldConfig.chrome;
        config.port = oldConfig.port;
    };
    
    const appPromise = chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu', '--remote-debugging-address=0.0.0.0'],
        port: 0
    }).then((chrome) => {
        console.log('Chrome launched with debugging on port', chrome.port);
        config.chrome = chrome;
        config.port = chrome.port;
        return app;
    }).catch((error) => {
        console.error(error);
        // Critical failure, exit with error code.
        process.exit(1);
    });

    return appPromise;
}

module.exports = SeoRenderer;