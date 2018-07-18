'use strict';

//eslint-disable-next-line no-undef
const hasGlobalWebSocket = !!global.WebSocket || (typeof window !== 'undefined' && !!window.WebSocket);

module.exports = hasGlobalWebSocket ? require('./websocket-browser') : require('./websocket-node');
