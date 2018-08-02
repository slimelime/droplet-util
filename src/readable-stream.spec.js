const MemoryStream = require('memorystream');

const collections = require('./collections');
const readableStream = require('./readable-stream');

function* incrementalGenerator(take = 10) {
    let i = 1;
    while (i <= take) {
        yield {id: i};
        i++;
    }
}

async function* incrementalGeneratorAsync(take = 10) {
    let i = 1;
    while (i <= take) {
        yield {id: i};
        i++;
    }
}

async function* incrementalBatchesAsync() {
    yield collections.iterator([{id: 1}, {id: 2}],
        {
            metadata: collections.lazy({
                "ConsumedCapacity": {
                    "TableName": "SirenCommandExecutionStateTest",
                    "CapacityUnits": 2
                }
            })
        });
    yield collections.iterator([{id: 3}, {id: 4}, {id: 5}, {id: 6}, {id: 7}],
        {
            metadata: collections.lazy({
                "ConsumedCapacity": {
                    "TableName": "SirenCommandExecutionStateTest",
                    "CapacityUnits": 5
                }
            })
        });
    yield collections.iterator([{id: 8}, {id: 9}, {id: 10}],
        {
            metadata: collections.lazy({
                "ConsumedCapacity": {
                    "TableName": "SirenCommandExecutionStateTest",
                    "CapacityUnits": 3
                }
            })
        });
}

describe('readable-stream', () => {
    const defaultOptions = {objectMode: true};
    const expectedData = [...incrementalGenerator()];

    it('converts a generator to a readable stream', done => {
        const memoryWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
        const readStream = readableStream.fromGenerator(incrementalGenerator(), defaultOptions);
        readStream
            .pipe(memoryWriteStream)
            .on('error', error => done.fail(error))
            .on('finish', () => {
                try {
                    expect(memoryWriteStream.queue).toEqual(expectedData);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            });
    });

    it('converts an async generator to a readable stream', done => {
        const memoryWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
        const readStream = readableStream.fromAsyncGenerator(incrementalGeneratorAsync(), defaultOptions);
        readStream
            .pipe(memoryWriteStream)
            .on('error', error => done.fail(error))
            .on('finish', () => {
                try {
                    expect(memoryWriteStream.queue).toEqual(expectedData);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            });
    });

    it('converts an async generator of batches to a readable stream, throttles batches using Consumed Capacity in penalty mode', async done => {
        const memoryWriteStream = MemoryStream.createWriteStream(null, {objectMode: true});
        const readStream = readableStream.fromAsyncGeneratorOfBatches(incrementalBatchesAsync(),
            {
                ...defaultOptions,
                rate: 5,
                interval: 'second',
                burst: 1,
                consumedCapacityUnits: ({ConsumedCapacity: {CapacityUnits}}) => CapacityUnits
            });
        readStream
            .pipe(memoryWriteStream)
            .on('error', error => done.fail(error))
            .on('finish', () => {
                try {
                    expect(memoryWriteStream.queue).toEqual(expectedData);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            });
    });

    it('converts an async generator of batches in an RX.Subject, throttles batches using Consumed Capacity in penalty mode', async done => {
        const actualData = [];
        const throttled$ = readableStream.throttledStreamFromAsyncGeneratorOfBatches(incrementalBatchesAsync(),
            {
                ...defaultOptions,
                rate: 5,
                interval: 'second',
                burst: 1,
                consumedCapacityUnits: ({ConsumedCapacity: {CapacityUnits}}) => CapacityUnits
            });

        throttled$.subscribe(
            value => actualData.push(value),
            error => done.fail(error),
            () => {
                try {
                    expect(actualData).toEqual(expectedData);
                    done();
                } catch (error) {
                    done.fail(error);
                }
            });
    });
});
