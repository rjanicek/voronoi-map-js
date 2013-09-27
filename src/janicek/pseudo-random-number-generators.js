/* jshint bitwise:false */

'use strict';

var hash = require('./hash');

/**
 * (a Mersenne prime M31) modulus constant = 2^31 - 1 = 0x7ffffffe
 */
var MPM = 2147483647.0;

/**
 * (a primitive root modulo M31)
 */
var MINSTD = 16807.0;

/**
 * Make a non deterministic random seed using standard libraries.
 * @return Non deterministic random seed.
 */
exports.makeRandomSeed = function () {
    return Math.floor(Math.random() * MPM);
};

/**
 * Park-Miller-Carta algorithm.
 * @see <a href="http://lab.polygonal.de/?p=162">http://lab.polygonal.de/?p=162</a>
 * @see <a href="http://code.google.com/p/polygonal/source/browse/trunk/src/lib/de/polygonal/core/math/random/ParkMiller.hx?r=547">http://code.google.com/p/polygonal/source/browse/trunk/src/lib/de/polygonal/core/math/random/ParkMiller.hx?r=547</a> 
 * @see <a href="http://en.wikipedia.org/wiki/Lehmer_random_number_generator">http://en.wikipedia.org/wiki/Lehmer_random_number_generator</a>
 * @return Returns the next pseudo-random int value.
 */
exports.nextParkMiller = function (seed) {
    return (seed * MINSTD) % MPM;
};

/**
 * <p>A Park-Miller-Carta PRNG (pseudo random number generator).</p>
 * <p>Integer implementation, using only 32 bit integer maths and no divisions.</p>
 * @see <a href="https://github.com/polygonal/core/blob/dev/src/de/polygonal/core/math/random/ParkMiller31.hx">POLYGONAL - A HAXE LIBRARY FOR GAME DEVELOPERS</a>
 * @see <a href="http://www.firstpr.com.au/dsp/rand31/rand31-park-miller-carta.cc.txt" target="_blank">http://www.firstpr.com.au/dsp/rand31/rand31-park-miller-carta.cc.txt</a>
 * @see <a href="http://en.wikipedia.org/wiki/Park%E2%80%93Miller_random_number_generator" target="_blank">Park-Miller random number generator</a>.
 * @see <a href="http://lab.polygonal.de/?p=162" target="_blank">A good Pseudo-Random Number Generator (PRNG)</a>.
 */
exports.nextParkMiller31 = function (seed) {
    var lo = 16807 * (seed & 0xffff);
    var hi = 16807 * (seed >>> 16);
    lo += (hi & 0x7fff) << 16;
    lo += hi >>> 15;
    if (lo > 0x7fffffff) { lo -= 0x7fffffff; }
    return lo;
};

/**
 * Linear congruential generator using GLIBC constants.
 * 
 * @see <a href="http://en.wikipedia.org/wiki/Linear_congruential_generator">http://en.wikipedia.org/wiki/Linear_congruential_generator</a>
 * @see <a href="https://github.com/aduros/flambe/blob/master/src/flambe/util/Random.hx">https://github.com/aduros/flambe/blob/master/src/flambe/util/Random.hx</a>
 * @return Returns an integer in [0, INT_MAX)
 */
exports.nextLCG = function (seed) {
    // These constants borrowed from glibc
    // Force float multiplication here to avoid overflow in Flash (and keep parity with JS)
    return (1103515245.0 * seed + 12345) % MPM;
};

/**
 * Returns the pseudo-random double value x in the range 0 <= x < 1.
 */
exports.toFloat = function (seed) {
    return seed / MPM;
};

/**
 * Returns a pseudo-random boolean value (coin flip).
 */
exports.toBool = function (seed) {
    return exports.toFloat(seed) > 0.5;
};

/**
 * Returns a pseudo-random double value x in the range min <= x <= max.
 */
exports.toFloatRange = function (seed, min, max) {
    return min + (max - min) * exports.toFloat(seed);
};

/**
 * Returns a pseudo-random integral value x in the range min <= x <= max.
 */
exports.toIntRange = function (seed, min, max) {
    return Math.round((min - 0.4999) + ((max + 0.4999) - (min - 0.4999)) * exports.toFloat(seed));
};

/**
 * Converts a string to a seed.
 * Lets you use words as seeds.
 */
exports.stringToSeed = function (s) {
    return hash.djb2(s) % MPM;
};

/**
 * Closure for tracking random number state.
 * @param   seed
 * @param   algorithm
 */
exports.randomGenerator = function (seed, nextRandomNumberAlgorithm) {
    return function () {
        seed = nextRandomNumberAlgorithm(seed);
        return seed;
    };
};