/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var colorModule = require('./janicek/html-color');
var vector3d = require('./as3/vector-3d');

var lightVector = vector3d(-1, -1, 0);

function calculateLighting(p, r, s) {
    var A = vector3d(p.point.x, p.point.y, p.elevation);
    var B = vector3d(r.point.x, r.point.y, r.elevation);
    var C = vector3d(s.point.x, s.point.y, s.elevation);
    var normal = B.subtract(A).crossProduct(C.subtract(A));
    if (normal.z < 0) { normal.scaleBy(-1); }
    normal.normalize();
    var light = 0.5 + 35 * normal.dotProduct(lightVector);
    if (light < 0) { light = 0; }
    if (light > 1) { light = 1; }
    return light;
}

exports.colorWithSlope = function (color, p, q, edge, displayColors) {
    var r = edge.v0;
    var s = edge.v1;
    if (_.isNull(r) || _.isNull(s)) {
        // Edge of the map
        return displayColors.OCEAN;
    } else if (p.water) {
        return color;
    }

    if (q !== null && p.water === q.water) {
        color = colorModule.interpolateColor(color, displayColors[q.biome], 0.4);
    }
    var colorLow = colorModule.interpolateColor(color, 0x333333, 0.7);
    var colorHigh = colorModule.interpolateColor(color, 0xffffff, 0.3);
    var light = calculateLighting(p, r, s);
    if (light < 0.5) {
        return colorModule.interpolateColor(colorLow, color, light * 2);
    } else {
        return colorModule.interpolateColor(color, colorHigh, light * 2 - 1);
    }
};