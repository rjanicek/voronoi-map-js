/* jshint camelcase:false */
'use strict';

var string = require('./string');

exports.should_test_string_that_starts_with_pattern = function (test) {
    test.strictEqual(string('beepboop').startsWith('beep'), true);
    test.done();
};