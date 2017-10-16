'use strict';

const expect = require('expect');
const { ChromeConnector } = require('../..');
const {
    findWebSocketDebuggerUrl,
} = require('../helpers');

describe('ChromeConnector', () => {

    let chrome = null;

    beforeEach(async () => {
        const wsUrl = await findWebSocketDebuggerUrl();
        chrome = new ChromeConnector(wsUrl);
    });

    afterEach(() => {
        chrome.disconnect();
        chrome = null;
    });

    describe('connect', () => {

        it('connects to target', async () => {
            try {
                expect(chrome.isConnected()).toEqual(false);
                await chrome.connect();
                expect(chrome.isConnected()).toEqual(true);
            } finally {
                await chrome.disconnect();
            }
        });

        it('emits connect event', async () => {
            let emitted = false;
            chrome.on('connect', () => emitted = true);
            await chrome.connect();
            expect(emitted).toEqual(true);
        });

    });

    describe('disconnect', () => {

        it('disconnects', async () => {
            await chrome.connect();
            expect(chrome.isConnected()).toEqual(true);
            await chrome.disconnect();
            expect(chrome.isConnected()).toEqual(false);
        });

        it('emits disconnect event', async () => {
            let emitted = false;
            chrome.on('disconnect', () => emitted = true);
            await chrome.connect();
            await chrome.disconnect();
            expect(emitted).toEqual(true);
        });

        it('not emits close event', async () => {
            let emitted = false;
            chrome.on('close', () => emitted = true);
            await chrome.connect();
            await chrome.disconnect();
            expect(emitted).toEqual(false);
        });

    });

    describe('sendCommand', () => {

        it('sends command and receive response', async () => {
            await chrome.connect();
            const { result } = await chrome.sendCommand('Runtime.evaluate', {
                expression: '"hello"',
                returnByValue: true,
            });
            const { type, value } = result;
            expect(type).toEqual('string');
            expect(value).toMatch('hello');
        });

        it('throws ProtocolError on incorrect command', async () => {
            await chrome.connect();
            try {
                await chrome.sendCommand('Non.sense');
            } catch (e) {
                expect(e.name).toEqual('ProtocolError');
            }
        });

        it('throws NotConnectedError if not connected', async () => {
            try {
                await chrome.sendCommand('Page.enable');
            } catch (e) {
                expect(e.name).toEqual('NotConnectedError');
            }
        });

        it('throws NotConnectedError if disconnected after command is sent', async () => {
            const promise = chrome.sendCommand('Page.navigate', { url: 'http://github.com' });
            chrome.disconnect();
            try {
                await promise;
            } catch (err) {
                expect(err.name).toEqual('NotConnectedError');
            }
        });

    });

    describe('event', () => {

        it('receives all CDP events', done => {
            chrome.on('event', method => {
                if (method === 'Page.frameStoppedLoading') {
                    done();
                }
            });
            Promise.resolve()
                .then(() => chrome.connect())
                .then(() => chrome.sendCommand('Page.enable'))
                .then(() => chrome.sendCommand('Page.navigate', {
                    url: 'data:text/html,<h1>Hi</h1>',
                }));
        });

        it('receives domain-wide CDP events', done => {
            chrome.on('event.Page', method => {
                if (method === 'Page.frameStoppedLoading') {
                    done();
                }
            });
            Promise.resolve()
                .then(() => chrome.connect())
                .then(() => chrome.sendCommand('Page.enable'))
                .then(() => chrome.sendCommand('Page.navigate', {
                    url: 'data:text/html,<h1>Hi</h1>',
                }));
        });

    });

});
