'use strict';

const _ = require('lodash');

// same problem space as https://developer.mozilla.org/en-US/docs/Web/API/TimeRanges

class LineRanges {
    constructor() {
        this.ranges = [];
        this.minRangeStart = 1;
    }

    get length() {
        return this.ranges.length;
    }

    start(lineNumber) {
        if (lineNumber < this.minRangeStart) {
            throw new Error(`Unknown range [${lineNumber}] < min ranges start [${this.minRangeStart}]`);
        }
        const index = _.sortedIndexBy(this.ranges, { lineNumber }, item => item.lineNumber);
        let lineRange = { lineNumber: 1, byteRangeStart: -1, byteRangeEnd: -1 };
        if (index === this.ranges.length) {
            lineRange = this.ranges.slice(-1).pop(); // caller should check for equality and if not, uses that last known marker information for further skipping until reaching desired lineNumber
        } else {
            const _lineRange = this.ranges[index];
            // this is where this range should fit, but it might not be a match if we have a gap (after compact or if set() has been used with jumps in the lineNumber)
            if (lineNumber === _lineRange.lineNumber) {
                lineRange = _lineRange;
            } else if (this.ranges[index - 1]) {
                lineRange = this.ranges[index - 1]; // the line you requested is in a previous range, here is the start, go skip/take and figure
            } // else you get {lineNumber: 1, byteRangeStart: 0, byteRangeEnd: 0}
        }
        return lineRange;
    }

    set(lineNumber, byteRangeStart, byteRangeEnd) {
        this.ranges.push({ lineNumber, byteRangeStart, byteRangeEnd });
    }

    compact(before) {

        /**
         * NOTE: line numbers are assumed to be one-based, while index is zero-based
         */
        const index = _.sortedIndexBy(this.ranges, { lineNumber: before }, item => item.lineNumber);
        this.ranges.splice(0, index);
        this.minRangeStart = before;
    }
}

module.exports = { LineRanges };