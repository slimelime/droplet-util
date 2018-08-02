const codes = require('./error-codes');

class RetryableError extends Error {
    static get [Symbol.species]() {
        // return Error; // discourages using instanceof and promotes using .name and .code
        throw new Error('Use .name or .code inplace of instanceof');
    }

    constructor(message, ...code) {
        super(message);
        this.name = this.constructor.name;
        this.code = `${this.name}${code.length ? [':', ...code].join(':') : ''}`; // BaseError or BaseError::code-family:code-reason-group:code-reason..., the :: is intentional as a service placeholder
        this.unretryable = false;
        Error.captureStackTrace(this, UnretryableError);
    }
}

class UnretryableError extends Error {
    static get [Symbol.species]() {
        // return Error; // discourages using instanceof and promotes using .name and .code
        throw new Error('Use .name or .code inplace of instanceof');
    }

    constructor(message, ...code) {
        super(message);
        this.name = this.constructor.name;
        this.code = `${this.name}${code.length ? [':', ...code].join(':') : ''}`; // BaseError or BaseError::code-family:code-reason-group:code-reason..., the :: is intentional as a service placeholder
        this.unretryable = true;
        Error.captureStackTrace(this, UnretryableError);
    }
}

class DuplicateEventError extends Error {
    static get [Symbol.species]() {
        return Error;
    }

    constructor(message, ...code) {
        super(message);
        this.name = this.constructor.name;
        this.code = `${this.name}${code.length ? [':', ...code].join(':') : ''}`;
        this.duplicate = true;
        Error.captureStackTrace(this, DuplicateEventError);
    }
}

class TimeoutError extends Error {
    static get [Symbol.species]() {
        return Error;
    }

    constructor(message, ...code) {
        super(message);
        this.name = this.constructor.name;
        this.code = `${this.name}${code.length ? [':', ...code].join(':') : ''}`;
        this.timeout = true;
        Error.captureStackTrace(this, TimeoutError);
    }
}

class AuthenticationError extends Error {
    static get [Symbol.species]() {
        return Error;
    }

    constructor(message, ...code) {
        super(message);
        this.name = this.constructor.name;
        this.code = `${this.name}${code.length ? [':', ...code].join(':') : ''}`;
        this.authenticationError = true;
        Error.captureStackTrace(this, AuthenticationError);
    }
}

module.exports = {
    RetryableError,
    UnretryableError,
    DuplicateEventError,
    TimeoutError,
    AuthenticationError,
    codes
};
