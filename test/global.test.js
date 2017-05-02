'use strict';

const helpers = require('./helpers');

let electronProcess = null;

before(async () => {
    if (!process.env.WS && !process.env.CHROME) {
        electronProcess = await helpers.spawnElectron();
    }
});

after(() => {
    if (electronProcess) {
        electronProcess.kill('SIGTERM');
    }
});
