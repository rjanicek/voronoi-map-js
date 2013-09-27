/* jshint bitwise: false */

'use strict';

module.exports = {
    TOP: 1,
    BOTTOM: 2,
    LEFT: 4,
    RIGHT: 8,

    /**
     * 
     * @param point
     * @param bounds
     * @return an int with the appropriate bits set if the Point lies on the corresponding bounds lines
     * 
     */
    check: function (point, bounds) {
        bounds = require('../../as3/rectangle').core(bounds);
        var value = 0;
        if (point.x === bounds.left()) {
            value |= this.LEFT;
        }
        if (point.x === bounds.right()) {
            value |= this.RIGHT;
        }
        if (point.y === bounds.top()) {
            value |= this.TOP;
        }
        if (point.y === bounds.bottom()) {
            value |= this.BOTTOM;
        }
        return value;
    }
};