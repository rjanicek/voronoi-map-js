'use strict';

var _ = require('lodash');

module.exports = {

    delaunayLinesForEdges: function (edges) {
        var segments = [];
        _(edges).each(function (edge) {
            segments.push(edge.delaunayLine());
        });
        return segments;
    },

    selectEdgesForSitePoint: function (coord, edgesToTest) {
        return _(edgesToTest).filter(function (edge) {
            return ((edge.leftSite !== null && edge.leftSite.coord === coord) ||
                (edge.rightSite !== null && edge.rightSite.coord === coord));
        });
    },

    selectNonIntersectingEdges: function (keepOutMask, edgesToTest) {
        if (keepOutMask === null) {
            return edgesToTest;
        }
        
        var zeroPoint = {x: 0.0, y: 0.0};
        return _(edgesToTest).filter(function (edge) {
            var delaunayLineBmp = edge.makeDelaunayLineBmp();
            var notIntersecting = !(keepOutMask.hitTest(zeroPoint, 1, delaunayLineBmp, zeroPoint, 1));
            delaunayLineBmp.dispose();
            return notIntersecting;
        });
    },

    visibleLineSegments: function (edges) {
        var lr = require('./lr');
        var lineSegment = require('../geom/line-segment');
        var segments = [];
        
        _(edges).each(function (edge) {
            if (edge.visible) {
                var p1 = edge.clippedEnds[lr.LEFT];
                var p2 = edge.clippedEnds[lr.RIGHT];
                segments.push(lineSegment(p1, p2));
            }
        });
        
        return segments;
    }

};