/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var centerModule = require('./graph/center');
var convert = require('./as3/conversion-core');
var core = require('./janicek/core');
var cornerModule = require('./graph/corner');
var edgeModule = require('./graph/edge');
var pc = require('./as3/point-core');
var pointSelectorModule = require('./point-selector');
var prng = require('./polygonal/pm-prng');
var rectangle = require('./as3/rectangle');
var voronoiModule = require('./nodename/delaunay/voronoi');

// Make a new map.
// size: width and height of map
var mapModule = function (size) {
    var pub = {};

    // Passed in by the caller:
    pub.SIZE = size;

    // Island shape is controlled by the islandRandom seed and the
    // type of island, passed in when we set the island shape. The
    // islandShape function uses both of them to determine whether any
    // point should be water or land.
    pub.islandShape = null;

    // Island details are controlled by this random generator. The initial map
    // upon loading is always deterministic, but subsequent maps reset this
    // random number generator with a random seed.
    pub.mapRandom = prng();
    pub.needsMoreRandomness; // see comment in point-selector.js

    // These store the graph data
    
    // Only useful during map construction
    pub.points = []; // Vector<Point>
    pub.centers = []; // Vector<Center>
    pub.corners = []; // Vector<Corner>
    pub.edges = []; // Vector<Edge>


    // Random parameters governing the overall shape of the island
    pub.newIsland = function (islandShape, variant) {
        pub.islandShape = islandShape;
        pub.mapRandom.seed = variant;
    };

    // Generate the initial random set of points.
    pub.go0PlacePoints = function (numberOfPoints, pointSelector) {
        pub.needsMoreRandomness = pointSelectorModule.needsMoreRandomness(pointSelector);
        numberOfPoints = core.def(numberOfPoints, mapModule.DEFAULT_NUMBER_OF_POINTS);
        pub.reset();
        pub.points = pointSelector(numberOfPoints);
    };

    // Create a graph structure from the Voronoi edge list. The
    // methods in the Voronoi object are somewhat inconvenient for
    // my needs, so I transform that data into the data I actually
    // need: edges connected to the Delaunay triangles and the
    // Voronoi polygons, a reverse map from those four points back
    // to the edge, a map from these four points to the points
    // they connect to (both along the edge and crosswise).
    pub.go1BuildGraph = function () {
        var voronoi = voronoiModule.make(pub.points, null, rectangle(0, 0, pub.SIZE.width, pub.SIZE.height));
        pub.buildGraph(pub.points, voronoi);
        pub.improveCorners();
        voronoi.dispose();
        voronoi = null;
        pub.points = null;
    };

    // lakeThreshold: 0 to 1, fraction of water corners for water polygon, default = 0.3
    pub.go2AssignElevations = function (lakeThreshold) {
        lakeThreshold = core.def(lakeThreshold, mapModule.DEFAULT_LAKE_THRESHOLD);

        // Determine the elevations and water at Voronoi corners.
        pub.assignCornerElevations();

        // Determine polygon and corner type: ocean, coast, land.
        pub.assignOceanCoastAndLand(lakeThreshold);

        // Rescale elevations so that the highest is 1.0, and they're
        // distributed well. We want lower elevations to be more common
        // than higher elevations, in proportions approximately matching
        // concentric rings. That is, the lowest elevation is the
        // largest ring around the island, and therefore should more
        // land area than the highest elevation, which is the very
        // center of a perfectly circular island.
        pub.redistributeElevations(pub.landCorners(pub.corners));

        // Assign elevations to non-land corners
        _(pub.corners).each(function (q) {
            if (q.ocean || q.coast) {
                q.elevation = 0.0;
            }
        });

        // Polygon elevations are the average of their corners
        pub.assignPolygonElevations();
    };

    // riverChance: 0 = no rivers, > 0 = more rivers, default = map area / 4
    pub.go3AssignMoisture = function (riverChance) {
        riverChance = core.def(riverChance, null);

        // Determine downslope paths.
        pub.calculateDownslopes();

        // Determine watersheds: for every corner, where does it flow
        // out into the ocean? 
        pub.calculateWatersheds();

        // Create rivers.
        pub.createRivers(riverChance);

        // Determine moisture at corners, starting at rivers
        // and lakes, but not oceans. Then redistribute
        // moisture to cover the entire range evenly from 0.0
        // to 1.0. Then assign polygon moisture as the average
        // of the corner moisture.
        pub.assignCornerMoisture();
        pub.redistributeMoisture(pub.landCorners(pub.corners));
        pub.assignPolygonMoisture();
    };

    pub.go4DecorateMap = function () {
        pub.assignBiomes();
    };

    pub.reset = function () {
        // Break cycles so the garbage collector will release data.
        if (pub.points !== null) {
            pub.points.splice(0, pub.points.length);
        }
        if (pub.edges !== null) {
            _(pub.edges).each(function (edge) {
                edge.d0 = edge.d1 = null;
                edge.v0 = edge.v1 = null;
            });
            pub.edges.splice(0, pub.edges.length);
        }
        if (pub.centers !== null) {
            _(pub.centers).each(function (p) {
                p.neighbors.splice(0, p.neighbors.length);
                p.corners.splice(0, p.corners.length);
                p.borders.splice(0, p.borders.length);
            });
            pub.centers.splice(0, pub.centers.length);
        }
        if (pub.corners !== null) {
            _(pub.corners).each(function (q) {
                q.adjacent.splice(0, q.adjacent.length);
                q.touches.splice(0, q.touches.length);
                q.protrudes.splice(0, q.protrudes.length);
                q.downslope = null;
                q.watershed = null;
            });
            pub.corners.splice(0, pub.corners.length);
        }
        // Clear the previous graph data.
        if (pub.points === null) { pub.points = []; }
        if (pub.edges === null) { pub.edges = []; }
        if (pub.centers === null) { pub.centers = []; }
        if (pub.corners === null) { pub.corners = []; }
      
        // Disabled for JavaScript
        //System.gc();
    };

    // Although Lloyd relaxation improves the uniformity of polygon
    // sizes, it doesn't help with the edge lengths. Short edges can
    // be bad for some games, and lead to weird artifacts on
    // rivers. We can easily lengthen short edges by moving the
    // corners, but **we lose the Voronoi property**.  The corners are
    // moved to the average of the polygon centers around them. Short
    // edges become longer. Long edges tend to become shorter. The
    // polygons tend to be more uniform after this step.
    pub.improveCorners = function () {
        var newCorners = []; // Vector<Point>
        var point, i;

        // First we compute the average of the centers next to each corner.
        _(pub.corners).each(function (q) {
            if (q.border) {
                newCorners[q.index] = q.point;
            } else {
                point = {x: 0.0, y: 0.0};
                _(q.touches).each(function (r) {
                    point.x += r.point.x;
                    point.y += r.point.y;
                });
                point.x /= q.touches.length;
                point.y /= q.touches.length;
                newCorners[q.index] = point;
            }
        });

        // Move the corners to the new locations.
        for (i = 0; i < pub.corners.length; i++) {
            pub.corners[i].point = newCorners[i];
        }

        // The edge midpoints were computed for the old corners and need
        // to be recomputed.
        _(pub.edges).each(function (edge) {
            if (edge.v0 !== null && edge.v1 !== null) {
                edge.midpoint = pc.interpolate(edge.v0.point, edge.v1.point, 0.5);
            }
        });
    };

    // Create an array of corners that are on land only, for use by
    // algorithms that work only on land.  We return an array instead
    // of a vector because the redistribution algorithms want to sort
    // this array using Array.sortOn.
    pub.landCorners = function (corners) {
        var locations = [];
        _(corners).each(function (q) {
            if (!q.ocean && !q.coast) {
                locations.push(q);
            }
        });
        return locations;
    };

    // Build graph data structure in 'edges', 'centers', 'corners',
    // based on information in the Voronoi results: point.neighbors
    // will be a list of neighboring points of the same type (corner
    // or center); point.edges will be a list of edges that include
    // that point. Each edge connects to four points: the Voronoi edge
    // edge.{v0,v1} and its dual Delaunay triangle edge edge.{d0,d1}.
    // For boundary polygons, the Delaunay edge will have one null
    // point, and the Voronoi edge may be null.
    pub.buildGraph = function (points, voronoi) {
        var p;
        var libedges = voronoi.edges();
        var centerLookup = {}; // Dictionary<Center>

        // Build Center objects for each of the points, and a lookup map
        // to find those Center objects again as we build the graph
        _(points).each(function (point) {
            p = centerModule();
            p.index = pub.centers.length;
            p.point = point;
            p.neighbors = [];
            p.borders = [];
            p.corners = [];
            pub.centers.push(p);
            centerLookup[pc.hash(point)] = p;
        });

        // Workaround for Voronoi lib bug: we need to call region()
        // before Edges or neighboringSites are available
        _(pub.centers).each(function (p) {
            voronoi.region(p.point);
        });
      
        // The Voronoi library generates multiple Point objects for
        // corners, and we need to canonicalize to one Corner object.
        // To make lookup fast, we keep an array of Points, bucketed by
        // x value, and then we only have to look at other Points in
        // nearby buckets. When we fail to find one, we'll create a new
        // Corner object.
        var _cornerMap = [];
        function makeCorner(point) {
            var q;
            if (point === null) { return null; }
            var bucket;
            for (bucket = core.toInt(point.x) - 1; bucket < core.toInt(point.x) + 2; bucket++) {
                if (!core.isUndefinedOrNull(_cornerMap[bucket])) {
                    for (var z = 0; z < _cornerMap[bucket].length; z++) {
                        q = _cornerMap[bucket][z];
                        var dx = point.x - q.point.x;
                        var dy = point.y - q.point.y;
                        if (dx * dx + dy * dy < 1e-6) {
                            return q;
                        }
                    }
                }
            }
            bucket = core.toInt(point.x);
            if (core.isUndefinedOrNull(_cornerMap[bucket])) { _cornerMap[bucket] = []; }
            q = cornerModule();
            q.index = pub.corners.length;
            pub.corners.push(q);
            q.point = point;
            q.border = (point.x === 0 || point.x === pub.SIZE.width || point.y === 0 || point.y === pub.SIZE.height);
            q.touches = [];
            q.protrudes = [];
            q.adjacent = [];
            _cornerMap[bucket].push(q);
            return q;
        }

        // Helper functions for the following for loop; ideally these
        // would be inlined
        function addToCornerList(v, x) {
            if (x !== null && v.indexOf(x) < 0) { v.push(x); }
        }

        function addToCenterList(v, x) {
            if (x !== null && v.indexOf(x) < 0) { v.push(x); }
        }

        _(libedges).each(function (libedge) {
            var dedge = libedge.delaunayLine();
            var vedge = libedge.voronoiEdge();

            // Fill the graph data. Make an Edge object corresponding to
            // the edge from the voronoi library.
            var edge = edgeModule();
            edge.index = pub.edges.length;
            edge.river = 0;
            pub.edges.push(edge);
            edge.midpoint = (vedge.p0 !== null && vedge.p1 !== null) ? pc.interpolate(vedge.p0, vedge.p1, 0.5) : null;
          
            // Edges point to corners. Edges point to centers. 
            edge.v0 = makeCorner(vedge.p0);
            edge.v1 = makeCorner(vedge.p1);
            edge.d0 = centerLookup[pc.hash(dedge.p0)];
            edge.d1 = centerLookup[pc.hash(dedge.p1)];

            // Centers point to edges. Corners point to edges.
            if (edge.d0 !== null) { edge.d0.borders.push(edge); }
            if (edge.d1 !== null) { edge.d1.borders.push(edge); }
            if (edge.v0 !== null) { edge.v0.protrudes.push(edge); }
            if (edge.v1 !== null) { edge.v1.protrudes.push(edge); }
          
            // Centers point to centers.
            if (edge.d0 !== null && edge.d1 !== null) {
                addToCenterList(edge.d0.neighbors, edge.d1);
                addToCenterList(edge.d1.neighbors, edge.d0);
            }

            // Corners point to corners
            if (edge.v0 !== null && edge.v1 !== null) {
                addToCornerList(edge.v0.adjacent, edge.v1);
                addToCornerList(edge.v1.adjacent, edge.v0);
            }

            // Centers point to corners
            if (edge.d0 !== null) {
                addToCornerList(edge.d0.corners, edge.v0);
                addToCornerList(edge.d0.corners, edge.v1);
            }
            if (edge.d1 !== null) {
                addToCornerList(edge.d1.corners, edge.v0);
                addToCornerList(edge.d1.corners, edge.v1);
            }

            // Corners point to centers
            if (edge.v0 !== null) {
                addToCenterList(edge.v0.touches, edge.d0);
                addToCenterList(edge.v0.touches, edge.d1);
            }
            if (edge.v1 !== null) {
                addToCenterList(edge.v1.touches, edge.d0);
                addToCenterList(edge.v1.touches, edge.d1);
            }
        });
    };

    // Determine elevations and water at Voronoi corners. By
    // construction, we have no local minima. This is important for
    // the downslope vectors later, which are used in the river
    // construction algorithm. Also by construction, inlets/bays
    // push low elevation areas inland, which means many rivers end
    // up flowing out through them. Also by construction, lakes
    // often end up on river paths because they don't raise the
    // elevation as much as other terrain does.
    pub.assignCornerElevations = function () {
        var queue = []; // Array<Corner>
      
        _(pub.corners).each(function (q) {
            q.water = !pub.inside(q.point);
        });

        _(pub.corners).each(function (q) {
            // The edges of the map are elevation 0
            if (q.border) {
                q.elevation = 0.0;
                queue.push(q);
            } else {
                q.elevation = Number.POSITIVE_INFINITY;
            }
        });
        // Traverse the graph and assign elevations to each point. As we
        // move away from the map border, increase the elevations. This
        // guarantees that rivers always have a way down to the coast by
        // going downhill (no local minima).
        while (queue.length > 0) {
            var q = queue.shift();
            for (var adjacentIndex = 0; adjacentIndex < q.adjacent.length; adjacentIndex++) {
                var s = q.adjacent[adjacentIndex];

                // Every step up is epsilon over water or 1 over land. The
                // number doesn't matter because we'll rescale the
                // elevations later.
                var newElevation = 0.01 + q.elevation;
                if (!q.water && !s.water) {
                    newElevation += 1;
                    if (pub.needsMoreRandomness) {
                        // HACK: the map looks nice because of randomness of
                        // points, randomness of rivers, and randomness of
                        // edges. Without random point selection, I needed to
                        // inject some more randomness to make maps look
                        // nicer. I'm doing it here, with elevations, but I
                        // think there must be a better way. This hack is only
                        // used with square/hexagon grids.
                        newElevation += pub.mapRandom.nextDouble();
                    }

                }

                // If this point changed, we'll add it to the queue so
                // that we can process its neighbors too.
                if (newElevation < s.elevation) {
                    s.elevation = newElevation;
                    queue.push(s);
                }
            }
        }
    };

    // Change the overall distribution of elevations so that lower
    // elevations are more common than higher
    // elevations. Specifically, we want elevation X to have frequency
    // (1-X).  To do this we will sort the corners, then set each
    // corner to its desired elevation.
    pub.redistributeElevations = function (locations) {
        // SCALE_FACTOR increases the mountain area. At 1.0 the maximum
        // elevation barely shows up on the map, so we set it to 1.1.
        var SCALE_FACTOR = 1.1;
        var i, y, x;

        //JavaScript port
        //locations.sortOn('elevation', Array.NUMERIC);
        locations.sort(function (c1, c2) {
            if (c1.elevation > c2.elevation) { return 1; }
            if (c1.elevation < c2.elevation) { return -1; }
            if (c1.index > c2.index) { return 1; }
            if (c1.index < c2.index) { return -1; }
            return 0;
        });
      
        for (i = 0; i < locations.length; i++) {
            // Let y(x) be the total area that we want at elevation <= x.
            // We want the higher elevations to occur less than lower
            // ones, and set the area to be y(x) = 1 - (1-x)^2.
            y = i / (locations.length - 1);
            // Now we have to solve for x, given the known y.
            //  *  y = 1 - (1-x)^2
            //  *  y = 1 - (1 - 2x + x^2)
            //  *  y = 2x - x^2
            //  *  x^2 - 2x + y = 0
            // From this we can use the quadratic equation to get:
            x = Math.sqrt(SCALE_FACTOR) - Math.sqrt(SCALE_FACTOR * (1 - y));
            if (x > 1.0) { x = 1.0; }  // TODO: does this break downslopes?
            locations[i].elevation = x;
        }
    };

    // Change the overall distribution of moisture to be evenly distributed.
    pub.redistributeMoisture = function (locations) {
        var i;
      
        locations.sort(function (c1, c2) {
            if (c1.moisture > c2.moisture) { return 1; }
            if (c1.moisture < c2.moisture) { return -1; }
            if (c1.index > c2.index) { return 1; }
            if (c1.index < c2.index) { return -1; }
            return 0;
        });
      
        for (i = 0; i < locations.length; i++) {
            locations[i].moisture = i / (locations.length - 1);
        }
    };

    // Determine polygon and corner types: ocean, coast, land.
    pub.assignOceanCoastAndLand = function (lakeThreshold) {
        // Compute polygon attributes 'ocean' and 'water' based on the
        // corner attributes. Count the water corners per
        // polygon. Oceans are all polygons connected to the edge of the
        // map. In the first pass, mark the edges of the map as ocean;
        // in the second pass, mark any water-containing polygon
        // connected an ocean as ocean.
        var queue = []; // Array<Center>
        var p, numWater;
      
        _(pub.centers).each(function (p) {
            numWater = 0;
            _(p.corners).each(function (q) {
                if (q.border) {
                    p.border = true;
                    p.ocean = true;
                    q.water = true;
                    queue.push(p);
                }
                if (q.water) {
                    numWater += 1;
                }
            });
            p.water = (p.ocean || numWater >= p.corners.length * lakeThreshold);
        });
        while (queue.length > 0) {
            p = queue.shift();
            for (var neighbourIndex = 0; neighbourIndex < p.neighbors.length; neighbourIndex++) {
                var r = p.neighbors[neighbourIndex];
                if (r.water && !r.ocean) {
                    r.ocean = true;
                    queue.push(r);
                }
            }
        }
      
        // Set the polygon attribute 'coast' based on its neighbors. If
        // it has at least one ocean and at least one land neighbor,
        // then this is a coastal polygon.
        _(pub.centers).each(function (p) {
            var numOcean = 0;
            var numLand = 0;
            _(p.neighbors).each(function (r) {
                numOcean += convert.intFromBoolean(r.ocean);
                numLand += convert.intFromBoolean(!r.water);
            });
            p.coast = (numOcean > 0) && (numLand > 0);
        });


        // Set the corner attributes based on the computed polygon
        // attributes. If all polygons connected to this corner are
        // ocean, then it's ocean; if all are land, then it's land;
        // otherwise it's coast.
        _(pub.corners).each(function (q) {
            var numOcean = 0;
            var numLand = 0;
            _(q.touches).each(function (p) {
                numOcean += convert.intFromBoolean(p.ocean);
                numLand += convert.intFromBoolean(!p.water);
            });
            q.ocean = (numOcean === q.touches.length);
            q.coast = (numOcean > 0) && (numLand > 0);
            q.water = q.border || ((numLand !== q.touches.length) && !q.coast);
        });
    };

    // Polygon elevations are the average of the elevations of their corners.
    pub.assignPolygonElevations = function () {
        var sumElevation;
        _(pub.centers).each(function (p) {
            sumElevation = 0.0;
            _(p.corners).each(function (q) {
                sumElevation += q.elevation;
            });
            p.elevation = sumElevation / p.corners.length;
        });
    };

    // Calculate downslope pointers.  At every point, we point to the
    // point downstream from it, or to itself.  This is used for
    // generating rivers and watersheds.
    pub.calculateDownslopes = function () {
        var r;
      
        _(pub.corners).each(function (q) {
            r = q;
            _(q.adjacent).each(function (s) {
                if (s.elevation <= r.elevation) {
                    r = s;
                }
            });
            q.downslope = r;
        });
    };

    // Calculate the watershed of every land point. The watershed is
    // the last downstream land point in the downslope graph. TODO:
    // watersheds are currently calculated on corners, but it'd be
    // more useful to compute them on polygon centers so that every
    // polygon can be marked as being in one watershed.
    pub.calculateWatersheds = function () {
        var r, i, changed;
      
        // Initially the watershed pointer points downslope one step.      
        _(pub.corners).each(function (q) {
            q.watershed = q;
            if (!q.ocean && !q.coast) {
                q.watershed = q.downslope;
            }
        });
        // Follow the downslope pointers to the coast. Limit to 100
        // iterations although most of the time with numPoints==2000 it
        // only takes 20 iterations because most points are not far from
        // a coast.  TODO: can run faster by looking at
        // p.watershed.watershed instead of p.downslope.watershed.
        var cornerIndex, q;
        for (i = 0; i < 100; i++) {
            changed = false;
            for (cornerIndex = 0; cornerIndex < pub.corners.length; cornerIndex++) {
                q = pub.corners[cornerIndex];
                if (!q.ocean && !q.coast && !q.watershed.coast) {
                    r = q.downslope.watershed;
                    if (!r.ocean) { q.watershed = r; }
                    changed = true;
                }
            }
            if (!changed) { break; }
        }
        // How big is each watershed?
        for (cornerIndex = 0; cornerIndex < pub.corners.length; cornerIndex++) {
            q = pub.corners[cornerIndex];
            r = q.watershed;
            r.watershedSize = 1 + (r.watershedSize || 0);
        }
    };

    // Create rivers along edges. Pick a random corner point,
    // then move downslope. Mark the edges and corners as rivers.
    // riverChance: Higher = more rivers.
    pub.createRivers = function (riverChance) {
        riverChance = core.coalesce(riverChance, core.toInt((pub.SIZE.width + pub.SIZE.height) / 4));

        var i, q, edge;
      
        for (i = 0; i < riverChance; i++) {
            q = pub.corners[pub.mapRandom.nextIntRange(0, pub.corners.length - 1)];
            if (q.ocean || q.elevation < 0.3 || q.elevation > 0.9) { continue; }
            // Bias rivers to go west: if (q.downslope.x > q.x) continue;
            while (!q.coast) {
                if (q === q.downslope) {
                    break;
                }
                edge = pub.lookupEdgeFromCorner(q, q.downslope);
                edge.river = edge.river + 1;
                q.river = (q.river || 0) + 1;
                q.downslope.river = (q.downslope.river || 0) + 1;  // TODO: fix double count
                q = q.downslope;
            }
        }
    };

    // Calculate moisture. Freshwater sources spread moisture: rivers
    // and lakes (not oceans). Saltwater sources have moisture but do
    // not spread it (we set it at the end, after propagation).
    pub.assignCornerMoisture = function () {
        var q, newMoisture;
        var queue = []; // Array<Corner>
        // Fresh water
        _(pub.corners).each(function (q) {
            if ((q.water || q.river > 0) && !q.ocean) {
                q.moisture = q.river > 0 ? Math.min(3.0, (0.2 * q.river)) : 1.0;
                queue.push(q);
            } else {
                q.moisture = 0.0;
            }
        });
        while (queue.length > 0) {
            q = queue.shift();

            for (var adjacentIndex = 0; adjacentIndex < q.adjacent.length; adjacentIndex++) {
                var r = q.adjacent[adjacentIndex];
                newMoisture = q.moisture * 0.9;
                if (newMoisture > r.moisture) {
                    r.moisture = newMoisture;
                    queue.push(r);
                }
            }
        }
        // Salt water
        _(pub.corners).each(function (q) {
            if (q.ocean || q.coast) {
                q.moisture = 1.0;
            }
        });
    };

    // Polygon moisture is the average of the moisture at corners
    pub.assignPolygonMoisture = function () {
        var sumMoisture;
        _(pub.centers).each(function (p) {
            sumMoisture = 0.0;
            _(p.corners).each(function (q) {
                if (q.moisture > 1.0) { q.moisture = 1.0; }
                sumMoisture += q.moisture;
            });
            p.moisture = sumMoisture / p.corners.length;
        });
    };

    pub.assignBiomes = function () {
        _(pub.centers).each(function (p) {
            p.biome = mapModule.getBiome(p);
        });
    };

    // Look up a Voronoi Edge object given two adjacent Voronoi
    // polygons, or two adjacent Voronoi corners
    pub.lookupEdgeFromCenter = function (p, r) {
        for (var i = 0; i < p.borders.length; i++) {
            var edge = p.borders[i];
            if (edge.d0 === r || edge.d1 === r) { return edge; }
        }
        return null;
    };

    pub.lookupEdgeFromCorner = function (q, s) {
        for (var i = 0; i < q.protrudes.length; i++) {
            var edge = q.protrudes[i];
            if (edge.v0 === s || edge.v1 === s) { return edge; }
        }
        return null;
    };

    // Determine whether a given point should be on the island or in the water.
    pub.inside = function (p) {
        return pub.islandShape({ x: 2 * (p.x / pub.SIZE.width - 0.5), y: 2 * (p.y / pub.SIZE.height - 0.5) });
    };

    pub.reset();

    return pub;
};

mapModule.DEFAULT_LAKE_THRESHOLD = 0.3;
mapModule.DEFAULT_LLOYD_ITERATIONS = 2;
mapModule.DEFAULT_NUMBER_OF_POINTS = 1000;

// Assign a biome type to each polygon. If it has
// ocean/coast/water, then that's the biome; otherwise it depends
// on low/high elevation and low/medium/high moisture. This is
// roughly based on the Whittaker diagram but adapted to fit the
// needs of the island map generator.
mapModule.getBiome = function (p) {
    if (p.ocean) {
        return 'OCEAN';
    } else if (p.water) {
        if (p.elevation < 0.1) { return 'MARSH'; }
        if (p.elevation > 0.8) { return 'ICE'; }
        return 'LAKE';
    } else if (p.coast) {
        return 'BEACH';
    } else if (p.elevation > 0.8) {
        if (p.moisture > 0.50) { return 'SNOW'; }
        else if (p.moisture > 0.33) { return 'TUNDRA'; }
        else if (p.moisture > 0.16) { return 'BARE'; }
        else { return 'SCORCHED'; }
    } else if (p.elevation > 0.6) {
        if (p.moisture > 0.66) { return 'TAIGA'; }
        else if (p.moisture > 0.33) { return 'SHRUBLAND'; }
        else { return 'TEMPERATE_DESERT'; }
    } else if (p.elevation > 0.3) {
        if (p.moisture > 0.83) { return 'TEMPERATE_RAIN_FOREST'; }
        else if (p.moisture > 0.50) { return 'TEMPERATE_DECIDUOUS_FOREST'; }
        else if (p.moisture > 0.16) { return 'GRASSLAND'; }
        else { return 'TEMPERATE_DESERT'; }
    } else {
        if (p.moisture > 0.66) { return 'TROPICAL_RAIN_FOREST'; }
        else if (p.moisture > 0.33) { return 'TROPICAL_SEASONAL_FOREST'; }
        else if (p.moisture > 0.16) { return 'GRASSLAND'; }
        else { return 'SUBTROPICAL_DESERT'; }
    }
};

module.exports = mapModule;