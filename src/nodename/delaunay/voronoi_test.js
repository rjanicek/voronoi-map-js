/* jshint camelcase:false */

'use strict';

var _ = require('lodash');
var voronoi = require('./voronoi');
var prng = require('../../janicek/pseudo-random-number-generators');
var rectangle = require('../../as3/rectangle');

exports.should_make_voronoi = function (test) {

    var gen = prng.randomGenerator(1, prng.nextParkMiller);
    var points = [];
    for (var i = 0; i < 5; i++) {
        var x = prng.toFloatRange(gen(), 1, 99);
        var y = prng.toFloatRange(gen(), 1, 99);
        var p = { x: x, y: y };
        points.push(p);
    }
    
    var v = voronoi.make(points, null, rectangle(0, 0, 100, 100));
    test.ok(v);
    _(v.edges()).each(function (edge) {
        // console.log([edge.a, edge.b, edge.c]);
    });
    test.done();
};