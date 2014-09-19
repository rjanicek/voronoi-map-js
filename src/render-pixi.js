/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var colorModule = require('./janicek/html-color');
var convert = require('./as3/conversion-core');
var core = require('./janicek/core');
var PIXI = require('pixi.js');
var pointCore = require('./as3/point-core');
var Shape = require('shape2d');
var NoiseFilter = require('pixi-noise-filter');

exports.graphicsReset = function (context, mapWidth, mapHeight, displayColors) {
	context.stage = new PIXI.Stage(displayColors.OCEAN);
    context.root = new PIXI.DisplayObjectContainer();
    context.stage.addChild(context.root);
	context.renderer.render(context.stage);
};

// Render the polygons so that each can be seen clearly
exports.renderDebugPolygons = function (context, map, displayColors) {
	
    var color;

    if (map.centers.length === 0) {
        // We're still constructing the map so we may have some points
        
        context.fillStyle = '#dddddd';
        context.fillRect(0, 0, core.toInt(map.SIZE.width), core.toInt(map.SIZE.height) /*context.canvas.width, context.canvas.height */); //graphics.drawRect(0, 0, SIZE, SIZE);
        _(map.points).each(function (point) {
            context.beginPath();
            context.strokeStyle = '#000000';
            context.fillStyle = '#000000';
            context.arc(point.x, point.y, 1.3, Math.PI, 2 * Math.PI, false);
            context.closePath();
            context.fill();
            context.stroke();
        });
    }
    
    var graphics = new PIXI.Graphics();

    _(map.centers).each(function (p) {
        color = !_.isNull(p.biome) ? displayColors[p.biome] : (p.ocean ? displayColors.OCEAN : p.water ? displayColors.RIVER : 0xffffff);

        //Draw shape
        graphics.lineStyle();
        graphics.beginFill(colorModule.interpolateColor(color, 0xdddddd, 0.2)); 
        _(p.borders).each(function (edge) {
            if (edge.v0 && edge.v1) {
                graphics.moveTo(p.point.x, p.point.y);
                graphics.lineTo(edge.v0.point.x, edge.v0.point.y);
                graphics.lineTo(edge.v1.point.x, edge.v1.point.y);
                graphics.lineTo(p.point.x, p.point.y);
            }
        });
        graphics.endFill();

        //Draw borders
        _(p.borders).each(function (edge) {
            if (edge.v0 && edge.v1) {
                if (edge.river > 0) {
                	graphics.lineStyle(2, displayColors.RIVER);
                } else {
                	graphics.lineStyle(1, 0x000000, 0.2);
                }
                graphics.moveTo(edge.v0.point.x, edge.v0.point.y);
                graphics.lineTo(edge.v1.point.x, edge.v1.point.y);
            }
        });

        graphics.beginFill(p.water ? 0x003333 : 0x000000, 0.7);
        graphics.drawCircle(p.point.x, p.point.y, 1.3, 1.3);
        graphics.endFill();

        context.root.addChild(graphics);
        graphics = new PIXI.Graphics();        
    });

    _(map.centers).each(function (p) {
        _(p.corners).each(function (q) {
        	graphics.beginFill(q.water ? 0x0000ff : 0x009900);
            graphics.drawRect(q.point.x - 1.0, q.point.y - 1.0, 2.0, 2.0);
            graphics.endFill();
        });
    });

	context.root.addChild(graphics);
	context.renderer.render(context.stage);
};

// Render the paths from each polygon to the ocean, showing watersheds.
exports.renderWatersheds = function (context, map, watersheds) {
    var edge, w0, w1;

    var graphics = new PIXI.Graphics();

    _(map.edges).each(function (edge) {
        if (edge.d0 && edge.d1 && edge.v0 && edge.v1 && !edge.d0.ocean && !edge.d1.ocean) {
            w0 = watersheds.watersheds[edge.d0.index];
            w1 = watersheds.watersheds[edge.d1.index];
            if (w0 !== w1) {
                graphics.lineStyle(3.5, 0x000000, 0.1 * Math.sqrt((map.corners[w0].watershedSize || 1) + (map.corners[w1].watershed.watershedSize || 1)));
                graphics.moveTo(edge.v0.point.x, edge.v0.point.y);
                graphics.lineTo(edge.v1.point.x, edge.v1.point.y);
            }
        }
    });

    for (edge in map.edges) {
        if (convert.booleanFromInt(edge.river)) {
            graphics.lineStyle(1.0, 0x6699ff);
            graphics.moveTo(edge.v0.point.x, edge.v0.point.y);
            graphics.lineTo(edge.v1.point.x, edge.v1.point.y);
        }
    }

    context.root.addChild(graphics);
    context.renderer.render(context.stage);
};

function drawPathForwards(graphics, path, step) {
    for (var i = 0; i < path.length; i++) {
        graphics.lineTo(path[i].x, path[i].y);
        step && step(i, path[i].x, path[i].y);
    }
}

function drawPathBackwards(graphics, path, step) {
    for (var i = path.length - 1; i >= 0; i--) {
        graphics.lineTo(path[i].x, path[i].y);
        step && step(i, path[i].x, path[i].y);
    }
}

// Render the interior of polygons
exports.renderPolygons = function (context, colors, gradientFillProperty, colorOverrideFunction, map, noisyEdges)  {

    var graphics = new PIXI.Graphics();

    // My Voronoi polygon rendering doesn't handle the boundary
    // polygons, so I just fill everything with ocean first.
    graphics.drawRect(0, 0, map.SIZE.width, map.SIZE.height);

    context.root.addChild(graphics);
    graphics = new PIXI.Graphics();
 
    var drawPath0 = function (graphics, x, y) {
        var path = noisyEdges.path0[edge.index];
        graphics.moveTo(x, y);
        graphics.lineTo(path[0].x, path[0].y);
        drawPathForwards(graphics, path);
        graphics.lineTo(x, y);
    };

    var drawPath1 = function (graphics, x, y) {
        var path = noisyEdges.path1[edge.index];
        graphics.moveTo(x, y);
        graphics.lineTo(path[0].x, path[0].y);
        drawPathForwards(graphics, path);
        graphics.lineTo(x, y);
    };

    for (var centerIndex = 0; centerIndex < map.centers.length; centerIndex++) {
        var p = map.centers[centerIndex];
        for (var neighborIndex = 0; neighborIndex < p.neighbors.length; neighborIndex++) {
            var r = p.neighbors[neighborIndex];
            var edge = map.lookupEdgeFromCenter(p, r);
            var color = core.coalesce(colors[p.biome], 0);
            if (colorOverrideFunction !== null) {
                color = colorOverrideFunction(color, p, r, edge, colors);
            }

            if (core.isUndefinedOrNull(noisyEdges.path0[edge.index]) || core.isUndefinedOrNull(noisyEdges.path1[edge.index])) {
                // It's at the edge of the map, where we don't have
                // the noisy edges computed. TODO: figure out how to
                // fill in these edges from the voronoi library.
                continue;
            }

            if (!core.isUndefinedOrNull(gradientFillProperty)) {
                // We'll draw two triangles: center - corner0 -
                // midpoint and center - midpoint - corner1.
                var corner0 = edge.v0;
                var corner1 = edge.v1;

                // We pick the midpoint elevation/moisture between
                // corners instead of between polygon centers because
                // the resulting gradients tend to be smoother.
                var midpoint = edge.midpoint;
                var midpointAttr = 0.5 * (corner0[gradientFillProperty] + corner1[gradientFillProperty]);
                drawGradientTriangle(
                    graphics,
                    vector3d(p.point.x, p.point.y, p[gradientFillProperty]),
                    vector3d(corner0.point.x, corner0.point.y, corner0[gradientFillProperty]),
                    vector3d(midpoint.x, midpoint.y, midpointAttr),
                    [colors.GRADIENT_LOW, colors.GRADIENT_HIGH],
                    drawPath0, p.point.x, p.point.y
                );
                drawGradientTriangle(
                    graphics,
                    vector3d(p.point.x, p.point.y, p[gradientFillProperty]),
                    vector3d(midpoint.x, midpoint.y, midpointAttr),
                    vector3d(corner1.point.x, corner1.point.y, corner1[gradientFillProperty]),
                    [colors.GRADIENT_LOW, colors.GRADIENT_HIGH],
                    drawPath1, p.point.x, p.point.y
                );
            } else if (color !== colors.OCEAN) {
                graphics.beginFill(color);
                drawPath0(graphics, p.point.x, p.point.y);
                drawPath1(graphics, p.point.x, p.point.y);
                graphics.endFill();
            }
        }
    }

    context.root.addChild(graphics);
    context.renderer.render(context.stage);
};

// Render bridges across every narrow river edge. Bridges are
// straight line segments perpendicular to the edge. Bridges are
// drawn after rivers. TODO: sometimes the bridges aren't long
// enough to cross the entire noisy line river. TODO: bridges
// don't line up with curved road segments when there are
// roads. It might be worth making a shader that draws the bridge
// only when there's water underneath.
exports.renderBridges = function (context, map, roads, colors) {
    var graphics = new PIXI.Graphics();

    _(map.edges).each(function (edge) {
        if (edge.river > 0 && edge.river < 4 &&
            !edge.d0.water && !edge.d1.water &&
            (edge.d0.elevation > 0.05 || edge.d1.elevation > 0.05)) {

            var n = { x: -(edge.v1.point.y - edge.v0.point.y), y: edge.v1.point.x - edge.v0.point.x };
            pointCore.normalize(n, 0.25 + (!_.isNull(roads.road[edge.index]) ? 0.5 : 0) + 0.75 * Math.sqrt(edge.river));

            graphics.lineStyle(1.1, colors.BRIDGE);
            graphics.moveTo(edge.midpoint.x - n.x, edge.midpoint.y - n.y);
            graphics.lineTo(edge.midpoint.x + n.x, edge.midpoint.y + n.y);
        }
    });

    context.root.addChild(graphics);
    context.renderer.render(context.stage);    
};

// Render roads. We draw these before polygon edges, so that rivers overwrite roads.
exports.renderRoads = function (context, map, roads, colors) {

    var graphics = new PIXI.Graphics();

    // First draw the roads, because any other feature should draw
    // over them. Also, roads don't use the noisy lines.
    var A, B, C;
    var i, j, d, edge1, edge2, edges;

    // Helper function: find the normal vector across edge 'e' and
    // make sure to point it in a direction towards 'c'.
    function normalTowards(e, c, len) {
        // Rotate the v0-->v1 vector by 90 degrees:
        var n = { x: -(e.v1.point.y - e.v0.point.y), y: e.v1.point.x - e.v0.point.x };
        // Flip it around it if doesn't point towards c
        var d = pointCore.subtract(c, e.midpoint);
        if (n.x * d.x + n.y * d.y < 0) {
            n.x = -n.x;
            n.y = -n.y;
        }
        pointCore.normalize(n, len);
        return n;
    }
  
    _(map.centers).each(function (p) {
        if (!core.isUndefinedOrNull(roads.roadConnections[p.index])) {
            if (roads.roadConnections[p.index].length === 2) {
                // Regular road: draw a spline from one edge to the other.
                edges = p.borders;
                for (i = 0; i < edges.length; i++) {
                    edge1 = edges[i];
                    if (roads.road[edge1.index] > 0) {
                        for (j = i + 1; j < edges.length; j++) {
                            edge2 = edges[j];
                            if (roads.road[edge2.index] > 0) {
                                // The spline connects the midpoints of the edges
                                // and at right angles to them. In between we
                                // generate two control points A and B and one
                                // additional vertex C.  This usually works but
                                // not always.
                                d = 0.5 * Math.min(
                                    pointCore.distanceFromOrigin(pointCore.subtract(edge1.midpoint, p.point)),
                                    pointCore.distanceFromOrigin(pointCore.subtract(edge2.midpoint, p.point))
                                );
                                A = pointCore.add(normalTowards(edge1, p.point, d), edge1.midpoint);
                                B = pointCore.add(normalTowards(edge2, p.point, d), edge2.midpoint);
                                C = pointCore.interpolate(A, B, 0.5);

                                graphics.moveTo(edge1.midpoint.x, edge1.midpoint.y);
                                graphics.lineStyle(1.1, colors['ROAD' + roads.road[edge1.index]]);

                                var s = new Shape();
                                s.steps = 10;
                                s.moveTo(edge1.midpoint.x, edge1.midpoint.y);
                                s.quadraticCurveTo(A.x, A.y, C.x, C.y);
                                s.moveTo(C.x, C.y);
                                drawPathForwards(graphics, s.points);
                                
                                var lastPoint = s.points[s.points.length - 1];
                                
                                s = new Shape();
                                s.steps = 10;
                                s.moveTo(lastPoint.x, lastPoint.y);
                                s.quadraticCurveTo(B.x, B.y, edge2.midpoint.x, edge2.midpoint.y);
                                graphics.lineStyle(1.1, colors['ROAD' + roads.road[edge2.index]]);
                                drawPathForwards(graphics, s.points);
                            }
                        }
                    }
                }
            } else {
                // Intersection or dead end: draw a road spline from
                // each edge to the center
                _(p.borders).each(function (edge1) {
                    if (roads.road[edge1.index] > 0) {
                        d = 0.25 * pointCore.distanceFromOrigin(pointCore.subtract(edge1.midpoint, p.point));
                        A = pointCore.add(normalTowards(edge1, p.point, d), edge1.midpoint);
                        
                        graphics.moveTo(edge1.midpoint.x, edge1.midpoint.y);
                        graphics.lineStyle(1.4, colors['ROAD' + roads.road[edge1.index]]);

                        var s = new Shape();
                        s.steps = 10;
                        s.moveTo(edge1.midpoint.x, edge1.midpoint.y);
                        s.quadraticCurveTo(A.x, A.y, p.point.x, p.point.y);
                        drawPathForwards(graphics, s.points);
                    }
                });
            }
        }
    });

    context.root.addChild(graphics);
    context.renderer.render(context.stage);
};

// Render the exterior of polygons: coastlines, lake shores,
// rivers, lava fissures. We draw all of these after the polygons
// so that polygons don't overwrite any edges.
exports.renderEdges = function (context, colors, map, noisyEdges, lava, renderRivers) {
    renderRivers = core.def(renderRivers, true);
    var edge;

    for (var centerIndex = 0; centerIndex < map.centers.length; centerIndex++) {
        var p = map.centers[centerIndex];
        for (var neighborIndex = 0; neighborIndex < p.neighbors.length; neighborIndex++) {
            var r = p.neighbors[neighborIndex];
            edge = map.lookupEdgeFromCenter(p, r);

            if (core.isUndefinedOrNull(noisyEdges.path0[edge.index]) || core.isUndefinedOrNull(noisyEdges.path1[edge.index])) {
                // It's at the edge of the map
                continue;
            }

            var lineWidth = 0;
            var lineColor = 0;

            if (p.ocean !== r.ocean) {
                // One side is ocean and the other side is land -- coastline
                lineWidth = 2;
                lineColor = colors.COAST;
            } else if ((convert.intFromBoolean(p.water) > 0) !== (convert.intFromBoolean(r.water) > 0) && p.biome !== 'ICE' && r.biome !== 'ICE') {
                // Lake boundary
                lineWidth = 1;
                lineColor = colors.LAKESHORE;
            } else if (p.water || r.water) {
                // Lake interior – we don't want to draw the rivers here
                continue;
            } else if (lava.lava[edge.index]) {
                // Lava flow
                lineWidth = 1;
                lineColor = colors.LAVA;
            } else if (edge.river > 0 && renderRivers) {
                // River edge
                lineWidth = Math.sqrt(edge.river);
                lineColor = colors.RIVER;
            } else {
                continue;
            }
            
            var graphics = new PIXI.Graphics();

            var start = noisyEdges.path0[edge.index][0];
            graphics.moveTo(start.x, start.y);

            graphics.lineStyle(lineWidth, lineColor);

            drawPathForwards(graphics, noisyEdges.path0[edge.index]);

            context.root.addChild(graphics);
            graphics = new PIXI.Graphics();
            graphics.lineStyle(lineWidth, lineColor);

            drawPathBackwards(graphics, noisyEdges.path1[edge.index]);

            context.root.addChild(graphics);
        }
    }

    context.renderer.render(context.stage);
};

exports.renderAllEdges = function (context, color, alpha, map, noisyEdges) {
    var edge;

    for (var centerIndex = 0; centerIndex < map.centers.length; centerIndex++) {
        var p = map.centers[centerIndex];
        for (var neighborIndex = 0; neighborIndex < p.neighbors.length; neighborIndex++) {
            var r = p.neighbors[neighborIndex];
            edge = map.lookupEdgeFromCenter(p, r);

            if (core.isUndefinedOrNull(noisyEdges.path0[edge.index]) || core.isUndefinedOrNull(noisyEdges.path1[edge.index]) || p.water) {
                // It's at the edge of the map or water
                continue;
            }

            // edge
            
            var graphics = new PIXI.Graphics();
            graphics.moveTo(noisyEdges.path0[edge.index][0].x, noisyEdges.path0[edge.index][0].y);
            graphics.lineStyle(5, color, alpha);
            drawPathForwards(graphics, noisyEdges.path0[edge.index]);

            context.root.addChild(graphics);            
            graphics = new PIXI.Graphics();
            graphics.lineStyle(5, color, alpha);

            drawPathBackwards(graphics, noisyEdges.path1[edge.index]);

            context.root.addChild(graphics);
        }
    }
    context.renderer.render(context.stage);
};

exports.addNoise = function (context) {
    var filter = new NoiseFilter();
    filter.noiseLevelRGBA = [0.05, 0.05, 0.05, 0.0];
    context.stage.filters = [filter];
    context.renderer.render(context.stage);
};
