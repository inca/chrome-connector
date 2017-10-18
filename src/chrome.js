'use strict';

const EventEmitter = require('eventemitter3');
const createWebSocket = require('./websocket');

const {
    NotConnectedError,
    ProtocolError,
    ProtocolTimeoutError,
    TabCrashedError,
} = require('./errors');

/**
 * Remote interface to Chrome Debugging Protocol (CDP).
 *
 * Communication in CDP is established via WebSocket.
 * In order to connect to the page (tab or webview) browser instance must
 * be started in debugging mode (typically with `--remote-debugging-port=9222`).
 * In this mode each inspectable target exposes a Web Socket Server,
 * which can be acquired by visiting `http://localhost:9222/json`.
 *
 * Events:
 *
 *  - connect - connection established
 *  - close - non-user initiated disconnect (e.g. tab closed, NOT chrome.disconnect)
 *  - disconnect — any disconnect (e.g. close or chrome.disconnect())
 *  - event(method, params) - CDP event (e.g. "DOM.setChildNodes")
 *
 *  @see http://chromedevtools.github.io/debugger-protocol-viewer/tot
 *  @see https://github.com/cyrus-and/chrome-remote-interface
 *  @param webSocketDebuggerUrl {string} as aquired from CDP
 *  @param options {object}
 *  @param options.timeout {number} `sendCommand` response timeout, default is 60000
 */
module.exports = function createChromeConnector(webSocketDebuggerUrl, options = {}) {

    const {
        timeout = 60000,
        rejectOnCrash = true,
        rejectOnDisconnect = true,
    } = options;

    const chrome = new EventEmitter();
    // Commands are resolved when response with id
    // is received from WS; this map associates id with handler
    const _awaitingHandlers = new Map();
    // WS client is set once connected
    let _ws = null;
    // Commands sent via CDP need to have unique ids
    let _nextCommandId = 1;

    Object.assign(chrome, {
        isConnected,
        connect,
        disconnect,
        sendCommand,
    });

    if (rejectOnCrash) {
        chrome.addListener('Inspector.targetCrashed', () => {
            for (const handler of _awaitingHandlers.values()) {
                handler.reject(new TabCrashedError(handler.method, handler.params));
            }
        });
    }

    if (rejectOnDisconnect) {
        chrome.addListener('disconnect', () => {
            for (const handler of _awaitingHandlers.values()) {
                handler.reject(new NotConnectedError(handler.method, handler.params));
            }
        });
    }

    return chrome;

    /**
     * @returns {Boolean} true if connected, false otherwise
     */
    function isConnected() {
        return !!_ws;
    }

    /**
     * Establishes a connection to CDP server.
     *
     * @param wsUrl {string} optionally override the initial `webSocketDebuggerUrl`
     * @returns {Promise}
     */
    function connect(wsUrl = webSocketDebuggerUrl) {
        return new Promise((resolve, reject) => {
            // Do not connect more than once
            if (isConnected()) {
                resolve();
            }
            try {
                _ws = createWebSocket(wsUrl);
                _ws.on('open', () => {
                    chrome.emit('connect');
                    resolve();
                });
                _ws.on('message', onMessage);
                _ws.on('close', onClose);
                _ws.on('error', reject);
            } catch (err) {
                reject(err); // bad URL
            }
        });
    }

    /**
     * Disconnects from CDP and emits `disconnect` event.
     */
    function disconnect() {
        if (!isConnected()) {
            return;
        }
        // Don't notify on user-initiated disconnect
        _ws.removeAllListeners();
        _ws.close();
        _ws = null;
        chrome.emit('disconnect');
    }

    /**
     * Sends a CDP command.
     *
     * Note #1: this only rejects if protocol error occurs (e.g. incorrect
     * parameters specified). Methods like "Runtime.runScript" can
     * resolve with `result.exceptionDetails`.
     *
     * Note #2: it is pretty much impossible to implement automation on
     * stable versions of protocol, so much of the functionality
     * is implemented using tip-of-tree which is highly experimental
     * and is subject to change by Chromium team without notice.
     *
     * @see https://chromedevtools.github.io/debugger-protocol-viewer/tot
     * @param method - CDP method (e.g. "DOM.resolveNode")
     * @param params {object} - CDP params
     * @returns {Promise} - resolved with "Return object" as per CDP,
     *                      rejected on protocol errors
     */
    function sendCommand(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (!isConnected()) {
                throw new NotConnectedError(method, params);
            }
            const id = _nextCommandId;
            _nextCommandId += 1;
            _ws.send(JSON.stringify({
                id,
                method,
                params,
            }));
            const timer = setTimeout(() => {
                handler.reject(new ProtocolTimeoutError(method, params));
            }, timeout);
            const handler = {
                id,
                method,
                params,
                resolve(result) {
                    _awaitingHandlers.delete(id);
                    clearTimeout(timer);
                    resolve(result);
                },
                reject(err) {
                    _awaitingHandlers.delete(id);
                    clearTimeout(timer);
                    reject(err);
                },
            };
            _awaitingHandlers.set(id, handler);
        });
    }

    function onMessage(data) {
        const message = JSON.parse(data);
        if (message.id) {              // command response
            const handler = _awaitingHandlers.get(message.id);
            // handler can be removed if resolved/reject twice (e.g. race condition with timeout)
            if (!handler) {
                return;
            }
            if (message.error) {
                const { method, params } = handler;
                handler.reject(new ProtocolError(method, params, message.error));
            } else {
                handler.resolve(message.result);
            }
        } else if (message.method) {   // event
            const { method, params } = message;
            chrome.emit('event', method, params);
            chrome.emit('event.' + method.replace(/\..*/, ''), method, params);
            chrome.emit(method, params);
        }
    }

    function onClose(ev) {
        _ws = null;
        chrome.emit('close', ev);
        chrome.emit('disconnect', ev);
    }

};
