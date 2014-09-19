/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var canvasCore = require('./janicek/canvas');
var colorModule = require('./janicek/html-color');
var convert = require('./as3/conversion-core');
var core = require('./janicek/core');
var matrix = require('./as3/matrix');
var pointCore = require('./as3/point-core');
var vector3d = require('./as3/vector-3d');

exports.graphicsReset = function (c, mapWidth, mapHeight, displayColors) {
    c.lineWidth = 1.0;
    c.clearRect(0, 0, 2000, 2000);
    c.fillStyle = '#bbbbaa';
    c.fillRect(0, 0, 2000, 2000);
    c.fillStyle = colorModule.intToHexColor(displayColors.OCEAN);
    c.fillRect(0, 0, core.toInt(mapWidth), core.toInt(mapHeight));
};

exports.colorWithSmoothColors = function (color, p, q, edge, displayColors) {
    if (q !== null && p.water === q.water) {
        color = colorModule.interpolateColor(displayColors[p.biome], displayColors[q.biome], 0.25);
    }
    return color;
};

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
    
    _(map.centers).each(function (p) {
        color = !_.isNull(p.biome) ? displayColors[p.biome] : (p.ocean ? displayColors.OCEAN : p.water ? displayColors.RIVER : 0xffffff);
      
        //Draw shape
        context.beginPath();
        _(p.borders).each(function (edge) {
            if (!_.isNull(edge.v0) && !_.isNull(edge.v1)) {
                context.moveTo(p.point.x, p.point.y);
                context.lineTo(edge.v0.point.x, edge.v0.point.y);
                context.lineTo(edge.v1.point.x, edge.v1.point.y);
            }
        });
        context.closePath();
        context.fillStyle = colorModule.intToHexColor(colorModule.interpolateColor(color, 0xdddddd, 0.2));
        context.fill();

        //Draw borders
        _(p.borders).each(function (edge) {
            if (!_.isNull(edge.v0) && !_.isNull(edge.v1)) {
                context.beginPath();
                context.moveTo(edge.v0.point.x, edge.v0.point.y);
                if (edge.river > 0) {
                    context.lineWidth = 1;
                    context.strokeStyle = colorModule.intToHexColor(displayColors.RIVER);
                } else {
                    context.lineWidth = 0.1;
                    context.strokeStyle = '#000000';
                }
                context.lineTo(edge.v1.point.x, edge.v1.point.y);
                context.closePath();
                context.stroke();
            }
        });
        
        context.beginPath();
        context.fillStyle = (p.water ? '#003333' : '#000000');
        context.globalAlpha = 0.7;
        context.arc(p.point.x, p.point.y, 1.3, Math.PI, 2 * Math.PI, false);
        context.closePath();
        context.fill();
        context.globalAlpha = 1.0;
        _(p.corners).each(function (q) {
            context.fillStyle = q.water ? '#0000ff' : '#009900';
            context.fillRect(q.point.x - 0.7, q.point.y - 0.7, 1.5, 1.5);
        });
    });
};

// Render the paths from each polygon to the ocean, showing watersheds.
exports.renderWatersheds = function (graphics, map, watersheds) {
    var edge, w0, w1;

    _(map.edges).each(function (edge) {
        if (edge.d0 && edge.d1 && edge.v0 && edge.v1 && !edge.d0.ocean && !edge.d1.ocean) {
            w0 = watersheds.watersheds[edge.d0.index];
            w1 = watersheds.watersheds[edge.d1.index];
            if (w0 !== w1) {
                graphics.beginPath();
                //graphics.lineStyle(3.5, 0x000000, 0.1 * Math.sqrt((map.corners[w0].watershedSize || 1) + (map.corners[w1].watershed.watershedSize || 1)));
                graphics.lineWidth = 3.5;
                graphics.strokeStyle = colorModule.rgba(0, 0, 0, 0.1 * Math.sqrt((core.coalesce(map.corners[w0].watershedSize, 1)) + (core.coalesce(map.corners[w1].watershed.watershedSize, 1))));
                graphics.moveTo(edge.v0.point.x, edge.v0.point.y);
                graphics.lineTo(edge.v1.point.x, edge.v1.point.y);
                graphics.closePath(); //graphics.lineStyle();
                graphics.stroke();
            }
        }
    });

    for (edge in map.edges) {
        if (convert.booleanFromInt(edge.river)) {
            graphics.beginPath();
            //graphics.lineStyle(1.0, 0x6699ff);
            graphics.lineWidth = 1.0;
            graphics.strokeStyle = '#6699ff';
            graphics.moveTo(edge.v0.point.x, edge.v0.point.y);
            graphics.lineTo(edge.v1.point.x, edge.v1.point.y);
            //graphics.lineStyle();
            graphics.closePath();
            graphics.stroke();
        }
    }
};

function drawPathForwards(graphics, path) {
    for (var i = 0; i < path.length; i++) {
        graphics.lineTo(path[i].x, path[i].y);
    }
}

// Helper function for drawing triangles with gradients. This
// function sets up the fill on the graphics object, and then
// calls fillFunction to draw the desired path.
function drawGradientTriangle(graphics, v1, v2, v3, colors, fillFunction, fillX, fillY) {
    var m = matrix();

    // Center of triangle:
    var V = v1.add(v2).add(v3);
    V.scaleBy(1 / 3.0);

    // Normal of the plane containing the triangle:
    var N = v2.subtract(v1).crossProduct(v3.subtract(v1));
    N.normalize();

    // Gradient vector in x-y plane pointing in the direction of increasing z
    var G = vector3d(-N.x / N.z, -N.y / N.z, 0);

    // Center of the color gradient
    var C = vector3d(V.x - G.x * ((V.z - 0.5) / G.length / G.length), V.y - G.y * ((V.z - 0.5) / G.length / G.length));

    if (G.length < 1e-6) {
        // If the gradient vector is small, there's not much
        // difference in colors across this triangle. Use a plain
        // fill, because the numeric accuracy of 1/G.length is not to
        // be trusted.  NOTE: only works for 1, 2, 3 colors in the array
        var color = colors[0];
        if (colors.length === 2) {
            color = colorModule.interpolateColor(colors[0], colors[1], V.z);
        } else if (colors.length === 3) {
            if (V.z < 0.5) {
                color = colorModule.interpolateColor(colors[0], colors[1], V.z * 2);
            } else {
                color = colorModule.interpolateColor(colors[1], colors[2], V.z * 2 - 1);
            }
        }
        graphics.fillStyle = colorModule.intToHexColor(color); //graphics.beginFill(color);
    } else {
        // The gradient box is weird to set up, so we let Flash set up
        // a basic matrix and then we alter it:
        m.createGradientBox(1, 1, 0, 0, 0);
        m.translate(-0.5, -0.5);
        m.scale((1 / G.length), (1 / G.length));
        m.rotate(Math.atan2(G.y, G.x));
        m.translate(C.x, C.y);
        var alphas = _(colors).map(function (c) { return 1.0; });
        var spread = _(colors).map(function (c, index) { return 255 * index / (colors.length - 1); });
        //graphics.beginGradientFill(GradientType.LINEAR, colors, alphas, spread, m, SpreadMethod.PAD);
    }
    fillFunction(graphics, fillX, fillY);
    graphics.fill(); //graphics.endFill();
}

// Render the interior of polygons
exports.renderPolygons = function (graphics, colors, gradientFillProperty, colorOverrideFunction, map, noisyEdges)  {
    // My Voronoi polygon rendering doesn't handle the boundary
    // polygons, so I just fill everything with ocean first.
    graphics.fillStyle = colorModule.intToHexColor(colors.OCEAN);
    graphics.fillRect(0, 0, core.toInt(map.SIZE.width), core.toInt(map.SIZE.height));
 
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
            } else {
                graphics.fillStyle = colorModule.intToHexColor(color);
                graphics.strokeStyle = graphics.fillStyle;
                graphics.beginPath();
                drawPath0(graphics, p.point.x, p.point.y);
                drawPath1(graphics, p.point.x, p.point.y);
                graphics.closePath();
                graphics.fill();
                graphics.stroke();
            }
        }
    }
};

// Render bridges across every narrow river edge. Bridges are
// straight line segments perpendicular to the edge. Bridges are
// drawn after rivers. TODO: sometimes the bridges aren't long
// enough to cross the entire noisy line river. TODO: bridges
// don't line up with curved road segments when there are
// roads. It might be worth making a shader that draws the bridge
// only when there's water underneath.
exports.renderBridges = function (graphics, map, roads, colors) {
    _(map.edges).each(function (edge) {
        if (edge.river > 0 && edge.river < 4 &&
            !edge.d0.water && !edge.d1.water &&
            (edge.d0.elevation > 0.05 || edge.d1.elevation > 0.05)) {

            var n = { x: -(edge.v1.point.y - edge.v0.point.y), y: edge.v1.point.x - edge.v0.point.x };
            pointCore.normalize(n, 0.25 + (!_.isNull(roads.road[edge.index]) ? 0.5 : 0) + 0.75 * Math.sqrt(edge.river));
            graphics.beginPath();
            graphics.lineWidth = 1.1;
            graphics.strokeStyle = colorModule.intToHexColor(colors.BRIDGE);
            graphics.lineCap = 'square';
            graphics.moveTo(edge.midpoint.x - n.x, edge.midpoint.y - n.y);
            graphics.lineTo(edge.midpoint.x + n.x, edge.midpoint.y + n.y);
            graphics.closePath();
            graphics.stroke();
        }
    });
};

// Render roads. We draw these before polygon edges, so that rivers overwrite roads.
exports.renderRoads = function (graphics, map, roads, colors) {
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
                                graphics.beginPath();
                                graphics.lineWidth = 1.1;
                                graphics.strokeStyle = colorModule.intToHexColor(colors['ROAD' + roads.road[edge1.index]]);
                                graphics.moveTo(edge1.midpoint.x, edge1.midpoint.y);
                                graphics.quadraticCurveTo(A.x, A.y, C.x, C.y);
                                graphics.moveTo(C.x, C.y);
                                graphics.lineWidth = 1.1;
                                graphics.strokeStyle = colorModule.intToHexColor(colors['ROAD' + roads.road[edge2.index]]);
                                graphics.quadraticCurveTo(B.x, B.y, edge2.midpoint.x, edge2.midpoint.y);
                                graphics.stroke();
                                graphics.closePath();
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
                        graphics.beginPath();
                        graphics.lineWidth = 1.4;
                        graphics.strokeStyle = colorModule.intToHexColor(colors['ROAD' + roads.road[edge1.index]]);
                        graphics.moveTo(edge1.midpoint.x, edge1.midpoint.y);
                        graphics.quadraticCurveTo(A.x, A.y, p.point.x, p.point.y);
                        graphics.stroke();
                        graphics.closePath();
                    }
                });
            }
        }
    });
};

function drawPathBackwards(graphics, path) {
    var i = path.length - 1;
    while (i >= 0) {
        graphics.lineTo(path[i].x, path[i].y);
        i--;
    }
}

// Render the exterior of polygons: coastlines, lake shores,
// rivers, lava fissures. We draw all of these after the polygons
// so that polygons don't overwrite any edges.
exports.renderEdges = function (graphics, colors, map, noisyEdges, lava, renderRivers) {
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
            if (p.ocean !== r.ocean) {
                // One side is ocean and the other side is land -- coastline
                graphics.lineWidth = 2;
                graphics.strokeStyle = colorModule.intToHexColor(colors.COAST);
            } else if ((convert.intFromBoolean(p.water) > 0) !== (convert.intFromBoolean(r.water) > 0) && p.biome !== 'ICE' && r.biome !== 'ICE') {
                // Lake boundary
                graphics.lineWidth = 1;
                graphics.strokeStyle = colorModule.intToHexColor(colors.LAKESHORE);
            } else if (p.water || r.water) {
                // Lake interior – we don't want to draw the rivers here
                continue;
            } else if (lava.lava[edge.index]) {
                // Lava flow
                graphics.lineWidth = 1;
                graphics.strokeStyle = colorModule.intToHexColor(colors.LAVA);
            } else if (edge.river > 0 && renderRivers) {
                // River edge
                graphics.lineWidth = Math.sqrt(edge.river);
                graphics.strokeStyle = colorModule.intToHexColor(colors.RIVER);
            } else {
                continue;
            }
            
            graphics.beginPath();
            graphics.moveTo(noisyEdges.path0[edge.index][0].x, noisyEdges.path0[edge.index][0].y);
            drawPathForwards(graphics, noisyEdges.path0[edge.index]);
            drawPathBackwards(graphics, noisyEdges.path1[edge.index]);
            graphics.stroke();
            graphics.closePath();
        }
    }
};

exports.renderAllEdges = function (graphics, color, alpha, map, noisyEdges) {
    var edge;

    graphics.lineWidth = 5;
    graphics.strokeStyle = colorModule.intToHexColor(color);
    var savedGlobalAlpha = graphics.globalAlpha;
    graphics.globalAlpha = alpha;

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

            graphics.beginPath();
            graphics.moveTo(noisyEdges.path0[edge.index][0].x, noisyEdges.path0[edge.index][0].y);
            drawPathForwards(graphics, noisyEdges.path0[edge.index]);
            drawPathBackwards(graphics, noisyEdges.path1[edge.index]);
            graphics.stroke();
            graphics.closePath();
        }
    }

    graphics.globalAlpha = savedGlobalAlpha;
};

exports.addNoise = function (context) {
    canvasCore.addNoiseToCanvas(context, 666, 10, true);
};