'use strict';

var pointCore = require('../../as3/point-core');

module.exports = function (p0, p1) {
    return {
        p0: p0,
        p1: p1
    };
};

module.exports.core = {
    compareLengthsMax: function (segment0, segment1) {
        var length0 = pointCore.distance(segment0.p0, segment0.p1);
        var length1 = pointCore.distance(segment1.p0, segment1.p1);
        if (length0 < length1) {
            return 1;
        }
        if (length0 > length1) {
            return -1;
        }
        return 0;
    },

    compareLengths: function (edge0, edge1) {
        return - this.compareLengthsMax(edge0, edge1);
    }
};