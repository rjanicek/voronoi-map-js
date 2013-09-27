'use strict';

var winding = require('./winding');

var Polygon = function (vertices) {
    this._vertices = vertices;
};

Polygon.prototype = {
    area: function () {
        return Math.abs(this.signedDoubleArea() * 0.5);
    },

    winding: function () {
        var signedDoubleArea = this.signedDoubleArea();
        if (signedDoubleArea < 0) {
            return winding.CLOCKWISE;
        }
        if (signedDoubleArea > 0) {
            return winding.COUNTERCLOCKWISE;
        }
        return winding.NONE;
    },

    signedDoubleArea: function () {
        var index, nextIndex;
        var n = this._vertices.length;
        var point, next;
        var signedDoubleArea = 0;
        for (index = 0; index < n; index++) {
            nextIndex = (index + 1) % n;
            point = this._vertices[index];
            next = this._vertices[nextIndex];
            signedDoubleArea += point.x * next.y - next.x * point.y;
        }
        return signedDoubleArea;
    }
};

module.exports = function (vertices) {
    return new Polygon(vertices);
};