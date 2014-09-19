/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var convert = require('./as3/conversion-core');
var core = require('./janicek/core');
var pc = require('./as3/point-core');
var prng = require('./janicek/pseudo-random-number-generators');

module.exports = function () {
    var pub = {};

    pub.path0 = []; // Array<Vector<Point>> // edge index -> Vector.<Point>
    pub.path1 = []; // Array<Vector<Point>> // edge index -> Vector.<Point>

    /**
     * Build noisy line paths for each of the Voronoi edges. There are
     * two noisy line paths for each edge, each covering half the
     * distance: path0 is from v0 to the midpoint and path1 is from v1
     * to the midpoint. When drawing the polygons, one or the other
     * must be drawn in reverse order.
     * @param noisyLineTradeoff low: jagged vedge; high: jagged dedge (default = 0.5)
     */
    pub.buildNoisyEdges = function (map, lava, seed, noisyLineTradeoff) {
        noisyLineTradeoff = core.def(noisyLineTradeoff, 0.5);
        var gen = prng.randomGenerator(seed, prng.nextParkMiller);
        _(map.centers).each(function (p) {
            _(p.borders).each(function (edge) {
                if (!core.isUndefinedOrNull(edge.d0) && !core.isUndefinedOrNull(edge.d1) && !core.isUndefinedOrNull(edge.v0) && !core.isUndefinedOrNull(edge.v1) && core.isUndefinedOrNull(pub.path0[edge.index])) {
                    var f = noisyLineTradeoff;
                    var t = pc.interpolate(edge.v0.point, edge.d0.point, f);
                    var q = pc.interpolate(edge.v0.point, edge.d1.point, f);
                    var r = pc.interpolate(edge.v1.point, edge.d0.point, f);
                    var s = pc.interpolate(edge.v1.point, edge.d1.point, f);

                    var minLength = 10;
                    if (edge.d0.biome !== edge.d1.biome) { minLength = 3; }
                    if (edge.d0.ocean && edge.d1.ocean) { minLength = 100; }
                    if (edge.d0.coast || edge.d1.coast)  { minLength = 1; }
                    if (convert.booleanFromInt(edge.river) || !core.isUndefinedOrNull(lava.lava[edge.index])) { minLength = 1; }
                    pub.path0[edge.index] = module.exports.buildNoisyLineSegments(gen(), edge.v0.point, t, edge.midpoint, q, minLength);
                    pub.path1[edge.index] = module.exports.buildNoisyLineSegments(gen(), edge.v1.point, s, edge.midpoint, r, minLength);
                }
            });
        });
    };

    return pub;
};

// Helper function: build a single noisy line in a quadrilateral A-B-C-D,
// and store the output points in a Vector.
module.exports.buildNoisyLineSegments = function (seed, A, B, C, D, minLength) {
    var gen = prng.randomGenerator(seed, prng.nextParkMiller);
    var points = []; // Vector<Point>
    
    // var limit = 10;
  
    function subdivide(A, B, C, D) {
        if (pc.distanceFromOrigin(pc.subtract(A, C)) < minLength || pc.distanceFromOrigin(pc.subtract(B, D)) < minLength) {
            return;
        }

        // Subdivide the quadrilateral
        var p = prng.toFloatRange(gen(), 0.2, 0.8); // vertical (along A-D and B-C)
        var q = prng.toFloatRange(gen(), 0.2, 0.8); // horizontal (along A-B and D-C)

        // Midpoints
        var E = pc.interpolate(A, D, p);
        
        var F = pc.interpolate(B, C, p);
        var G = pc.interpolate(A, B, q);
        var I = pc.interpolate(D, C, q);
        
        // Central point
        var H = pc.interpolate(E, F, q);
        
        // Divide the quad into subquads, but meet at H
        var s = 1.0 - prng.toFloatRange(gen(), -0.4, 0.4); //random.nextDoubleRange(-0.4, 0.4);
        var t = 1.0 - prng.toFloatRange(gen(), -0.4, 0.4); //random.nextDoubleRange(-0.4, 0.4);
        
        //if(limit-- > 0) {trace([p, q, s, t]);}
        
        subdivide(A, pc.interpolate(G, B, s), H, pc.interpolate(E, D, t));
        points.push(H);
        subdivide(H, pc.interpolate(F, C, s), C, pc.interpolate(I, D, t));
    }

    points.push(A);
    subdivide(A, B, C, D);
    points.push(C);
    return points;
};