'use strict';

module.exports = function (x, y, width, height) {
    return {
        x: x || 0,
        y: y || 0,
        width: width || 0,
        height: height || 0
    };
};

module.exports.core = function (rectangle) {
    return {
        left: function () { return rectangle.x; },
        right: function () { return rectangle.x + rectangle.width; },
        top: function () { return rectangle.y; },
        bottom: function () { return rectangle.y + rectangle.height; }
    };
};