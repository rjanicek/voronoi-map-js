/* jshint es3:false */

'use strict';

var lineSegment = require('../geom/line-segment');
var lr = require('./lr');
var pointCore = require('../../as3/point-core');
var rectangle = require('../../as3/rectangle');

var _pool = [];
var _nedges = 0;

exports.Edge = function () {
    this._edgeIndex = _nedges++;
    this.init();
};

exports.Edge.prototype = {
    _delaunayLineBmp: null,
    getDelaunayLineBmp: function () {
        if (this._delaunayLineBmp === null) {
            this._delaunayLineBmp = this.makeDelaunayLineBmp();
        }
        return this._delaunayLineBmp;
    },
    get delaunayLineBmp() { return this.getDelaunayLineBmp(); },

    // making this available to Voronoi; running out of memory in AIR so I cannot cache the bmp
    makeDelaunayLineBmp: function () {
        throw 'unimplemented';
        
        var p0 = this.leftSite.coord;
        var p1 = this.rightSite.coord;
        
        var w = Math.ceil(Math.max(p0.x, p1.x));
        if (w < 1) {
            w = 1;
        }
        var h = Math.ceil(Math.max(p0.y, p1.y));
        if (h < 1) {
            h = 1;
        }
        //var bmp:BitmapData = new BitmapData(w, h, true, 0);
        var bmp = new BitmapData();

        //GRAPHICS.clear();
        // clear() resets line style back to undefined!
        //GRAPHICS.lineStyle(0, 0, 1.0, false, LineScaleMode.NONE, CapsStyle.NONE);
        //GRAPHICS.moveTo(p0.x, p0.y);
        //GRAPHICS.lineTo(p1.x, p1.y);
        
        bmp.drawLine(p0, p1);
        
        //bmp.draw(LINESPRITE);
        return bmp;
    },

    delaunayLine: function () {
        // draw a line connecting the input Sites for which the edge is a bisector:
        return lineSegment(this.leftSite.coord, this.rightSite.coord);
    },

    voronoiEdge: function () {
        if (!this.visible) {
            return lineSegment(null, null);
        }
        return lineSegment(this.clippedEnds[lr.LEFT], this.clippedEnds[lr.RIGHT]);
    },

    // the equation of the edge: ax + by = c
    a: null,
    b: null,
    c: null,

    // the two Voronoi vertices that the edge connects
    //      (if one of them is null, the edge extends to infinity)
    leftVertex: null,
    rightVertex: null,

    vertex: function (leftRight) {
        return (leftRight === lr.LEFT) ? this.leftVertex : this.rightVertex;
    },

    setVertex: function (leftRight, v) {
        if (leftRight === lr.LEFT) {
            this.leftVertex = v;
        } else {
            this.rightVertex = v;
        }
    },

    isPartOfConvexHull: function () {
        return (this.leftVertex === null || this.rightVertex === null);
    },

    sitesDistance: function () {
        return pointCore.distance(this.leftSite.coord, this.rightSite.coord);
    },

    // Once clipVertices() is called, this Dictionary will hold two Points
    // representing the clipped coordinates of the left and right ends...
    //private var _clippedVertices:Dictionary;
    clippedEnds: null, // Dictionary<Point>

    // unless the entire Edge is outside the bounds.
    // In that case visible will be false:
    get visible() { return this.clippedEnds !== null; },

    // the two input Sites for which this Edge is a bisector:
    //private var _sites:Dictionary<Site>;
    // the two input Sites for which this Edge is a bisector:               
    leftSite: null,
    rightSite: null,

    site: function (leftRight) {
        return (leftRight === lr.LEFT) ? this.leftSite : this.rightSite;
    },

    _edgeIndex: 0,

    dispose: function () {
        if (this._delaunayLineBmp !== null) {
            this._delaunayLineBmp.dispose();
            this._delaunayLineBmp = null;
        }
        this.leftVertex = null;
        this.rightVertex = null;
        if (this.clippedEnds !== null) {
            this.clippedEnds[lr.LEFT] = null;
            this.clippedEnds[lr.RIGHT] = null;
            this.clippedEnds = null;
        }

        this.leftSite = null;
        this.rightSite = null;
        
        _pool.push(this);
    },

    toString: function () {
        return 'Edge ' + this._edgeIndex + '; sites ' + this.leftSite + ', ' + this.rightSite +
            '; endVertices ' + (this.leftVertex !== null ? String(this.leftVertex.vertexIndex) : 'null') + ', ' +
            (this.rightVertex !== null ? String(this.rightVertex.vertexIndex) : 'null') + '::';
    },

    /**
     * Set _clippedVertices to contain the two ends of the portion of the Voronoi edge that is visible
     * within the bounds.  If no part of the Edge falls within the bounds, leave _clippedVertices null. 
     * @param bounds
     * 
     */
    clipVertices: function (bounds) {
        var boundsCore = rectangle.core(bounds);
        var xmin = bounds.x;
        var ymin = bounds.y;
        var xmax = boundsCore.right();
        var ymax = boundsCore.bottom();
        
        var vertex0, vertex1;
        var x0, x1, y0, y1;
        
        if (this.a === 1.0 && this.b >= 0.0) {
            vertex0 = this.rightVertex;
            vertex1 = this.leftVertex;
        } else {
            vertex0 = this.leftVertex;
            vertex1 = this.rightVertex;
        }
    
        if (this.a === 1.0) {
            y0 = ymin;
            if (vertex0 !== null && vertex0.y > ymin) {
                y0 = vertex0.y;
            }
            if (y0 > ymax) {
                return;
            }
            x0 = this.c - this.b * y0;
            
            y1 = ymax;
            if (vertex1 !== null && vertex1.y < ymax) {
                y1 = vertex1.y;
            }
            if (y1 < ymin) {
                return;
            }
            x1 = this.c - this.b * y1;
            
            if ((x0 > xmax && x1 > xmax) || (x0 < xmin && x1 < xmin)) {
                return;
            }
            
            if (x0 > xmax) {
                x0 = xmax;
                y0 = (this.c - x0) / this.b;
            }
            else if (x0 < xmin) {
                x0 = xmin;
                y0 = (this.c - x0) / this.b;
            }
            
            if (x1 > xmax) {
                x1 = xmax;
                y1 = (this.c - x1) / this.b;
            }
            else if (x1 < xmin) {
                x1 = xmin;
                y1 = (this.c - x1) / this.b;
            }
        } else {
            x0 = xmin;
            if (vertex0 !== null && vertex0.x > xmin) {
                x0 = vertex0.x;
            }
            if (x0 > xmax) {
                return;
            }
            y0 = this.c - this.a * x0;
            
            x1 = xmax;
            if (vertex1 !== null && vertex1.x < xmax) {
                x1 = vertex1.x;
            }
            if (x1 < xmin) {
                return;
            }
            y1 = this.c - this.a * x1;
            
            if ((y0 > ymax && y1 > ymax) || (y0 < ymin && y1 < ymin)) {
                return;
            }
            
            if (y0 > ymax) {
                y0 = ymax;
                x0 = (this.c - y0) / this.a;
            }
            else if (y0 < ymin) {
                y0 = ymin;
                x0 = (this.c - y0) / this.a;
            }
            
            if (y1 > ymax) {
                y1 = ymax;
                x1 = (this.c - y1) / this.a;
            }
            else if (y1 < ymin) {
                y1 = ymin;
                x1 = (this.c - y1) / this.a;
            }
        }

        this.clippedEnds = {};
        if (vertex0 === this.leftVertex) {
            this.clippedEnds[lr.LEFT] = {x: x0, y: y0};
            this.clippedEnds[lr.RIGHT] = {x: x1, y: y1};
        } else {
            this.clippedEnds[lr.RIGHT] = {x: x0, y: y0};
            this.clippedEnds[lr.LEFT] = {x: x1, y: y1};
        }
    },

    init: function () {
        this.leftSite = null;
        this.rightSite = null;
    }

};

function create() {
    var edge;
    if (_pool.length > 0) {
        edge = _pool.pop();
        edge.init();
    } else {
        edge = new exports.Edge();
    }
    return edge;
}

exports.DELETED = new exports.Edge();

/**
 * This is the only way to create a new Edge 
 * @param site0
 * @param site1
 * @return 
 * 
 */
exports.createBisectingEdge = function (site0, site1) {
    var dx, dy, absdx, absdy;
    var a, b, c;

    dx = site1.x - site0.x;
    dy = site1.y - site0.y;
    absdx = dx > 0 ? dx : -dx;
    absdy = dy > 0 ? dy : -dy;
    c = site0.x * dx + site0.y * dy + (dx * dx + dy * dy) * 0.5;
    if (absdx > absdy) {
        a = 1.0;
        b = dy / dx;
        c /= dx;
    } else {
        b = 1.0;
        a = dx / dy;
        c /= dy;
    }
    
    var edge = create();

    edge.leftSite = site0;
    edge.rightSite = site1;
    site0.addEdge(edge);
    site1.addEdge(edge);
    
    edge.leftVertex = null;
    edge.rightVertex = null;
    
    edge.a = a;
    edge.b = b;
    edge.c = c;
    //trace("createBisectingEdge: a ", edge.a, "b", edge.b, "c", edge.c);
    
    return edge;
};

exports.compareSitesDistancesMax = function (edge0, edge1) {
    var length0 = edge0.sitesDistance();
    var length1 = edge1.sitesDistance();
    if (length0 < length1) {
        return 1;
    }
    if (length0 > length1) {
        return -1;
    }
    return 0;
};

exports.compareSitesDistances = function (edge0, edge1) {
    return - exports.compareSitesDistancesMax(edge0, edge1);
};