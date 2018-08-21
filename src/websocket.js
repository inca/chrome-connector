'use strict';

const WebSocket = require('ws');

module.exports = function createWebSocket(url) {
    return new WebSocket(url, {
        // https://github.com/cyrus-and/chrome-remote-interface/issues/39
        perMessageDeflate: false,
    });
};
