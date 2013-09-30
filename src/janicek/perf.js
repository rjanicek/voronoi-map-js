'use strict';

var _ = require('lodash');

exports.counters = {};

exports.bumpCounter = function (counter) {
    if (!exports.counters[counter]) {
        exports.counters[counter] = 0;
    }
    exports.counters[counter]++;
};

exports.traceCounters = function () {
    _.each(exports.counters, function (counter, key) {
        console.log(key, counter);
    });
};