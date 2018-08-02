'use strict';

var _create = require('babel-runtime/core-js/object/create');

var _create2 = _interopRequireDefault(_create);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _setPrototypeOf = require('babel-runtime/core-js/object/set-prototype-of');

var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _construct = require('babel-runtime/core-js/reflect/construct');

var _construct2 = _interopRequireDefault(_construct);

var _species = require('babel-runtime/core-js/symbol/species');

var _species2 = _interopRequireDefault(_species);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _extendableBuiltin5(cls) {
    function ExtendableBuiltin() {
        var instance = (0, _construct2.default)(cls, (0, _from2.default)(arguments));
        (0, _setPrototypeOf2.default)(instance, (0, _getPrototypeOf2.default)(this));
        return instance;
    }

    ExtendableBuiltin.prototype = (0, _create2.default)(cls.prototype, {
        constructor: {
            value: cls,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (_setPrototypeOf2.default) {
        (0, _setPrototypeOf2.default)(ExtendableBuiltin, cls);
    } else {
        ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
}

function _extendableBuiltin4(cls) {
    function ExtendableBuiltin() {
        var instance = (0, _construct2.default)(cls, (0, _from2.default)(arguments));
        (0, _setPrototypeOf2.default)(instance, (0, _getPrototypeOf2.default)(this));
        return instance;
    }

    ExtendableBuiltin.prototype = (0, _create2.default)(cls.prototype, {
        constructor: {
            value: cls,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (_setPrototypeOf2.default) {
        (0, _setPrototypeOf2.default)(ExtendableBuiltin, cls);
    } else {
        ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
}

function _extendableBuiltin3(cls) {
    function ExtendableBuiltin() {
        var instance = (0, _construct2.default)(cls, (0, _from2.default)(arguments));
        (0, _setPrototypeOf2.default)(instance, (0, _getPrototypeOf2.default)(this));
        return instance;
    }

    ExtendableBuiltin.prototype = (0, _create2.default)(cls.prototype, {
        constructor: {
            value: cls,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (_setPrototypeOf2.default) {
        (0, _setPrototypeOf2.default)(ExtendableBuiltin, cls);
    } else {
        ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
}

function _extendableBuiltin2(cls) {
    function ExtendableBuiltin() {
        var instance = (0, _construct2.default)(cls, (0, _from2.default)(arguments));
        (0, _setPrototypeOf2.default)(instance, (0, _getPrototypeOf2.default)(this));
        return instance;
    }

    ExtendableBuiltin.prototype = (0, _create2.default)(cls.prototype, {
        constructor: {
            value: cls,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (_setPrototypeOf2.default) {
        (0, _setPrototypeOf2.default)(ExtendableBuiltin, cls);
    } else {
        ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
}

function _extendableBuiltin(cls) {
    function ExtendableBuiltin() {
        var instance = (0, _construct2.default)(cls, (0, _from2.default)(arguments));
        (0, _setPrototypeOf2.default)(instance, (0, _getPrototypeOf2.default)(this));
        return instance;
    }

    ExtendableBuiltin.prototype = (0, _create2.default)(cls.prototype, {
        constructor: {
            value: cls,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

    if (_setPrototypeOf2.default) {
        (0, _setPrototypeOf2.default)(ExtendableBuiltin, cls);
    } else {
        ExtendableBuiltin.__proto__ = cls;
    }

    return ExtendableBuiltin;
}

const codes = require('./error-codes');

class RetryableError extends _extendableBuiltin(Error) {
    static get [_species2.default]() {
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

class UnretryableError extends _extendableBuiltin2(Error) {
    static get [_species2.default]() {
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

class DuplicateEventError extends _extendableBuiltin3(Error) {
    static get [_species2.default]() {
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

class TimeoutError extends _extendableBuiltin4(Error) {
    static get [_species2.default]() {
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

class AuthenticationError extends _extendableBuiltin5(Error) {
    static get [_species2.default]() {
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