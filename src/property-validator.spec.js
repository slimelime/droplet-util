'use strict';

jest.disableAutomock();

const propertyValidator = require('./property-validator');

describe('When given an object with all required properties', () => {

    const OBJECT_TO_VALIDATE = {
        YOU_NEED_ME_1: 'And I am here 1',
        YOU_NEED_ME_2: 'And I am here 2'
    };

    const REQUIRED_PROPERTIES = ['YOU_NEED_ME_1', 'YOU_NEED_ME_2'];

    describe('and hasRequiredProperties is called', () => {

        let result;
        beforeEach(() => {
            result = propertyValidator.hasRequiredProperties(OBJECT_TO_VALIDATE, REQUIRED_PROPERTIES);
        });

        it('can determine that the object has the required properties', () => {
            expect(result).toBeTruthy();
        });

    });

    describe('and getMissingProperties is called', () => {

        let result;
        beforeEach(() => {
            result = propertyValidator.getMissingProperties(OBJECT_TO_VALIDATE, REQUIRED_PROPERTIES);
        });

        it('can determine that there are no missing properties', () => {
            expect(result).toEqual([]);
        });

    });

});

describe('When given an object that is missing some required properties', () => {

    const OBJECT_TO_VALIDATE = {
        YOU_NEED_ME_1: 'And I am here 1'
    };

    const REQUIRED_PROPERTIES = ['YOU_NEED_ME_1', 'YOU_NEED_ME_2'];

    describe('and hasRequiredProperties is called', () => {

        let result;
        beforeEach(() => {
            result = propertyValidator.hasRequiredProperties(OBJECT_TO_VALIDATE, REQUIRED_PROPERTIES);
        });

        it('can determine that the object is missing some required properties', () => {
            expect(result).toBeFalsy();
        });

    });

    describe('and getMissingProperties is called', () => {

        let result;
        beforeEach(() => {
            result = propertyValidator.getMissingProperties(OBJECT_TO_VALIDATE, REQUIRED_PROPERTIES);
        });

        it('can determine the specific properties that are missing', () => {
            expect(result).toEqual(['YOU_NEED_ME_2']);
        });

    });

});

describe('ensureEnvironmentVariables', () => {
    const VAR1 = 'ensureEnvironmentVariables_1';
    const VAR2 = 'ensureEnvironmentVariables_2';
    const MISSING_VAR1 = 'missing_ensureEnvironmentVariables_1';
    const MISSING_VAR2 = 'missing_ensureEnvironmentVariables_2';

    beforeEach(() => {
        process.env[VAR1] = VAR1;
        process.env[VAR2] = VAR2;
    });

    afterEach(() => {
        delete process.env[VAR1];
        delete process.env[VAR2];
    });

    it('returns an object with environment variables keys/values', () => {
        const envVars = propertyValidator.ensureEnvironmentVariables(VAR1, VAR2);
        expect(envVars).toEqual({[VAR1]: VAR1, [VAR2]: VAR2 });
    });

    it('throws an Error with a list of missing variables in the message', () => {
        try {
            propertyValidator.ensureEnvironmentVariables(VAR1, MISSING_VAR1, VAR2, MISSING_VAR2);
        } catch (err) {
            expect(err.message).toEqual(expect.stringContaining(`${[MISSING_VAR1, MISSING_VAR2]}`));
        }
    });
});

describe('ensureObjectProperties', () => {
    it('returns empty string', () => {
        const OBJECT_TO_VALIDATE = {
            YOU_NEED_ME_1: 'And I am here 1',
            YOU_NEED_ME_2: 'And I am here 2',
            YOU_NEED_ME_3: 'And I am here 3'
        };

        const REQUIRED_PROPERTIES = ['YOU_NEED_ME_1', 'YOU_NEED_ME_2', 'YOU_NEED_ME_3'];

        const envVars = propertyValidator.ensureObjectProperties(OBJECT_TO_VALIDATE, REQUIRED_PROPERTIES);
        expect(envVars).toEqual('');
    });

    it('throws an Error with a list of missing properties in the message', () => {
        const OBJECT_TO_VALIDATE = {
            YOU_NEED_ME_1: 'And I am here 1'
        };

        const REQUIRED_PROPERTIES = ['YOU_NEED_ME_1', 'YOU_NEED_ME_2', 'YOU_NEED_ME_3'];

        expect.assertions(1);
        try {
            propertyValidator.ensureObjectProperties(OBJECT_TO_VALIDATE, REQUIRED_PROPERTIES);
        } catch (err) {
            expect(err.message).toEqual(expect.stringContaining('YOU_NEED_ME_2,YOU_NEED_ME_3'));
        }
    });
});
