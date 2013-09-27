'use strict';

var matrix = require('./matrix');

exports.construct = function (test) {
    test.expect(2);
    
    var m = matrix(6, 6, 6, 6, 6, 6);

    test.ok(m);
    test.strictEqual(m.a, 6);

    test.done();
};

exports.clone = function (test) {

    var source = matrix(1, 1, 1, 1, 1, 1);
    var clone = source.clone();
    test.strictEqual(clone.toString(), source.toString());

    test.done();
};