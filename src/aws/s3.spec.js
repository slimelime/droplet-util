jest.mock('aws-sdk');
jest.unmock('./s3');

const MemoryStream = require('memorystream');
const AWS = require('aws-sdk');

const s3 = require('./s3');

/** The only place where AWS.S3.* should be mocked explicitly,
 * other AWS.* members would be mocked using similar boilerplate
 * */

const headBucketPromiseFn = jest.fn();
const headBucketFn = jest.fn(() => ({ promise: headBucketPromiseFn }));
const copyObjectPromiseFn = jest.fn();
const copyObjectFn = jest.fn(() => ({ promise: copyObjectPromiseFn }));
const createBucketPromiseFn = jest.fn();
const createBucketFn = jest.fn(() => ({promise: createBucketPromiseFn}));
const deleteObjectPromiseFn = jest.fn();
const deleteObjectFn = jest.fn(() => ({ promise: deleteObjectPromiseFn }));
const getBucketLocationPromiseFn = jest.fn();
const getBucketLocationFn = jest.fn(() => ({ promise: getBucketLocationPromiseFn }));
const getBucketPolicyPromiseFn = jest.fn();
const getBucketPolicyFn = jest.fn(() => ({ promise: getBucketPolicyPromiseFn }));
const getObjectPromiseFn = jest.fn();
const getObjectCreateReadStreamFn = jest.fn();
const getObjectFn = jest.fn(() => ({
    promise: getObjectPromiseFn,
    createReadStream: getObjectCreateReadStreamFn
}));
const headObjectPromiseFn = jest.fn();
const headObjectFn = jest.fn(() => ({ promise: headObjectPromiseFn }));
const putBucketEncryptionPromiseFn = jest.fn();
const putBucketEncryptionFn = jest.fn(() => ({ promise: putBucketEncryptionPromiseFn }));
const putBucketPolicyPromiseFn = jest.fn();
const putBucketPolicyFn = jest.fn(() => ({ promise: putBucketPolicyPromiseFn }));
const putBucketVersioningPromiseFn = jest.fn();
const putBucketVersioningFn = jest.fn(() => ({ promise: putBucketVersioningPromiseFn }));
const uploadPromiseFn = jest.fn();
const uploadFn = jest.fn(() => ({promise: uploadPromiseFn}));
const getBucketNotificationConfigurationPromiseFn = jest.fn();
const getBucketNotificationConfigurationFn = jest.fn(() => ({promise: getBucketNotificationConfigurationPromiseFn}));
const putBucketNotificationConfigurationPromiseFn = jest.fn();
const putBucketNotificationConfigurationFn = jest.fn(() => ({promise: putBucketNotificationConfigurationPromiseFn}));

AWS.S3 = jest.fn(() => ({
    copyObject: copyObjectFn,
    createBucket: createBucketFn,
    deleteObject: deleteObjectFn,
    getBucketLocation: getBucketLocationFn,
    getBucketPolicy: getBucketPolicyFn,
    getObject: getObjectFn,
    headObject: headObjectFn,
    headBucket: headBucketFn,
    putBucketEncryption: putBucketEncryptionFn,
    putBucketPolicy: putBucketPolicyFn,
    putBucketVersioning: putBucketVersioningFn,
    upload: uploadFn,
    getBucketNotificationConfiguration: getBucketNotificationConfigurationFn,
    putBucketNotificationConfiguration: putBucketNotificationConfigurationFn
}));

const clearMocks = () => {
    headBucketPromiseFn.mockClear();
    headBucketFn.mockClear();
    copyObjectPromiseFn.mockClear();
    copyObjectFn.mockClear();
    createBucketPromiseFn.mockClear();
    createBucketFn.mockClear();
    deleteObjectPromiseFn.mockClear();
    deleteObjectFn.mockClear();
    getBucketLocationPromiseFn.mockClear();
    getBucketLocationFn.mockClear();
    getBucketPolicyPromiseFn.mockClear();
    getBucketPolicyFn.mockClear();
    getObjectPromiseFn.mockClear();
    getObjectCreateReadStreamFn.mockClear();
    getObjectFn.mockClear();
    headObjectPromiseFn.mockClear();
    headObjectFn.mockClear();
    putBucketEncryptionPromiseFn.mockClear();
    putBucketEncryptionFn.mockClear();
    putBucketPolicyPromiseFn.mockClear();
    putBucketPolicyFn.mockClear();
    putBucketVersioningPromiseFn.mockClear();
    putBucketVersioningFn.mockClear();
    uploadPromiseFn.mockClear();
    uploadFn.mockClear();
    getBucketNotificationConfigurationPromiseFn.mockClear();
    getBucketNotificationConfigurationFn.mockClear();
    putBucketNotificationConfigurationPromiseFn.mockClear();
    putBucketNotificationConfigurationFn.mockClear();
    AWS.S3.mockClear();
};

describe('bucketExist', () => {
    const bucket = 'bucket';

    beforeEach(() => {
        clearMocks();
    });

    it('returns true if bucket exists', async () => {
        headBucketPromiseFn.mockReturnValueOnce(Promise.resolve({}));
        expect(await s3.bucketExist(bucket)).toBe(true);
    });

    it('returns false if error code is [NotFound]', async () => {
        const error = new Error();
        error.code = 'NotFound';
        headBucketPromiseFn.mockReturnValueOnce(Promise.reject(error));

        expect(await s3.bucketExist(bucket)).toBe(false);
    });

    it('throws error if error code is not [NotFound]', async () => {
        const error = new Error();
        headBucketPromiseFn.mockReturnValueOnce(Promise.reject(error));

        try {
            await s3.bucketExist(bucket);
        } catch (e) {
            expect(e).toEqual(error);
        }
    });
});

describe('copyObject', () => {
    const Bucket = 'MOCK_BUCKET';
    const Key = 'MOCK_KEY';
    const CopySource = 'SOURCE_BUCKET/SOURCE_KEY';
    copyObjectPromiseFn.mockReturnValue(Promise.resolve({CopyObjectResult: {LastModified: Date.now()}}));

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            copyObjectFn.mockClear();
            copyObjectPromiseFn.mockClear();
            AWS.S3.mockClear();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.copyObject(Bucket, Key, CopySource);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.copyObject(Bucket, Key, CopySource, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.copyObject(Bucket, Key, CopySource, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.S3().copyObject with expected params', () => {
        beforeEach(() => {
            copyObjectPromiseFn.mockClear();
            copyObjectFn.mockClear();
        });

        it('passes required params', async () => {
            await s3.copyObject(Bucket, Key, CopySource);
            expect(copyObjectFn).toBeCalledWith({Bucket, Key, CopySource});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.copyObject(Bucket, Key, CopySource, {}, userDefinedParams);
            expect(copyObjectFn).toBeCalledWith({Bucket, Key, CopySource, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {
                Bucket: 'ANOTHER_MOCK_BUCKET',
                Key: 'ANOTHER_MOCK_KEY',
                CopySource: 'ANOTHER_MOCK_TARGET_BUCKET/ANOTHER_MOCK_KEY'
            };
            await s3.copyObject(Bucket, Key, CopySource, {}, userDefinedParams);
            expect(copyObjectFn).toBeCalledWith(userDefinedParams);
        });
    });
});

describe('createBucket', () => {
    const Bucket = 'mock-bucket';

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.createBucket(Bucket);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.createBucket(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.createBucket(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.S3().createBucket with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await s3.createBucket(Bucket);
            expect(createBucketFn).toBeCalledWith({Bucket});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.createBucket(Bucket, {}, userDefinedParams);
            expect(createBucketFn).toBeCalledWith({Bucket, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {Bucket: 'ANOTHER_MOCK_BUCKET', CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.createBucket(Bucket, {}, userDefinedParams);
            expect(createBucketFn).toBeCalledWith(userDefinedParams);
        });
    });
});

describe('deleteObject', () => {
    const Bucket = 'MOCK_BUCKET';
    const Key = 'MOCK_KEY';
    deleteObjectPromiseFn.mockReturnValue(Promise.resolve({}));

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            deleteObjectFn.mockClear();
            deleteObjectPromiseFn.mockClear();
            AWS.S3.mockClear();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.deleteObject(Bucket, Key);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.deleteObject(Bucket, Key, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.deleteObject(Bucket, Key, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.S3().deleteObject with expected params', () => {
        beforeEach(() => {
            deleteObjectPromiseFn.mockClear();
            deleteObjectFn.mockClear();
        });

        it('passes required params', async () => {
            await s3.deleteObject(Bucket, Key);
            expect(deleteObjectFn).toBeCalledWith({Bucket, Key});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.deleteObject(Bucket, Key, {}, userDefinedParams);
            expect(deleteObjectFn).toBeCalledWith({Bucket, Key, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {
                Bucket: 'ANOTHER_MOCK_BUCKET',
                Key: 'ANOTHER_MOCK_KEY'
            };
            await s3.deleteObject(Bucket, Key, {}, userDefinedParams);
            expect(deleteObjectFn).toBeCalledWith(userDefinedParams);
        });
    });
});

describe('getBucketLocation', () => {
    const Bucket = 'MOCK_BUCKET';
    const expectedLocationConstraint = 'MOCK_LocationConstraint';
    getBucketLocationPromiseFn.mockReturnValue(Promise.resolve({LocationConstraint: expectedLocationConstraint}));

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            getBucketLocationPromiseFn.mockClear();
            getBucketLocationFn.mockClear();
            AWS.S3.mockClear();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            const {LocationConstraint} = await s3.getBucketLocation(Bucket);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            const {LocationConstraint} = await s3.getBucketLocation(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            const {LocationConstraint} = await s3.getBucketLocation(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });

    });

    describe('calling AWS.S3().getBucketLocation with expected params', () => {
        beforeEach(() => {
            getBucketLocationPromiseFn.mockClear();
            getBucketLocationFn.mockClear();
        });

        it('passes required params', async () => {
            const {LocationConstraint} = await s3.getBucketLocation(Bucket);
            expect(getBucketLocationFn).toBeCalledWith({Bucket});
            expect(LocationConstraint).toEqual(expectedLocationConstraint);
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            const {LocationConstraint} = await s3.getBucketLocation(Bucket, {}, userDefinedParams);
            expect(getBucketLocationFn).toBeCalledWith({Bucket, ...userDefinedParams});
            expect(LocationConstraint).toEqual(expectedLocationConstraint);
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {Bucket: 'ANOTHER_MOCK_BUCKET'};
            const {LocationConstraint} = await s3.getBucketLocation(Bucket, {}, userDefinedParams);
            expect(getBucketLocationFn).toBeCalledWith(userDefinedParams);
            expect(LocationConstraint).toEqual(expectedLocationConstraint);
        });
    });
});

describe('getBucketPolicy', () => {
    const Bucket = 'mock-bucket';

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.getBucketPolicy(Bucket);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.getBucketPolicy(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.getBucketPolicy(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });

        it('return empty policy string when error.code equal [NoSuchBucketPolicy]', async () => {
            const error = new Error('mock-error');
            error.code = 'NoSuchBucketPolicy';
            getBucketPolicyPromiseFn.mockReturnValueOnce(Promise.reject(error));

            const result = await s3.getBucketPolicy(Bucket);
            expect(result).toEqual({Policy: '{}'});
        });
    });

    describe('calling AWS.S3().getBucketPolicy with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await s3.getBucketPolicy(Bucket);
            expect(getBucketPolicyFn).toBeCalledWith({Bucket});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.getBucketPolicy(Bucket, {}, userDefinedParams);
            expect(getBucketPolicyFn).toBeCalledWith({Bucket, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {Bucket: 'ANOTHER_MOCK_BUCKET', CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.getBucketPolicy(Bucket, {}, userDefinedParams);
            expect(getBucketPolicyFn).toBeCalledWith(userDefinedParams);
        });
    });
});

describe('getObject', () => {
    const Bucket = 'MOCK_BUCKET';
    const Key = 'MOCK_KEY';
    const expectedBody = 'MOCK_Body';
    getObjectPromiseFn.mockReturnValue(Promise.resolve({Body: expectedBody}));

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            getObjectPromiseFn.mockClear();
            getObjectFn.mockClear();
            AWS.S3.mockClear();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            const {Body} = await s3.getObject(Bucket, Key);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            const {Body} = await s3.getObject(Bucket, Key, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            const {Body} = await s3.getObject(Bucket, Key, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });

    });

    describe('calling AWS.S3().getObject with expected params', () => {
        beforeEach(() => {
            getObjectPromiseFn.mockClear();
            getObjectFn.mockClear();
        });

        it('passes required params', async () => {
            const {Body} = await s3.getObject(Bucket, Key);
            expect(getObjectFn).toBeCalledWith({Bucket, Key});
            expect(Body).toEqual(expectedBody);
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            const {Body} = await s3.getObject(Bucket, Key, {}, userDefinedParams);
            expect(getObjectFn).toBeCalledWith({Bucket, Key, ...userDefinedParams});
            expect(Body).toEqual(expectedBody);
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {Bucket: 'ANOTHER_MOCK_BUCKET', Key: 'ANOTHER_MOCK_KEY'};
            const {Body} = await s3.getObject(Bucket, Key, {}, userDefinedParams);
            expect(getObjectFn).toBeCalledWith(userDefinedParams);
            expect(Body).toEqual(expectedBody);
        });
    });
});

describe('getObjectReadStream', () => {
    const Bucket = 'MOCK_BUCKET';
    const Key = 'MOCK_KEY';
    const expectedBody = 'MOCK_Body';
    getObjectCreateReadStreamFn.mockImplementation(() => MemoryStream.createReadStream(expectedBody));

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            getObjectCreateReadStreamFn.mockClear();
            AWS.S3.mockClear();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', () => {
            const readStream = s3.getObjectReadStream(Bucket, Key);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            const readStream = s3.getObjectReadStream(Bucket, Key, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            const readStream = s3.getObjectReadStream(Bucket, Key, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });

    });

    describe('calling AWS.S3().getObjectReadStream with expected params', () => {
        beforeEach(() => {
            getObjectFn.mockClear();
        });

        it('passes required params', (done) => {
            const writeStream = MemoryStream.createWriteStream();
            const readStream = s3.getObjectReadStream(Bucket, Key);
            expect(getObjectFn).toBeCalledWith({Bucket, Key});
            readStream
                .pipe(writeStream)
                .on('finish', () => {
                    expect(writeStream.toString()).toEqual(expectedBody);
                    done();
                });
        });

        it('passes user defined params', (done) => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            const writeStream = MemoryStream.createWriteStream();
            const readStream = s3.getObjectReadStream(Bucket, Key, {}, userDefinedParams);
            expect(getObjectFn).toBeCalledWith({Bucket, Key, ...userDefinedParams});
            readStream
                .pipe(writeStream)
                .on('finish', () => {
                    expect(writeStream.toString()).toEqual(expectedBody);
                    done();
                });
        });

        it('favours user defined params', (done) => {
            const userDefinedParams = {Bucket: 'ANOTHER_MOCK_BUCKET', Key: 'ANOTHER_MOCK_KEY'};
            const writeStream = MemoryStream.createWriteStream();
            const readStream = s3.getObjectReadStream(Bucket, Key, {}, userDefinedParams);
            expect(getObjectFn).toBeCalledWith(userDefinedParams);
            readStream
                .pipe(writeStream)
                .on('finish', () => {
                    expect(writeStream.toString()).toEqual(expectedBody);
                    done();
                });
        });
    });
});

describe('moveObject', () => {
    const fromBucket = 'MOCK_FROM_BUCKET';
    const fromKey = 'MOCK_FROM_KEY';
    const toBucket = 'MOCK_TO_BUCKET';
    const toKey = 'MOCK_TO_KEY';
    const copySource = `${fromBucket}/${fromKey}`;
    copyObjectPromiseFn.mockReturnValue(Promise.resolve({CopyObjectResult: {LastModified: Date.now()}}));
    deleteObjectPromiseFn.mockReturnValue(Promise.resolve({}));

    describe('calling AWS.S3().copyObject and AWS.S3().deleteObject with expected params', () => {
        beforeEach(() => {
            deleteObjectPromiseFn.mockClear();
            deleteObjectFn.mockClear();
            copyObjectPromiseFn.mockClear();
            copyObjectFn.mockClear();
        });

        it('passes required params', async () => {
            await s3.moveObject(fromBucket, fromKey, toBucket, toKey);
            expect(copyObjectFn).toBeCalledWith({Bucket: toBucket, Key: toKey, CopySource: copySource, ServerSideEncryption: 'AES256'});
            expect(deleteObjectFn).toBeCalledWith({Bucket: fromBucket, Key: fromKey});
        });
    });
});

describe('objectExists', () => {
    const bucket = 'bucket';
    const key = 'key';

    it('returns true if metadata exists', async () => {
        headObjectPromiseFn.mockReturnValue(Promise.resolve({}));

        const result = await s3.objectExists({ bucket, key });

        expect(result).toBe(true);
    });

    it('returns false if getting metadata fails', async () => {
        headObjectPromiseFn.mockReturnValue(Promise.reject(new Error('404')));

        const result = await s3.objectExists({ bucket, key });

        expect(result).toBe(false);
    });
});

describe('putBucketEncryption', () => {
    const Bucket = 'mock-bucket';

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.putBucketEncryption(Bucket);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.putBucketEncryption(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.putBucketEncryption(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.S3().putBucketEncryption with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await s3.putBucketEncryption(Bucket);
            expect(putBucketEncryptionFn).toBeCalledWith(expect.objectContaining({Bucket}));
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.putBucketEncryption(Bucket, {}, userDefinedParams);
            expect(putBucketEncryptionFn).toBeCalledWith(expect.objectContaining({Bucket, ...userDefinedParams}));
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {Bucket: 'ANOTHER_MOCK_BUCKET', Policy: 'abc', CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.putBucketEncryption(Bucket, {}, userDefinedParams);
            expect(putBucketEncryptionFn).toBeCalledWith(expect.objectContaining(userDefinedParams));
        });
    });
});

describe('putBucketPolicy', () => {
    const Bucket = 'mock-bucket';
    const Policy = JSON.stringify({});

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.putBucketPolicy(Bucket, Policy);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.putBucketPolicy(Bucket, Policy, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.putBucketPolicy(Bucket, Policy, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.S3().putBucketPolicy with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await s3.putBucketPolicy(Bucket, Policy);
            expect(putBucketPolicyFn).toBeCalledWith({Bucket, Policy});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.putBucketPolicy(Bucket, Policy, {}, userDefinedParams);
            expect(putBucketPolicyFn).toBeCalledWith({Bucket, Policy, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {Bucket: 'ANOTHER_MOCK_BUCKET', Policy: 'abc', CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.putBucketPolicy(Bucket, Policy, {}, userDefinedParams);
            expect(putBucketPolicyFn).toBeCalledWith(userDefinedParams);
        });
    });
});

describe('putBucketVersioning', () => {
    const Bucket = 'mock-bucket';
    const mfaDeleteEnabled = true;
    const versioningEnabled = true;
    const VersioningConfiguration = {
        MFADelete: "Enabled",
        Status: "Enabled"
    };

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.putBucketVersioning(Bucket, mfaDeleteEnabled, versioningEnabled);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.putBucketVersioning(Bucket, mfaDeleteEnabled, versioningEnabled, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.putBucketVersioning(Bucket, mfaDeleteEnabled, versioningEnabled, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.S3().putBucketVersioning with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await s3.putBucketVersioning(Bucket, mfaDeleteEnabled, versioningEnabled);
            expect(putBucketVersioningFn).toBeCalledWith({Bucket, VersioningConfiguration});
        });

        it('passes user defined params', async () => {
            const userDefinedParams = {CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.putBucketVersioning(Bucket, mfaDeleteEnabled, versioningEnabled, {}, userDefinedParams);
            expect(putBucketVersioningFn).toBeCalledWith({Bucket, VersioningConfiguration, ...userDefinedParams});
        });

        it('favours user defined params', async () => {
            const userDefinedParams = {Bucket: 'ANOTHER_MOCK_BUCKET', VersioningConfiguration: {}, CUSTOM_KEY: 'CUSTOM_VALUE'};
            await s3.putBucketVersioning(Bucket, mfaDeleteEnabled, versioningEnabled, {}, userDefinedParams);
            expect(putBucketVersioningFn).toBeCalledWith(userDefinedParams);
        });
    });
});

describe('upload', () => {
    const bucketName = 'Bucket';
    const prefix = 'Prefix';
    const stream = { mock: 'streamObject' };

    describe('calling AWS.S3().upload with expected params', () => {
        beforeEach(() => {
            clearMocks();
            AWS.S3.mockClear();
        });

        it('passes required params (defaulting SSE correctly)', async () => {
            await s3.upload(bucketName, prefix, stream);
            expect(uploadFn).toHaveBeenCalledWith({
                Bucket: bucketName,
                Key: prefix,
                Body: stream,
                ServerSideEncryption: 'AES256'
            });
        });

        it('ServerSideEncryption can be overridden', async () => {
            // SSE is a parameter for S3.upload (rather than an option for the S3 instance).
            const ServerSideEncryption = 'SSE';
            await s3.upload(bucketName, prefix, stream, {}, { ServerSideEncryption });
            expect(uploadFn).toHaveBeenCalledWith({
                Bucket: bucketName,
                Key: prefix,
                Body: stream,
                ServerSideEncryption
            });
        });
    });
});

describe('getBucketNotificationConfiguration', () => {
    const Bucket = 'Bucket';

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.getBucketNotificationConfiguration(Bucket);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.getBucketNotificationConfiguration(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.getBucketNotificationConfiguration(Bucket, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.S3().getBucketNotificationConfiguration with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await s3.getBucketNotificationConfiguration(Bucket);
            expect(getBucketNotificationConfigurationFn).toBeCalledWith({Bucket});
        });
    });
});

describe('putBucketNotificationConfiguration', () => {
    const Bucket = 'Bucket';
    const NotificationConfiguration = {
        TopicConfigurations: [],
        QueueConfigurations: [],
        LambdaFunctionConfigurations: []
    };

    describe('creating new S3 instance constructor', () => {
        const regionDefaultOption = 'MOCK_DEFAULT_REGION';
        const AWS_DEFAULT_REGION = process.env.AWS_DEFAULT_REGION;

        beforeEach(() => {
            clearMocks();
            process.env.AWS_DEFAULT_REGION = regionDefaultOption;
        });

        afterEach(() => {
            process.env.AWS_DEFAULT_REGION = AWS_DEFAULT_REGION;
        });

        it('passes default options', async () => {
            await s3.putBucketNotificationConfiguration(Bucket, NotificationConfiguration);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption}));
        });

        it('passes user defined options', async () => {
            const userDefinedOptions = {CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.putBucketNotificationConfiguration(Bucket, NotificationConfiguration, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining({region: regionDefaultOption, ...userDefinedOptions}));
        });

        it('favours user defined options', async () => {
            const userDefinedOptions = {region: 'CUSTOM_VALUE', CUSTOM_KEY: 'CUSTOM_VALUE'};

            await s3.putBucketNotificationConfiguration(Bucket, NotificationConfiguration, userDefinedOptions);
            expect(AWS.S3).toBeCalledWith(expect.objectContaining(userDefinedOptions));
        });
    });

    describe('calling AWS.S3().putBucketNotificationConfiguration with expected params', () => {
        beforeEach(() => {
            clearMocks();
        });

        it('passes required params', async () => {
            await s3.putBucketNotificationConfiguration(Bucket, NotificationConfiguration);
            expect(putBucketNotificationConfigurationFn).toBeCalledWith({Bucket, NotificationConfiguration});
        });
    });
});
