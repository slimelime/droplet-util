const _ = require('lodash');
const {LineRanges} = require('./streams-line-ranges');
const logger = require('./logger');

describe('LineRanges', () => {
    describe('populated by contiguous line ranges', () => {
        let lineRanges;
        const lineSize = 100;
        const lineNumberRangeEnd = 10;
        beforeEach(() => {
            lineRanges = new LineRanges();
            _.range(1, lineNumberRangeEnd + 1)
                .reduce((acc, lineNumber, index) => {
                    const previousLineRange = acc[index - 1] || {lineNumber: 1, byteRangeStart: 0, byteRangeEnd: 0};
                    const byteRangeStart = previousLineRange.byteRangeEnd;
                    acc.push({
                        lineNumber,
                        byteRangeStart,
                        // byteRangeEnd: byteRangeStart + Math.floor(Math.random() * 100)
                        byteRangeEnd: byteRangeStart + lineSize
                    });
                    return acc;
                }, lineRanges.ranges);
        });

        it('returns the lineRange for a given lineNumber', () => {
            const lineNumber = _.random(1, lineNumberRangeEnd);
            const lineRange = lineRanges.start(lineNumber);
            expect(lineRange.lineNumber).toEqual(lineNumber);
            expect(lineRange.byteRangeStart).toEqual((lineNumber - 1) * (lineSize));
            expect(lineRange.byteRangeEnd).toEqual(((lineNumber - 1) * (lineSize)) + lineSize);
        });

        it('returns `last known range` for a lineNumber > max line number stored', () => {
            const lineNumber = lineNumberRangeEnd + 1;
            const lineRange = lineRanges.start(lineNumber);
            expect(lineRange.lineNumber).toEqual(lineNumberRangeEnd);
            expect(lineRange.byteRangeStart).toEqual((lineNumberRangeEnd - 1) * (lineSize));
            expect(lineRange.byteRangeEnd).toEqual(((lineNumberRangeEnd - 1) * (lineSize)) + lineSize);
        });

        it('performs compaction on demand by dropping array chunk [0-(lineNumber - 1)]', () => {
            const lineNumber = 5;
            expect(lineRanges.ranges.length).toEqual(lineNumberRangeEnd);
            lineRanges.compact(lineNumber);
            expect(lineRanges.ranges.length).toEqual(lineNumberRangeEnd - lineNumber + 1);
            expect(lineRanges.ranges[0].lineNumber).toEqual(lineNumber);
        });

        it('after compaction, queries for missing low range error out', () => {
            const lineNumber = 5;
            expect(lineRanges.ranges.length).toEqual(lineNumberRangeEnd);
            lineRanges.compact(lineNumber);
            expect(lineRanges.ranges.length).toEqual(lineNumberRangeEnd - lineNumber + 1);
            expect(lineRanges.ranges[0].lineNumber).toEqual(lineNumber);

            expect(() => lineRanges.start(1)).toThrow(`Unknown range [1] < min ranges start [${lineNumber}]`);
            expect(() => lineRanges.start(lineNumber - 1)).toThrow(`Unknown range [${lineNumber - 1}] < min ranges start [${lineNumber}]`);
        });
    });

    describe('populated by line ranges with gaps', () => {
        let lineRanges;
        const lineSize = 100;
        const lineNumberRangeEnd = 100;
        const gapSize = 10;
        beforeEach(() => {
            lineRanges = new LineRanges();
            _.range(1, lineNumberRangeEnd + 1)
                .filter(num => !(num % 10))
                .reduce((acc, lineNumber, index) => {
                    const previousLineRange = acc[index - 1] || {lineNumber: 1, byteRangeStart: 0, byteRangeEnd: 0};
                    // const byteRangeStart = previousLineRange.byteRangeEnd + 1;
                    const gap = lineNumber - previousLineRange.lineNumber;
                    const byteRangeStart = previousLineRange.byteRangeStart + (gap * (lineSize));
                    acc.push({
                        lineNumber,
                        byteRangeStart,
                        // byteRangeEnd: byteRangeStart + Math.floor(Math.random() * 100)
                        byteRangeEnd: byteRangeStart + lineSize
                    });
                    return acc;
                }, lineRanges.ranges);
        });

        it('returns the lineRange for a given `existing` lineNumber', () => {
            // const lineNumber = Math.floor((Math.random() * ((lineNumberRangeEnd / gapSize) - 1)) + 1) * gapSize;
            const lineNumber = _.random(1, gapSize) * gapSize;
            const lineRange = lineRanges.start(lineNumber);
            expect(lineRange.lineNumber).toEqual(lineNumber);
            expect(lineRange.byteRangeStart).toEqual((lineNumber - 1) * (lineSize));
            expect(lineRange.byteRangeEnd).toEqual(((lineNumber - 1) * (lineSize)) + lineSize);
        });

        it('returns the immediate lower known lineRange for a given lineNumber that might be in the gap', () => {
            // const lineNumber = Math.floor((Math.random() * ((lineNumberRangeEnd / gapSize) - 1)) + 1) * gapSize;
            const lineNumber = _.random(1, lineNumberRangeEnd);
            const lineRange = lineRanges.start(lineNumber);
            // logger.log(lineNumber, lineRange);
            expect(lineRange.lineNumber).toBeLessThanOrEqual(lineNumber);
            expect(lineRange.byteRangeStart).toBeLessThanOrEqual((lineNumber - 1) * (lineSize));
            expect(lineRange.byteRangeEnd).toBeLessThanOrEqual(((lineNumber - 1) * (lineSize)) + lineSize);
        });

        it('returns `last known range` for a lineNumber > max line number stored', () => {
            const lineNumber = lineNumberRangeEnd + 1;
            const lineRange = lineRanges.start(lineNumber);
            expect(lineRange.lineNumber).toEqual(lineNumberRangeEnd);
            expect(lineRange.byteRangeStart).toEqual((lineNumberRangeEnd - 1) * (lineSize));
            expect(lineRange.byteRangeEnd).toEqual(((lineNumberRangeEnd - 1) * (lineSize)) + lineSize);
        });

        it('performs compaction on demand by dropping array chunk [0-(lineNumber - 1)]', () => {
            const lineNumber = _.random(1, gapSize) * gapSize;
            expect(lineRanges.ranges.length).toEqual(lineNumberRangeEnd / gapSize);
            lineRanges.compact(lineNumber);
            expect(lineRanges.ranges.length).toEqual(((lineNumberRangeEnd - lineNumber) / gapSize) + 1);
            expect(lineRanges.ranges[0].lineNumber).toEqual(lineNumber);
        });

        it('after compaction, queries for missing low range error out', () => {
            const lineNumber = _.random(1, gapSize) * gapSize;
            expect(lineRanges.ranges.length).toEqual(lineNumberRangeEnd / gapSize);
            lineRanges.compact(lineNumber);
            expect(lineRanges.ranges.length).toEqual(((lineNumberRangeEnd - lineNumber) / gapSize) + 1);
            expect(lineRanges.ranges[0].lineNumber).toEqual(lineNumber);

            expect(() => lineRanges.start(1)).toThrow(`Unknown range [1] < min ranges start [${lineNumber}]`);
            expect(() => lineRanges.start(lineNumber - 1)).toThrow(`Unknown range [${lineNumber - 1}] < min ranges start [${lineNumber}]`);
        });
    });

});
