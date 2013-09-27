/* jshint bitwise:false, es3:false */

'use strict';

var _ = require('lodash');
var boundsCheck = require('./bounds-check');
var criterion = require('./criterion');
var def = require('../../janicek/core').def;
var edgeModule = require('./edge');
var edgeReordererModule = require('./edge-reorderer');
var lr = require('./lr');
var pointCore = require('../../as3/point-core');
var polygon = require('../geom/polygon');
var rect = require('../../as3/rectangle').core;
var voronoiModule = require('./voronoi');
var winding = require('../geom/winding');

var _pool = []; // Vector<Site>


var EPSILON = 0.005;
function closeEnough(p0, p1) {
    return pointCore.distance(p0, p1) < EPSILON;
}

var Site = function (p, index, weight, color) {
    this.init(p, index, weight, color);
};

Site.prototype = {
    _coord: null,
    get coord() { return this._coord; },
    color: 0,
    weight: 0.0,
    _siteIndex: 0,

    // the edges that define this Site's Voronoi region:
    _edges: null, // Vector<Edge>
    get edges() { return this._edges; },

    // which end of each edge hooks up with the previous edge in _edges:
    _edgeOrientations: null, // Vector<LR>;
    // ordered list of points that define the region clipped to bounds:
    _region: null, // Vector<Point>

    init: function (p, index, weight, color) {
        this._coord = p;
        this._siteIndex = index;
        this.weight = weight;
        this.color = color;
        this._edges = [];
        this._region = null;
        return this;
    },

    toString: function () {
        return 'Site ' + this._siteIndex + ': ' + String(this.coord);
    },

    dispose: function () {
        this._coord = null;
        this._clear();
        _pool.push(this);
    },

    _clear: function () {
        if (this._edges !== null) {
            this._edges = null;
        }
        if (this._edgeOrientations !== null) {
            this._edgeOrientations = null;
        }
        if (this._region !== null) {
            this._region = null;
        }
    },

    addEdge: function (edge) {
        this._edges.push(edge);
    },

    nearestEdge: function () {
        this._edges.sort(edgeModule.compareSitesDistances);
        return this._edges[0];
    },

    neighborSites: function () {
        if (this._edges === null || this._edges.length === 0) {
            return [];
        }
        if (this._edgeOrientations === null) {
            this._reorderEdges();
        }
        var list = []; // Vector<Site>

        _.each(this._edges, function (edge) {
            list.push(this._neighborSite(edge));
        });

        return list;
    },

    _neighborSite: function (edge) {
        if (this === edge.leftSite) {
            return edge.rightSite;
        }
        if (this === edge.rightSite) {
            return edge.leftSite;
        }
        return null;
    },

    region: function (clippingBounds) {
        if (this._edges === null || this._edges.length === 0) {
            return [];
        }
        if (this._edgeOrientations === null) {
            this._reorderEdges();
            this._region = this._clipToBounds(clippingBounds);
            if ((polygon(this._region)).winding() === winding.CLOCKWISE) {
                this._region.reverse();
            }
        }
        return this._region;
    },

    _reorderEdges: function () {
        var reorderer = edgeReordererModule(this._edges, criterion.vertex);
        this._edges = reorderer.edges;
        this._edgeOrientations = reorderer.edgeOrientations;
        reorderer.dispose();
    },

    _clipToBounds: function (bounds) {
        var points = []; // Vector<Point>
        var n = this._edges.length;
        var i = 0;
        var edge = null;
        while (i < n && (this._edges[i].visible === false)) {
            ++i;
        }
        
        if (i === n) {
            // no edges visible
            return [];
        }
        edge = this._edges[i];
        var orientation = this._edgeOrientations[i];
        points.push(edge.clippedEnds[orientation]);
        points.push(edge.clippedEnds[lr.other(orientation)]);

        for (var j = (i + 1); j < n; j++) {
            edge = this._edges[j];
            if (edge.visible === false) {
                continue;
            }
            this._connect(points, j, bounds);
        }
        // close up the polygon by adding another corner point of the bounds if needed:
        this._connect(points, i, bounds, true);
        
        return points;
    },

    _connect: function (points, j, bounds, closingUp) {
        closingUp = def(closingUp, false);

        var rightPoint = points[points.length - 1];
        var newEdge = this._edges[j];
        var newOrientation = this._edgeOrientations[j];
        // the point that  must be connected to rightPoint:
        var newPoint = newEdge.clippedEnds[newOrientation];
        if (!closeEnough(rightPoint, newPoint)) {
            // The points do not coincide, so they must have been clipped at the bounds;
            // see if they are on the same border of the bounds:
            if (rightPoint.x !== newPoint.x && rightPoint.y !== newPoint.y) {
                // They are on different borders of the bounds;
                // insert one or two corners of bounds as needed to hook them up:
                // (NOTE this will not be correct if the region should take up more than
                // half of the bounds rect, for then we will have gone the wrong way
                // around the bounds and included the smaller part rather than the larger)
                var rightCheck = boundsCheck.check(rightPoint, bounds);
                var newCheck = boundsCheck.check(newPoint, bounds);
                var px, py;
                if ((rightCheck & boundsCheck.RIGHT) !== 0) {
                    px = rect(bounds).right();
                    if ((newCheck & boundsCheck.BOTTOM) !== 0) {
                        py = rect(bounds).bottom();
                        points.push({x: px, y: py});
                    }
                    else if ((newCheck & boundsCheck.TOP) !== 0) {
                        py = rect(bounds).top();
                        points.push({x: px, y: py});
                    }
                    else if ((newCheck & boundsCheck.LEFT) !== 0) {
                        if (rightPoint.y - bounds.y + newPoint.y - bounds.y < bounds.height) {
                            py = rect(bounds).top();
                        } else {
                            py = rect(bounds).bottom();
                        }
                        points.push({x: px, y: py});
                        points.push({x: rect(bounds).left(), y: py});
                    }
                } else if ((rightCheck & boundsCheck.LEFT) !== 0) {
                    px = rect(bounds).left();
                    if ((newCheck & boundsCheck.BOTTOM) !== 0) {
                        py = rect(bounds).bottom();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.TOP) !== 0) {
                        py = rect(bounds).top();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.RIGHT) !== 0) {
                        if (rightPoint.y - bounds.y + newPoint.y - bounds.y < bounds.height) {
                            py = rect(bounds).top();
                        } else {
                            py = rect(bounds).bottom();
                        }
                        points.push({x: px, y: py});
                        points.push({x: rect(bounds).right(), y: py});
                    }
                } else if ((rightCheck & boundsCheck.TOP) !== 0) {
                    py = rect(bounds).top();
                    if ((newCheck & boundsCheck.RIGHT) !== 0) {
                        px = rect(bounds).right();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.LEFT) !== 0) {
                        px = rect(bounds).left();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.BOTTOM) !== 0) {
                        if (rightPoint.x - bounds.x + newPoint.x - bounds.x < bounds.width) {
                            px = rect(bounds).left();
                        } else {
                            px = rect(bounds).right();
                        }
                        points.push({x: px, y: py});
                        points.push({x: px, y: rect(bounds).bottom()});
                    }
                } else if ((rightCheck & boundsCheck.BOTTOM) !== 0) {
                    py = rect(bounds).bottom();
                    if ((newCheck & boundsCheck.RIGHT) !== 0) {
                        px = rect(bounds).right();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.LEFT) !== 0) {
                        px = rect(bounds).left();
                        points.push({x: px, y: py});
                    } else if ((newCheck & boundsCheck.TOP) !== 0) {
                        if (rightPoint.x - bounds.x + newPoint.x - bounds.x < bounds.width) {
                            px = rect(bounds).left();
                        } else {
                            px = rect(bounds).right();
                        }
                        points.push({x: px, y: py});
                        points.push({x: px, y: rect(bounds).top()});
                    }
                }
            }
            if (closingUp) {
                // newEdge's ends have already been added
                return;
            }
            points.push(newPoint);
        }
        var newRightPoint = newEdge.clippedEnds[lr.other(newOrientation)];
        if (!closeEnough(points[0], newRightPoint)) {
            points.push(newRightPoint);
        }
    },

    get x() { return this._coord.x; },

    get y() { return this._coord.y; },

    dist: function (p) {
        return pointCore.distance(p.coord, this.coord);
    }
};

exports.create = function (p, index, weight, color) {
    if (_pool.length > 0) {
        return _pool.pop().init(p, index, weight, color);
    } else {
        return new Site(p, index, weight, color);
    }
};

/**
 * sort sites on y, then x, coord
 * also change each site's _siteIndex to match its new position in the list
 * so the _siteIndex can be used to identify the site for nearest-neighbor queries
 * 
 * haha "also" - means more than one responsibility...
 * 
 */
exports.sortSites = function (sites) {
    sites.sort(voronoiModule.compareSiteByYThenX);
    _(sites).each(function (site, i) {
        sites[i]._siteIndex = i;
    });
};