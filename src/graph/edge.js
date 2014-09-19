/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = function () {
    return {
        index: 0,
        d0: null,  // Delaunay edge
        d1: null,  // Delaunay edge
        v0: null,  // Voronoi edge
        v1: null,  // Voronoi edge
        midpoint: null,  // halfway between v0,v1
        river: 0  // volume of water, or 0
    };
};