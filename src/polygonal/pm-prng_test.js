/* jshint camelcase:false */

'use strict';

var prng = require('./pm-prng')();

exports.should_make_floats_in_range = function (test) {
    var d = prng.nextDoubleRange(-0.4, 0.4);
    test.ok(d >= -1);
    test.ok(d <= 1);
    test.done();
};