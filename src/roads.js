/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var core = require('./janicek/core');

module.exports = function () {
    var pub = {};

    // The road array marks the edges that are roads.  The mark is 1,
    // 2, or 3, corresponding to the three contour levels. Note that
    // these are sparse arrays, only filled in where there are roads.
    pub.road = []; // Array<Int> // edge index -> int contour level
    pub.roadConnections = []; // Array<Array<Edge>>  // center index -> array of Edges with roads

    // We want to mark different elevation zones so that we can draw
    // island-circling roads that divide the areas.
    pub.createRoads = function (map, elevationThresholds) {
        // Oceans and coastal polygons are the lowest contour zone
        // (1). Anything connected to contour level K, if it's below
        // elevation threshold K, or if it's water, gets contour level
        // K.  (2) Anything not assigned a contour level, and connected
        // to contour level K, gets contour level K+1.
        var queue = []; // Array<Center>
        var p, newLevel;
        //var elevationThresholds = [0, 0.05, 0.37, 0.64];
        var cornerContour = []; // Array<Int> // corner index -> int contour level
        var centerContour = []; //:Array<Int> // center index -> int contour level
    
        _(map.centers).each(function (p) {
            if (p.coast || p.ocean) {
                centerContour[p.index] = 1;
                queue.push(p);
            }
        });
      
        while (queue.length > 0) {
            p = queue.shift();
            for (var neighborIndex = 0; neighborIndex < p.neighbors.length; neighborIndex++) {
                var r = p.neighbors[neighborIndex];
                newLevel = core.coalesce(centerContour[p.index], 0);
                while (r.elevation > elevationThresholds[newLevel] && !r.water) {
                    // NOTE: extend the contour line past bodies of
                    // water so that roads don't terminate inside lakes.
                    newLevel += 1;
                }
                if (newLevel < core.coalesce(centerContour[r.index], 999)) {
                    centerContour[r.index] = newLevel;
                    queue.push(r);
                }
            }
        }

        // A corner's contour level is the MIN of its polygons
        _(map.centers).each(function (p) {
            _(p.corners).each(function (q) {
                cornerContour[q.index] = core.toInt(Math.min(core.coalesce(cornerContour[q.index], 999), core.coalesce(centerContour[p.index], 999)));
            });
        });

        // Roads go between polygons that have different contour levels
        _(map.centers).each(function (p) {
            _(p.borders).each(function (edge) {
                if (!_.isNull(edge.v0) && !_.isNull(edge.v1) && cornerContour[edge.v0.index] !== cornerContour[edge.v1.index]) {
                    pub.road[edge.index] = core.toInt(Math.min(cornerContour[edge.v0.index], cornerContour[edge.v1.index]));
                    if (core.isUndefinedOrNull(pub.roadConnections[p.index])) {
                        pub.roadConnections[p.index] = [];
                    }
                    pub.roadConnections[p.index].push(edge);
                }
            });
        });
    };

    return pub;
};