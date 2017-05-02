'use strict';

/**
 * Thrown when attempting to send a CDP command on disconnected instance.
 */
exports.NotConnectedError = class NotConnectedError extends Error {
    constructor(webSocketDebuggerUrl) {
        super('CDP not connected');
        this.name = this.constructor.name;
        this.details = {
            webSocketDebuggerUrl,
        };
        this.retriable = true;
    }
};

/**
 * Thrown when incorrect CDP command sent or its params are incorrect.
 *
 * @param cause {{ message: string }} an error object return from CDP backend
 */
exports.ProtocolError = class ProtocolError extends Error {
    constructor(method, params, cause) {
        const msg = [cause.message, cause.data].filter(Boolean).join(' ');
        super(`${method}: ${msg}`);
        this.name = this.constructor.name;
        this.details = {
            method,
            params,
            cause,
        };
        this.retriable = true;
    }
};

/**
 * Thrown when response from CDP takes too long (prevents hanging in case of crash).
 */
exports.ProtocolTimeoutError = class ProtocolTimeoutError extends Error {
    constructor(method, params) {
        super('CDP timeout');
        this.name = this.constructor.name;
        this.details = {
            method,
            params,
        };
        this.retriable = true;
    }
};
