'use strict';

module.exports = function (centerX, centerY, radius) {
    return {
        center: {x: centerX, y: centerY},
        radius: radius,
        toString: function () {
            return 'Circle (center: ' + this.center + '; radius: ' + this.radius + ')';
        }
    };
};