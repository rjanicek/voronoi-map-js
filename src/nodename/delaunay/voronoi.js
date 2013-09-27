'use strict';

var _ = require('lodash');
var criterion = require('./criterion');
var core = require('../../janicek/core');
var def = require('../../janicek/core').def;
var delaunayModule = require('./delaunay');
var edgeListModule = require('./edge-list');
var edgeModule = require('./edge');
var edgeReordererModule = require('./edge-reorderer');
var halfEdgeModule = require('./halfedge');
var halfedgePriorityQueue = require('./halfedge-priority-queue');
var kruskalModule = require('./kruskal');
var lr = require('./lr');
var pointCore = require('../../as3/point-core');
var prngModule = require('../../polygonal/pm-prng');
var siteListModule = require('./site-list');
var siteModule = require('./site');
var vertexModule = require('./vertex');

exports.make = function (points, colors, plotBoundsArg) {

    var _prng = prngModule();
    var _sites = siteListModule();
    var _sitesIndexedByLocation = {}; // Dictionary<Site>
    var _triangles = []; // Vector<Triangle>
    var _edges = []; // Vector<Edge>

    var pub = {};

    // TODO generalize this so it doesn't have to be a rectangle;
    // then we can make the fractal voronois-within-voronois
    pub.plotBounds = plotBoundsArg;

    pub.dispose = function () {
        var i, n;
        if (_sites !== null) {
            _sites.dispose();
            _sites = null;
        }
        if (_triangles !== null) {
            n = _triangles.length;
            for (i = 0; i < n; i++) {
                _triangles[i].dispose();
            }
            //_triangles.length = 0;
            _triangles = null;
        }
        if (_edges !== null) {
            n = _edges.length;
            for (i = 0; i < n; i++) {
                _edges[i].dispose();
            }
            //_edges.length = 0;
            _edges = null;
        }
        pub.plotBounds = null;
        _sitesIndexedByLocation = null;
    };

    /**
     * AS3 Dictionary stores object keys by object identity.
     * Haxe Hash only supports string keys.
     * This means duplicate coordinates can't be stored in hash.
     * Prevent this case until it's possible to store duplicate points coords.
     */
    function makeSureNoDuplicatePoints(points) {
        var h = {};
        _(points).each(function (p) {
            if (_(h).has(pointCore.hash(p))) {
                throw 'Duplicate points not supported yet!';
            }
            h[pointCore.hash(p)] = p;
        });
    }

    function addSites(points, colors) {
        var length = points.length;
        for (var i = 0; i < length; i++) {
            addSite(points[i], (colors !== null) ? colors[i] : 0, i);
        }
    }

    function addSite(p, color, index) {
        var weight = _prng.nextDouble() * 100;
        var site = siteModule.create(p, index, weight, color);
        _sites.push(site);
        _sitesIndexedByLocation[pointCore.hash(p)] = site;
    }

    pub.edges = function () {
        return _edges;
    };

    pub.region = function (p) {
        var site = _sitesIndexedByLocation[pointCore.hash(p)];
        if (site === null) {
            return [];
        }
        return site.region(pub.plotBounds);
    };

    // TODO: bug: if you call this before you call region(), something goes wrong :(
    pub.neighborSitesForSite = function (coord) {
        var points = []; // Vector<Point>
        var site = _sitesIndexedByLocation[pointCore.hash(coord)];
        if (site === null) {
            return points;
        }
        var sites = site.neighborSites();
        _(sites).each(function (neighbor) {
            points.push(neighbor.coord);
        });
        return points;
    };

    pub.circles = function () {
        return _sites.circles();
    };

    pub.voronoiBoundaryForSite = function (coord) {
        return delaunayModule.visibleLineSegments(delaunayModule.selectEdgesForSitePoint(coord, _edges));
    };

    pub.delaunayLinesForSite = function (coord) {
        return delaunayModule.delaunayLinesForEdges(delaunayModule.selectEdgesForSitePoint(coord, _edges));
    };

    pub.voronoiDiagram = function () {
        return delaunayModule.visibleLineSegments(_edges);
    };

    pub.delaunayTriangulation = function (keepOutMask) {
        keepOutMask = def(keepOutMask, null);
        return delaunayModule.delaunayLinesForEdges(delaunayModule.selectNonIntersectingEdges(keepOutMask, _edges));
    };

    pub.hull = function () {
        return delaunayModule.delaunayLinesForEdges(hullEdges());
    };

    function hullEdges() {
        return _(_edges).filter(function (edge) {
            return (edge.isPartOfConvexHull());
        });
    }

    pub.hullPointsInOrder = function () {
        var hullEdges = hullEdges();
        
        var points = [];
        if (hullEdges.length === 0) {
            return points;
        }
        
        var reorderer = edgeReordererModule(hullEdges, criterion.site);
        hullEdges = reorderer.edges;
        var orientations = reorderer.edgeOrientations;
        reorderer.dispose();
        
        var orientation;

        var n = hullEdges.length;
        var i;
        for (i = 0; i < n; i++) {
            var edge = hullEdges[i];
            orientation = orientations[i];
            points.push(edge.site(orientation).coord);
        }
        return points;
    };

    pub.spanningTree = function (type, keepOutMask) {
        type = def(type, 'minimum');
        keepOutMask = def(keepOutMask, null);

        var edges = delaunayModule.selectNonIntersectingEdges(keepOutMask, _edges);
        var segments = delaunayModule.delaunayLinesForEdges(edges);
        return kruskalModule.kruskal(segments, type);
    };

    pub.regions = function () {
        return _sites.regions(pub.plotBounds);
    };

    pub.siteColors = function (referenceImage) {
        referenceImage = def(referenceImage, null);
        return _sites.siteColors(referenceImage);
    };

    /**
     * 
     * @param proximityMap a BitmapData whose regions are filled with the site index values; see PlanePointsCanvas::fillRegions()
     * @param x
     * @param y
     * @return coordinates of nearest Site to (x, y)
     * 
     */
    pub.nearestSitePoint = function (proximityMap, x, y) {
        return _sites.nearestSitePoint(proximityMap, x, y);
    };

    pub.siteCoords = function () {
        return _sites.siteCoords();
    };

    function fortunesAlgorithm() {
        var newSite, bottomSite, topSite, tempSite;
        var v, vertex;
        var newintstar;
        var leftRight;
        var lbnd, rbnd, llbnd, rrbnd, bisector;
        var edge;
        
        var dataBounds = _sites.getSitesBounds();
        
        var sqrtNsites = core.toInt(Math.sqrt(_sites.length + 4));
        var heap = halfedgePriorityQueue(dataBounds.y, dataBounds.height, sqrtNsites);
        var edgeList = edgeListModule(dataBounds.x, dataBounds.width, sqrtNsites);
        var halfEdges = [];
        var vertices = [];
        
        var bottomMostSite = _sites.next();
        newSite = _sites.next();

        function leftRegion(he) {
            var edge = he.edge;
            if (edge === null) {
                return bottomMostSite;
            }
            return edge.site(he.leftRight);
        }
        
        function rightRegion(he) {
            var edge = he.edge;
            if (edge === null) {
                return bottomMostSite;
            }
            return edge.site(lr.other(he.leftRight));
        }
        
        while (true) {
            if (heap.empty() === false) {
                newintstar = heap.min();
            }
        
            if (newSite !== null &&  (heap.empty() || exports.comparePointByYThenX(newSite, newintstar) < 0)) {
                /* new site is smallest */
                
                // Step 8:
                lbnd = edgeList.edgeListLeftNeighbor(newSite.coord);    // the Halfedge just to the left of newSite
                rbnd = lbnd.edgeListRightNeighbor;      // the Halfedge just to the right
                bottomSite = rightRegion(lbnd);     // this is the same as leftRegion(rbnd)
                // this Site determines the region containing the new site
                
                // Step 9:
                edge = edgeModule.createBisectingEdge(bottomSite, newSite);
                _edges.push(edge);
                
                bisector = halfEdgeModule.create(edge, lr.LEFT);
                halfEdges.push(bisector);
                // inserting two Halfedges into edgeList constitutes Step 10:
                // insert bisector to the right of lbnd:
                edgeList.insert(lbnd, bisector);
                
                // first half of Step 11:
                if ((vertex = vertexModule.intersect(lbnd, bisector)) !== null) {
                    vertices.push(vertex);
                    heap.remove(lbnd);
                    lbnd.vertex = vertex;
                    lbnd.ystar = vertex.y + newSite.dist(vertex);
                    heap.insert(lbnd);
                }
                
                lbnd = bisector;
                bisector = halfEdgeModule.create(edge, lr.RIGHT);
                halfEdges.push(bisector);
                // second Halfedge for Step 10:
                // insert bisector to the right of lbnd:
                edgeList.insert(lbnd, bisector);
                
                // second half of Step 11:
                if ((vertex = vertexModule.intersect(bisector, rbnd)) !== null) {
                    vertices.push(vertex);
                    bisector.vertex = vertex;
                    bisector.ystar = vertex.y + newSite.dist(vertex);
                    heap.insert(bisector);
                }
                
                newSite = _sites.next();
            } else if (heap.empty() === false) {
                /* intersection is smallest */
                lbnd = heap.extractMin();
                llbnd = lbnd.edgeListLeftNeighbor;
                rbnd = lbnd.edgeListRightNeighbor;
                rrbnd = rbnd.edgeListRightNeighbor;
                bottomSite = leftRegion(lbnd);
                topSite = rightRegion(rbnd);
                // these three sites define a Delaunay triangle
                // (not actually using these for anything...)
                //_triangles.push(new Triangle(bottomSite, topSite, rightRegion(lbnd)));
                
                v = lbnd.vertex;
                v.setIndex();
                lbnd.edge.setVertex(lbnd.leftRight, v);
                rbnd.edge.setVertex(rbnd.leftRight, v);
                edgeList.remove(lbnd);
                heap.remove(rbnd);
                edgeList.remove(rbnd);
                leftRight = lr.LEFT;
                if (bottomSite.y > topSite.y) {
                    tempSite = bottomSite;
                    bottomSite = topSite;
                    topSite = tempSite;
                    leftRight = lr.RIGHT;
                }
                edge = edgeModule.createBisectingEdge(bottomSite, topSite);
                _edges.push(edge);
                bisector = halfEdgeModule.create(edge, leftRight);
                halfEdges.push(bisector);
                edgeList.insert(llbnd, bisector);
                edge.setVertex(lr.other(leftRight), v);
                if ((vertex = vertexModule.intersect(llbnd, bisector)) !== null) {
                    vertices.push(vertex);
                    heap.remove(llbnd);
                    llbnd.vertex = vertex;
                    llbnd.ystar = vertex.y + bottomSite.dist(vertex);
                    heap.insert(llbnd);
                }
                if ((vertex = vertexModule.intersect(bisector, rrbnd)) !== null) {
                    vertices.push(vertex);
                    bisector.vertex = vertex;
                    bisector.ystar = vertex.y + bottomSite.dist(vertex);
                    heap.insert(bisector);
                }
            } else {
                break;
            }
        }
        
        // heap should be empty now
        heap.dispose();
        edgeList.dispose();
        
        _(halfEdges).each(function (halfEdge) {
            halfEdge.reallyDispose();
        });
        //halfEdges.length = 0;
        
        // we need the vertices to clip the edges
        _(_edges).each(function (edge) {
            edge.clipVertices(pub.plotBounds);
        });
        // but we don't actually ever use them again!
        _(vertices).each(function (vertex) {
            vertex.dispose();
        });
        //vertices.length = 0;
    }

    makeSureNoDuplicatePoints(points);
    _prng.seed = 1;
    addSites(points, colors);
    fortunesAlgorithm();

    return pub;
};

/**
 * HxDelaunay
 */
exports.isInfSite = function (s1, s2) {
    return (s1.y < s2.y) || (s1.y === s2.y && s1.x < s2.x);
};

exports.comparePointByYThenX = function (s1, s2) {
    return exports.compareByYThenX(s1.x, s1.y, s2.x, s2.y);
};

exports.compareSiteByYThenX = function (s1, s2) {
    return exports.compareByYThenX(s1.x, s1.y, s2.x, s2.y);
};

exports.compareByYThenX = function (s1x, s1y, s2x, s2y) {
    if (s1y < s2y) { return -1; }
    if (s1y > s2y) { return 1; }
    if (s1x < s2x) { return -1; }
    if (s1x > s2x) { return 1; }
    return 0;
};