'use strict';

var _ = require('lodash');

module.exports = function () {
    var pub = {};
    pub.lowestCorner = [];   // Array<Int> // polygon index -> corner index
    pub.watersheds = [];     //Array<Int>;  // polygon index -> corner index

    // We want to mark each polygon with the corner where water would
    // exit the island.
    pub.createWatersheds = function (map) {
        var s;

        // Find the lowest corner of the polygon, and set that as the
        // exit point for rain falling on this polygon
        _(map.centers).each(function (p) {
            s = null;
            _(p.corners).each(function (q) {
                if (s === null || q.elevation < s.elevation) {
                    s = q;
                }
            });
            pub.lowestCorner[p.index] = (s === null) ? -1 : s.index;
            pub.watersheds[p.index] = (s === null) ? -1 : (s.watershed === null) ? -1 : s.watershed.index;
        });
    };

    return pub;
};