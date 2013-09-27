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