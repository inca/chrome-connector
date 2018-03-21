'use strict';

/**
 * Thrown when attempting to send a CDP command on disconnected instance.
 */
class NotConnectedError extends Error {
    constructor(method, params) {
        super('CDP not connected');
        this.name = this.constructor.name;
        this.details = {
            method,
            params,
        };
    }
}

/**
 * Thrown when incorrect CDP command sent or its params are incorrect.
 *
 * @param cause {{ message: string }} an error object return from CDP backend
 */
class ProtocolError extends Error {
    constructor(method, params, cause) {
        const msg = [cause.message, cause.data].filter(Boolean).join(' ');
        super(`${method}: ${msg}`);
        this.name = this.constructor.name;
        this.details = {
            method,
            params,
            cause,
        };
    }
}

/**
 * Thrown when response from CDP takes too long (prevents hanging in case of crash).
 */
class ProtocolTimeoutError extends Error {
    constructor(method, params) {
        super('CDP timeout');
        this.name = this.constructor.name;
        this.details = {
            method,
            params,
        };
    }
}

/**
 * Thrown when target crashes.
 */
class TabCrashedError extends Error {
    constructor(method, params) {
        super('Tab crashed');
        this.name = this.constructor.name;
        this.details = {
            method,
            params,
        };
    }
}

module.exports = {
    NotConnectedError,
    ProtocolError,
    ProtocolTimeoutError,
    TabCrashedError,
};
