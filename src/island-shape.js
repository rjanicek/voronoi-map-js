/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: false, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

/**
 * Factory class to build the 'inside' function that tells us whether
 * a point should be on the island or in the water.
 * 
 * This class has factory functions for generating islands of
 * different shapes. The factory returns a function that takes a
 * normalized point (x and y are -1 to +1) and returns true if the
 * point should be on the island, and false if it should be water
 * (lake or ocean).
 */

'use strict';

var array2d = require('./janicek/array2d');
var core = require('./janicek/core');
var distanceFromOrigin = require('./as3/point-core').distanceFromOrigin;
var perlinNoise = require('./janicek/perlin-noise');
var prngModule = require('./polygonal/pm-prng');
var prng = require('./janicek/pseudo-random-number-generators');

/**
* The radial island radius is based on overlapping sine waves 
* @param seed
* @param islandFactor = 1.0 means no small islands; 2.0 leads to a lot
*/
exports.makeRadial = function (seed, islandFactor) {
    islandFactor = core.def(islandFactor, 1.07);

    var islandRandom = prngModule();
    islandRandom.seed = seed;
    var bumps = islandRandom.nextIntRange(1, 6);
    var startAngle = islandRandom.nextDoubleRange(0, 2 * Math.PI);
    var dipAngle = islandRandom.nextDoubleRange(0, 2 * Math.PI);
    var dipWidth = islandRandom.nextDoubleRange(0.2, 0.7);

    function inside(q) {
        var angle = Math.atan2(q.y, q.x);
        var length = 0.5 * (Math.max(Math.abs(q.x), Math.abs(q.y)) + distanceFromOrigin(q));

        var r1 = 0.5 + 0.40 * Math.sin(startAngle + bumps * angle + Math.cos((bumps + 3) * angle));
        var r2 = 0.7 - 0.20 * Math.sin(startAngle + bumps * angle - Math.sin((bumps + 2) * angle));
        if (Math.abs(angle - dipAngle) < dipWidth ||
            Math.abs(angle - dipAngle + 2 * Math.PI) < dipWidth ||
            Math.abs(angle - dipAngle - 2 * Math.PI) < dipWidth) {
            r1 = r2 = 0.2;
        }
        return  (length < r1 || (length > r1 * islandFactor && length < r2));
    }

    return inside;
};

/**
 * The Perlin-based island combines perlin noise with the radius.
 * @param   seed
 * @param   oceanRatio 0 = least ocean, 1 = most ocean
 */
exports.makePerlin = function (seed, oceanRatio) {
    oceanRatio = core.def(oceanRatio, 0.5);

    var landRatioMinimum = 0.1;
    var landRatioMaximum = 0.5;
    oceanRatio = ((landRatioMaximum - landRatioMinimum) * oceanRatio) + landRatioMinimum;  //min: 0.1 max: 0.5
    var perlin = array2d(perlinNoise.makePerlinNoise(256, 256, 1.0, 1.0, 1.0, seed, 8));
    //perlin.perlinNoise(64, 64, 8, seed, false, true); //mapgen2

    return function (q) {
        var c = (perlin.get(core.toInt((q.x + 1) * 128), core.toInt((q.y + 1) * 128)) & 0xff) / 255.0;
        //var c:Number = (perlin.getPixel(Std.int((q.x+1)*128), Std.int((q.y+1)*128)) & 0xff) / 255.0; //mapgen2
        return c > (oceanRatio + oceanRatio * distanceFromOrigin(q) * distanceFromOrigin(q));
    };
};

/**
 * The square shape fills the entire space with land
 */
exports.makeSquare = function () {
    return function (q) {
        return true;
    };
};

/**
* The blob island is shaped like Amit's blob logo
*/
exports.makeBlob = function () {
    return function (q) {
        var eye1 = distanceFromOrigin({ x: q.x - 0.2, y: q.y / 2 + 0.2 }) < 0.05;
        var eye2 = distanceFromOrigin({ x: q.x + 0.2, y: q.y / 2 + 0.2 }) < 0.05;
        var body = distanceFromOrigin(q) < 0.8 - 0.18 * Math.sin(5 * Math.atan2(q.y, q.x));
        return body && !eye1 && !eye2;
    };
};

/**
 * Make island from bitmap.
 * @param {[[boolean]]} bitmap
 */
exports.makeBitmap = function (bitmap) {
    bitmap = array2d(bitmap);
    var dimensions = bitmap.dimensions();
    return function (q) {
        var x = core.toInt(((q.x + 1) / 2) * dimensions.x);
        var y = core.toInt(((q.y + 1) / 2) * dimensions.y);
        return bitmap.get(x, y);
    };
};

/**
 * Make island from simple noise.
 */
exports.makeNoise = function (seed) {
    return function (q) {
        seed = prng.nextParkMiller(seed);
        return prng.toBool(seed);
    };
};