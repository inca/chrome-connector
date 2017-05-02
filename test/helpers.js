'use strict';

const expect = require('expect');
const fetch = require('node-fetch');
const { spawn } = require('child_process');
const electron = require('electron');
const waitFor = require('waitfor-connection');

let wsUrl = null;

module.exports = {
    findWebSocketDebuggerUrl,
    spawnElectron,
};

async function findWebSocketDebuggerUrl() {
    if (!wsUrl) {
        if (process.env.WS) {
            wsUrl = process.env.WS;
        } else if (process.env.CHROME) {
            const response = await fetch(`http://${process.env.CHROME}/json/new`);
            const body = await response.json();
            const { webSocketDebuggerUrl } = body;
            wsUrl = webSocketDebuggerUrl;
        } else {
            const response = await fetch('http://localhost:9123/json');
            const body = await response.json();
            const firstTarget = body[0];
            expect(firstTarget).toExist();
            const { webSocketDebuggerUrl } = firstTarget;
            wsUrl = webSocketDebuggerUrl;
        }
    }
    return wsUrl;
}

async function spawnElectron() {
    const args = [
        '--remote-debugging-port=9123',
        'test/electron/main.js',
    ];
    const electronProcess = spawn(electron, args, {
        env: process.env,
    });
    await waitFor('localhost', 9123);
    return electronProcess;
}
