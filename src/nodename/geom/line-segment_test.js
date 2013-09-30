'use strict';

var lineSegment = require('./line-segment');

var e0 = lineSegment({x: 0, y: 0}, {x: 1, y: 1});
var e1 = lineSegment({x: 0, y: 0}, {x: 2, y: 2});

exports.compareLengthsMax = function (test) {
    test.strictEqual(lineSegment.core.compareLengthsMax(e0, e1), 1);
    test.done();
};

exports.compareLengths = function (test) {
    test.strictEqual(lineSegment.core.compareLengths(e0, e1), -1);
    test.done();
};