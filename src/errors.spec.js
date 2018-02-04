'use strict';

const {UnretryableError} = require('./errors');

describe('UnretryableError', () => {

    const theError = new UnretryableError('This is the message');

    it('has the message with which it was created', () => {
        expect(theError.message).toEqual('This is the message');
    });

    it('extends the standard error class', () => {
        expect(theError instanceof Error).toBeTruthy();
    });

});
