jest.mock('aws-sdk');
jest.unmock('./s3');

const AWS = require('aws-sdk');
const s3 = require('./s3');
const MemoryStream = require('memorystream');

/** The only place where AWS.S3.* should be mocked explicitly,
 * other AWS.* members would be mocked using similar boilerplate
 * */

const getBucketLocationPromiseFn = jest.fn();
const getBucketLocationFn = jest.fn();

getBucketLocationFn.mockImplementation(() => ({
    promise: getBucketLocationPromiseFn
}));

const getObjectPromiseFn = jest.fn();
const getObjectCreateReadStreamFn = jest.fn();
const getObjectFn = jest.fn();

getObjectFn.mockImplementation(() => ({
    promise: getObjectPromiseFn,
    createReadStream: getObjectCreateReadStreamFn
}));

const copyObjectFn = jest.fn();
const copyObjectPromiseFn = jest.fn();

copyObjectFn.mockImplementation(() => ({
    promise: copyObjectPromiseFn
}));

const deleteObjectFn = jest.fn();
const deleteObjectPromiseFn = jest.fn();

deleteObjectFn.mockImplementation(() => ({
    promise: deleteObjectPromiseFn
}));

const headObjectPromiseFn = jest.fn();
const headObjectFn = jest.fn(() => ({ promise: headObjectPromiseFn }));

AWS.S3 = jest.fn();
AWS.S3.mockImplementation(() => ({
    getBucketLocation: getBucketLocationFn,
    getObject: getObjectFn,
    copyObject: copyObjectFn,
    deleteObject: deleteObjectFn,
    headObject: headObjectFn
}));

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
