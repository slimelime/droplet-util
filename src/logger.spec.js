'use strict';

const logger = require('./logger');

describe('The logger', () => {

    beforeEach(() => {
        console.log = jest.fn();
        console.error = jest.fn();
    });

    describe('logging a single line of text', () => {

        beforeEach(() => {
            logger.log("Test text");
        });

        it('logs the text', () => {
            expect(console.log).toBeCalledWith("Test text");
        });

    });

    describe('logging a set of arguments', () => {

        beforeEach(() => {
            logger.log("Test text", "Another test", "Test 3");
        });

        it('logs the arguments', () => {
            expect(console.log).toBeCalledWith("Test text", "Another test", "Test 3");
        });

    });

    describe('logging a set of non-string arguments', () => {

        const strMessage = 'Test text';
        const shallowMessage = {message: "Another test"};
        const deepMessage = {message: {deepMesssage: "Test 3"}};

        beforeEach(() => {
            logger.log(strMessage, shallowMessage, deepMessage);
            logger.error(strMessage, shallowMessage, deepMessage);
        });

        it('serializes and logs the arguments', () => {
            expect(console.log).toBeCalledWith(strMessage, JSON.stringify(shallowMessage, null, 4), JSON.stringify(deepMessage, null, 4));
        });

        it('serializes and logs the error arguments', () => {
            expect(console.error).toBeCalledWith("Error:", strMessage, JSON.stringify(shallowMessage, null, 4), JSON.stringify(deepMessage, null, 4));
        });

    });

    describe('recording a failure', () => {

        beforeEach(() => {
            logger.error("Test text", "Another test", "Test 3");
        });

        it('reports an error with the arguments', () => {
            expect(console.error).toBeCalledWith("Error:", "Test text", "Another test", "Test 3");
        });

    });

});
