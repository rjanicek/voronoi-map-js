/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

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