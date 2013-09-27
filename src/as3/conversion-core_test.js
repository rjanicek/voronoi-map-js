'use strict';

var convert = require('./conversion-core');

exports.should_make_int_from_boolean = function (test) {
    
    test.strictEqual(convert.intFromBoolean(true), 1);
    test.strictEqual(convert.intFromBoolean(false), 0);
    test.strictEqual(convert.intFromBoolean(null), 0);

    test.done();
};

exports.should_make_boolean_from_int = function (test) {
    
    test.strictEqual(convert.booleanFromInt(0), false);
    test.strictEqual(convert.booleanFromInt(1), true);
    test.strictEqual(convert.booleanFromInt(2), true);
    test.strictEqual(convert.booleanFromInt(null), false);

    test.done();
};