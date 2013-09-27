/* jshint camelcase:false */

'use strict';

var m = require('./math');

exports.should_calculate_average_from_array_of_numbers = function (test) {
    test.strictEqual(m.average([0.0, 0.5, 1]), 0.5);
    test.strictEqual(m.average([1, 2, 3]), 2);
    test.done();
};

exports.should_clamp_a_number_to_an_interval = function (test) {
    test.strictEqual(m.clamp(1.0, 1.0, 1.0), 1.0);
    test.strictEqual(m.clamp(1.0, 1.0, 2.0), 1.0);
    test.strictEqual(m.clamp(1.0, 0.0, 1.0), 1.0);
    test.strictEqual(m.clamp(1.0, 0.0, 2.0), 1.0);
    test.strictEqual(m.clamp(1.0, 2.0, 2.0), 2.0);
    test.strictEqual(m.clamp(1.0, 2.0, 1.0), 1.0);
    test.done();
};