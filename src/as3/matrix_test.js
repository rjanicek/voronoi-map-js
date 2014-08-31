/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

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