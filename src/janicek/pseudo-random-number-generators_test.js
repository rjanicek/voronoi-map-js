/* jshint camelcase:false */

'use strict';

var _ = require('lodash');
var prng = require('./pseudo-random-number-generators');

exports.should_make_a_non_deterministic_random_seed = function (test) {
    test.ok(_(prng.makeRandomSeed()).isNumber());
    test.done();
};

exports.should_generate_a_random_int_using_Park_Miller_algorithm = function (test) {
    var seed = 1;
    var original = seed;
    seed = prng.nextParkMiller(seed);
    test.notEqual(seed, original);
    test.done();
};

exports.should_generate_the_same_Park_Miller_sequence_on_every_machine = function (test) {
    var seed = 1;
    var length = 1000;
    
    var step;
    for (step = 0; step < length; step++) {
        seed = prng.nextParkMiller(seed);
    }
    
    test.strictEqual(seed, 522329230);

    test.done();
};

exports.should_generate_a_statistically_even_Park_Miller_distribution = function (test) {
    var seed = 1;
    var total = 0.0;
    var length = 1000;
    
    var step;
    for (step = 0; step < length; step++) {
        seed = prng.nextParkMiller(seed);
        total += prng.toFloat(seed);
    }
    
    test.ok((total / length) > 0.45);
    test.ok((total / length) < 0.55);

    test.done();
};

exports.should_generate_the_same_LCG_sequence = function (test) {
    var seed = 1;
    var length = 1000;
    var step;
    for (step = 0; step < length; step++) {
        seed = prng.nextLCG(seed);
    }
    
    test.strictEqual(seed, 1157381547);

    test.done();
};

exports.should_generate_an_even_LCG_distribution = function (test) {
    var seed = 1;
    var total = 0.0;
    var length = 1000;
    var step;
    for (step = 0; step < length; step++) {
        seed = prng.nextLCG(seed);
        total += prng.toFloat(seed);
    }
    
    test.ok((total / length) > 0.45);
    test.ok((total / length) < 0.55);

    test.done();
};

exports.should_convert_random_seed_to_a_Float_value_between_0_and_1 = function (test) {
    var num = prng.toFloat(prng.nextParkMiller(1));
    test.ok(_(num).isNumber());
    test.ok(num >= 0 && num <= 1);
    test.done();
};

exports.should_convert_random_seed_to_a_boolean_value = function (test) {
    var result = prng.toBool(prng.nextParkMiller(1));
    test.ok(_(result).isBoolean());
    test.done();
};

exports.should_generate_an_int_in_range = function (test) {
    var iterations = 100;
    var seed = 1;
    var step;
    for (step = 0; step < iterations; step++) {
        seed = prng.nextParkMiller(seed);
        test.ok(prng.toIntRange(seed, 0, 10) > -1);
        test.ok(prng.toIntRange(seed, 0, 10) < 11);
    }
    test.done();
};

exports.should_generate_a_float_in_range = function (test) {
    var iterations = 100;
    var seed = 1;
    var step;
    for (step = 0; step < iterations; step++) {
        seed = prng.nextParkMiller(seed);
        test.ok(prng.toFloatRange(seed, 0.0, 1.0) > -0.1);
        test.ok(prng.toFloatRange(seed, 0.0, 1.0) < 1.1);
    }
    test.done();
};

exports.should_convert_a_string_to_a_seed = function (test) {
    var result = prng.stringToSeed('random seed');
    test.ok(_(result).isNumber());
    test.done();
};

exports.should_make_random_numbers_using_an_algorithm = function (test) {
    var gen = prng.randomGenerator(1, prng.nextParkMiller);
    var a = gen();
    test.ok(_(a).isNumber());
    var b = gen();
    test.notEqual(a, b);
    test.done();
};