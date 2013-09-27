'use strict';

var criterionModule = require('./criterion');
var lr = require('./lr');
var vertex = require('./vertex');

var EdgeReorderer = function (origEdges, criterion) {
    if (criterion !== criterionModule.vertex && criterion !== criterionModule.site) {
        throw 'Edges: criterion must be Vertex or Site';
    }
    this.edges = [];
    this.edgeOrientations = [];
    if (origEdges.length > 0) {
        this.edges = this._reorderEdges(origEdges, criterion);
    }
};

EdgeReorderer.prototype = {

    edges: null, // Vector<Edge>
    edgeOrientations: null, // Vector<LR>

    dispose: function () {
        this.edges = null;
        this.edgeOrientations = null;
    },

    _reorderEdges: function (origEdges, criterion) {
        var i;
        var n = origEdges.length;
        var edge;
        // we're going to reorder the edges in order of traversal
        var done = []; // Vector<Boolean>
        var nDone = 0;
        
        var newEdges = []; // Vector<Edge>
        
        i = 0;
        edge = origEdges[i];
        newEdges.push(edge);
        this.edgeOrientations.push(lr.LEFT);
        var firstPoint;
        var lastPoint;
        if (criterion === criterionModule.vertex) {
            firstPoint = edge.leftVertex;
            lastPoint = edge.rightVertex;
        } else {
            firstPoint = edge.leftSite;
            lastPoint = edge.rightSite;
        }
        
        if (firstPoint === vertex.VERTEX_AT_INFINITY || lastPoint === vertex.VERTEX_AT_INFINITY) {
            return []; // Vector<Edge>;
        }
        
        done[i] = true;
        ++nDone;
        
        while (nDone < n) {
            for (i = 1; i < n; i++) {
                if (done[i]) {
                    continue;
                }
                edge = origEdges[i];
                var leftPoint;
                var rightPoint;
                if (criterion === criterionModule.vertex) {
                    leftPoint = edge.leftVertex;
                    rightPoint = edge.rightVertex;
                } else {
                    leftPoint = edge.leftSite;
                    rightPoint = edge.rightSite;
                }
                
                if (leftPoint === vertex.VERTEX_AT_INFINITY || rightPoint === vertex.VERTEX_AT_INFINITY) {
                    return []; //Vector<Edge>()
                }
                if (leftPoint === lastPoint) {
                    lastPoint = rightPoint;
                    this.edgeOrientations.push(lr.LEFT);
                    newEdges.push(edge);
                    done[i] = true;
                }
                else if (rightPoint === firstPoint) {
                    firstPoint = leftPoint;
                    this.edgeOrientations.unshift(lr.LEFT);
                    newEdges.unshift(edge);
                    done[i] = true;
                }
                else if (leftPoint === firstPoint) {
                    firstPoint = rightPoint;
                    this.edgeOrientations.unshift(lr.RIGHT);
                    newEdges.unshift(edge);
                    done[i] = true;
                }
                else if (rightPoint === lastPoint) {
                    lastPoint = leftPoint;
                    this.edgeOrientations.push(lr.RIGHT);
                    newEdges.push(edge);
                    done[i] = true;
                }
                if (done[i]) {
                    ++nDone;
                }
            }
        }
        
        return newEdges;
    }

};

module.exports = function (origEdges, criterion) {
    return new EdgeReorderer(origEdges, criterion);
};