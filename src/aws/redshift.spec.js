jest.mock('aws-sdk');
jest.unmock('./redshift');

const AWS = require('aws-sdk');

const redshift = require('./redshift');

const getClusterCredentialsPromiseFn = jest.fn();
const getClusterCredentialsFn = jest.fn(() => ({ promise: getClusterCredentialsPromiseFn }));


AWS.Redshift = jest.fn(() => ({
    getClusterCredentials: getClusterCredentialsFn
}));


const clearMocks = () => {
    getClusterCredentialsPromiseFn.mockClear();
    getClusterCredentialsFn.mockClear();
};

describe('get cluster credentials', () => {
    beforeEach(() => {
        clearMocks();
        AWS.Redshift.mockClear();
    });
    const clusterIdentifier = 'MOCK_CLUSTER_IDENTIFIER';
    const dbUser = 'MOCK_DB_USER';
    getClusterCredentialsPromiseFn.mockReturnValue({DbUser: 'MockDbUser', DbPassword: 'MockDbPassword', Expiration: new Date()});

    describe('creating new Redshift instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const {AWS_DEFAULT_REGION} = process.env;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await redshift.getClusterCredentials(clusterIdentifier, dbUser);
            expect(AWS.Redshift).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await redshift.getClusterCredentials(clusterIdentifier, dbUser, {}, userDefinedOptions);
            expect(AWS.Redshift).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await redshift.getClusterCredentials(clusterIdentifier, dbUser, {}, userDefinedOptions);
            expect(AWS.Redshift).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });

    });

    describe('calling AWS.Redshift.getClusterCredentials with expected params', () => {
        beforeEach(() => {
            clearMocks();
            AWS.Redshift.mockClear();
        });

        it('passes the default values for autoCreate and duration seconds if not provided by the user', async () => {
            const defaultDurationSeconds = 3600;
            const dbDefaultOptions = {
                AutoCreate: false,
                DurationSeconds: defaultDurationSeconds
            };
            await redshift.getClusterCredentials(clusterIdentifier, dbUser, {});

            expect(getClusterCredentialsFn).toBeCalledWith({ClusterIdentifier: clusterIdentifier, DbUser: dbUser, ...dbDefaultOptions});
        });

        it('passes user provided values for autoCreate and duration seconds', async () => {
            const durationSeconds = 3000;
            const dbOptions = {
                autoCreate: true,
                durationSeconds
            };
            const expctedDbOptions = {
                AutoCreate: true,
                DurationSeconds: durationSeconds
            };
            await redshift.getClusterCredentials(clusterIdentifier, dbUser, dbOptions);

            expect(getClusterCredentialsFn).toBeCalledWith({ClusterIdentifier: clusterIdentifier, DbUser: dbUser, ...expctedDbOptions});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            const defaultDurationSeconds = 3600;
            const dbDefaultOptions = {
                AutoCreate: false,
                DurationSeconds: defaultDurationSeconds
            };
            await redshift.getClusterCredentials(clusterIdentifier, dbUser, {}, {}, userDefinedParams);
            expect(getClusterCredentialsFn).toBeCalledWith({ClusterIdentifier: clusterIdentifier, DbUser: dbUser, ...dbDefaultOptions, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {DbUser: 'ANOTHER_MOCK_DB_USER'};
            const defaultDurationSeconds = 3600;
            const dbDefaultOptions = {
                AutoCreate: false,
                DurationSeconds: defaultDurationSeconds
            };
            await redshift.getClusterCredentials(clusterIdentifier, dbUser, {}, {}, userDefinedParams);
            expect(getClusterCredentialsFn).toBeCalledWith({ClusterIdentifier: clusterIdentifier, ...dbDefaultOptions, ...userDefinedParams});
        });
    });
});
