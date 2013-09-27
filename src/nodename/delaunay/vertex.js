/* jshint es3:false */

'use strict';

var _pool = [];
var _nvertices = 0;

var Vertex = function (x, y) {
    this.init(x, y);
};

Vertex.prototype = {
    _coord: null,

    get coord() { return this._coord; },

    vertexIndex: 0,

    init: function (x, y) {
        this._coord = {x: x, y: y};
        return this;
    },

    dispose: function () {
        this._coord = null;
        _pool.push(this);
    },

    setIndex: function () {
        this.vertexIndex = _nvertices++;
    },

    toString: function () {
        return 'Vertex (' + this.vertexIndex + ')';
    },

    get x() {
        return this._coord.x;
    },

    get y() {
        return this._coord.y;
    }

};

function create(x, y) {
    if (isNaN(x) || isNaN(y)) {
        return exports.VERTEX_AT_INFINITY;
    }
    if (_pool.length > 0) {
        return _pool.pop().init(x, y);
    } else {
        return new Vertex(x, y);
    }
}

exports.VERTEX_AT_INFINITY = new Vertex(NaN, NaN);

/**
 * This is the only way to make a Vertex
 * 
 * @param halfedge0
 * @param halfedge1
 * @return 
 * 
 */
exports.intersect = function (halfedge0, halfedge1) {
    var voronoi = require('./voronoi');
    var lr = require('./lr');

    var edge0, edge1, edge;
    var halfedge;
    var determinant, intersectionX, intersectionY;
    var rightOfSite;

    edge0 = halfedge0.edge;
    edge1 = halfedge1.edge;
    if (edge0 === null || edge1 === null) {
        return null;
    }
    if (edge0.rightSite === edge1.rightSite) {
        return null;
    }

    determinant = edge0.a * edge1.b - edge0.b * edge1.a;
    if (-1.0e-10 < determinant && determinant < 1.0e-10) {
        // the edges are parallel
        return null;
    }

    intersectionX = (edge0.c * edge1.b - edge1.c * edge0.b) / determinant;
    intersectionY = (edge1.c * edge0.a - edge0.c * edge1.a) / determinant;

    //if (Voronoi.isInfSite(edge0.rightSite, edge1.rightSite))  //HxDelaunay
    if (voronoi.compareSiteByYThenX(edge0.rightSite, edge1.rightSite) < 0) {
        halfedge = halfedge0;
        edge = edge0;
    } else {
        halfedge = halfedge1;
        edge = edge1;
    }
    rightOfSite = intersectionX >= edge.rightSite.x;
    if ((rightOfSite && halfedge.leftRight === lr.LEFT) ||
        (!rightOfSite && halfedge.leftRight === lr.RIGHT)) {
        return null;
    }
    return create(intersectionX, intersectionY);
};