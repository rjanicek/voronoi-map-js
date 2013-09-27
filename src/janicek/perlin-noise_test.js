'use strict';

var _ = require('lodash');
var perlinNoise = require('./perlin-noise');

exports.makePerlinNoise = function (test) {
    var noise = perlinNoise.makePerlinNoise(100, 100, 1.0, 1.0, 1.0);
    test.ok(_(noise).isArray());
    test.done();
};