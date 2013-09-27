'use strict';

var _ = require('lodash');

exports.average = function (numbers) {
    return _.reduce(numbers, function (total, number) {
        return total + number;
    }) / _.size(numbers);
};

/**
 * clamp a Float to an interval
 * interval endpoints are compared to get min and max, so it doesn't matter what order they are passed in
 * @param   value value to clamp
 * @param   minOrMax1 interval endpoint
 * @param   minOrMax2 interval endpoint
 * @return  clamped value to given interval
 */
exports.clamp = function (value, minOrMax1, minOrMax2) {
    var min = Math.min(minOrMax1, minOrMax2);
    var max = Math.max(minOrMax1, minOrMax2);
    return value < min ? min : value > max ? max : value;
};