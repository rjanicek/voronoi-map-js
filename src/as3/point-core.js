/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = {

    /**
     * The length of the line segment from (0,0) to this point.
     */
    distanceFromOrigin: function (p) {
        return Math.sqrt(p.x * p.x + p.y * p.y);
    },

    distance: function (a, b) {
        return Math.sqrt(Math.pow((a.x - b.x), 2) + Math.pow((a.y - b.y), 2));
    },

    /**
     * Determines a point between two specified points. The parameter f determines where the new interpolated point is 
     * located relative to the two end points specified by parameters pt1 and pt2. The closer the value of the parameter f 
     * is to 1.0, the closer the interpolated point is to the first point (parameter pt1). The closer the value of the
     * parameter f is to 0, the closer the interpolated point is to the second point (parameter pt2).
     * @param   pt1 The first point.
     * @param   pt2 The second point.
     * @param   f The level of interpolation between the two points. Indicates where the new point will be, along the line between pt1 and pt2. If f=1, pt1 is returned; if f=0, pt2 is returned.
     * @return The new, interpolated point.
     */
    interpolate: function (pt1, pt2, f) {
        return { x: (pt1.x - pt2.x) * f + pt2.x, y: (pt1.y - pt2.y) * f + pt2.y };
    },

    /**
     * Scales the line segment between (0,0) and the current point to a set length.
     * @param   thickness The scaling value. For example, if the current point is (0,5), and you normalize it to 1, the point returned is at (0,1).
     */
    normalize: function (p, thickness) {
        if (p.x === 0 && p.y === 0) {
            p.x = thickness;
        }
        else {
            var norm = thickness / Math.sqrt(p.x * p.x + p.y * p.y);
            p.x *= norm;
            p.y *= norm;
        }
    },

    /**
     * Adds the coordinates of 2 points to create a new point.
     */
    add: function (p1, p2) {
        return { x: p2.x + p1.x, y: p2.y + p1.y };
    },

    /**
     * subtract first point and second point
     * @param   p0
     * @param   p1
     * @return
     */
    subtract: function (p0, p1) {
        return { x: p0.x - p1.x, y: p0.y - p1.y };
    },

    hash: function (p) {
        return p.x + ',' + p.y;
    }

};