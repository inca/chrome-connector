'use strict';

const EventEmitter = require('eventemitter3');

/* global window */

/**
 * A WebSocket adapter for browser.
 * Returns an object compatible to WebSocket client of `ws` module.
 */
module.exports = function createWebSocket(url) {
    const wrapper = new EventEmitter();
    const _ws = new window.WebSocket(url);
    _ws.onopen = () => wrapper.emit('open');
    _ws.onclose = () => wrapper.emit('close');
    _ws.onmessage = ev => wrapper.emit('message', ev.data);
    _ws.onerror = () => wrapper.emit('error');
    return Object.assign(wrapper, {
        close() {
            _ws.close();
        },
        send(data) {
            _ws.send(data);
        },
    });
};
