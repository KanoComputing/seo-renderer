const fs = require('fs');
const path = require('path');
const assert = require('assert');
const ENV = process.env.NODE_ENV || 'development';

const CONFIG_PATH = path.resolve(__dirname, `./config/${ENV}.json`);

let config = {};

if (fs.existsSync(CONFIG_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_PATH));
    assert(config instanceof Object);
}

const PORT = process.env.PORT || config.port;

let exceptionCount = 0;

async function logUncaughtError(error) {
    console.error('Uncaught exception');
    console.error(error);
    exceptionCount++;
    // Restart instance due to several failures.
    if (exceptionCount > 5) {
        console.log(`Detected ${exceptionCount} errors, shutting instance down`);
    if (config && config.chrome) {
        await app.stop();
    }
    process.exit(1);
    }
}

process.on('uncaughtException', logUncaughtError);
process.on('unhandledRejection', logUncaughtError);

(async() => {
    const app = await require('./lib/main')(config);

    app.listen(PORT, function() {
        console.log('Listening on port', PORT);
    });
})();