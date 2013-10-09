/* jshint camelcase:false */

'use strict';

var canvas = require('./canvas');

exports.should_invert_a_bitmap = function (test) {
    test.deepEqual(canvas.invertBitmap([[true, false]]), [[false, true]]);
    test.done();
};