/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: false, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var pointCore = require('./point-core');

exports.compute_distance_from_origin = function (test) {
    test.strictEqual(pointCore.distanceFromOrigin({x : 1, y : 0}), 1);
    test.done();
};

exports.compute_distance_between_two_points = function (test) {
    test.strictEqual(pointCore.distance({x: 0, y: 0}, {x: 1, y: 0}), 1);
    test.done();
};

exports.should_interpolate_points = function (test) {

    var a = { x: 0.0, y: 0.0 };
    var b = { x: 1.0, y: 1.0 };

    var i = pointCore.interpolate(a, b, 0.5);
    test.strictEqual(i.x, 0.5);
    test.strictEqual(i.y, 0.5);

    i = pointCore.interpolate(a, b, 0.0);
    test.strictEqual(i.x, 1);
    test.strictEqual(i.y, 1);

    i = pointCore.interpolate(a, b, 1.0);
    test.strictEqual(i.x, 0);
    test.strictEqual(i.y, 0);

    test.done();
};