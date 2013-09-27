'use strict';

var def = require('../../janicek/core').def;
var lrModule = require('./lr');

var _pool = []; // Vector<Halfedge>

var Halfedge = function (edge, lr) {
    edge = def(edge, null);
    lr = def(lr, null);
    this.init(edge, lr);
};

Halfedge.prototype = {
    edgeListLeftNeighbor: null,
    edgeListRightNeighbor: null,
    nextInPriorityQueue: null,
    
    edge: null,
    leftRight: null,
    vertex: null,

    // the vertex's y-coordinate in the transformed Voronoi space V*
    ystar: 0.0,

    toString: function () {
        return 'Halfedge (leftRight: ' + this.leftRight + '; vertex: ' + this.vertex + ')';
    },

    dispose: function () {
        if (this.edgeListLeftNeighbor !== null || this.edgeListRightNeighbor !== null) {
            // still in EdgeList
            return;
        }
        if (this.nextInPriorityQueue !== null) {
            // still in PriorityQueue
            return;
        }
        this.edge = null;
        this.leftRight = null;
        this.vertex = null;
        _pool.push(this);
    },

    reallyDispose: function () {
        this.edgeListLeftNeighbor = null;
        this.edgeListRightNeighbor = null;
        this.nextInPriorityQueue = null;
        this.edge = null;
        this.leftRight = null;
        this.vertex = null;
        _pool.push(this);
    },

    isLeftOf: function (p) {
        var topSite;
        var rightOfSite, above, fast;
        var dxp, dyp, dxs, t1, t2, t3, yl;
        
        topSite = this.edge.rightSite;
        rightOfSite = p.x > topSite.x;
        if (rightOfSite && this.leftRight === lrModule.LEFT) {
            return true;
        }
        if (!rightOfSite && this.leftRight === lrModule.RIGHT) {
            return false;
        }
        
        if (this.edge.a === 1.0) {
            dyp = p.y - topSite.y;
            dxp = p.x - topSite.x;
            fast = false;
            if ((!rightOfSite && this.edge.b < 0.0) || (rightOfSite && this.edge.b >= 0.0)) {
                above = dyp >= (this.edge.b * dxp);
                fast = above;
            } else {
                above = p.x + p.y * this.edge.b > this.edge.c;
                if (this.edge.b < 0.0) {
                    above = !above;
                }
                if (!above) {
                    fast = true;
                }
            }
            if (!fast) {
                dxs = topSite.x - this.edge.leftSite.x;
                above = this.edge.b * (dxp * dxp - dyp * dyp) < (dxs * dyp * (1.0 + 2.0 * dxp / dxs + this.edge.b * this.edge.b));
                if (this.edge.b < 0.0) {
                    above = !above;
                }
            }
        }
        else  { /* this.edge.b == 1.0 */
            yl = this.edge.c - this.edge.a * p.x;
            t1 = p.y - yl;
            t2 = p.x - topSite.x;
            t3 = yl - topSite.y;
            above = (t1 * t1) > (t2 * t2 + t3 * t3);
        }
        return this.leftRight === lrModule.LEFT ? above : !above;
    },

    init: function (edge, lr) {
        this.edge = edge;
        this.leftRight = lr;
        this.nextInPriorityQueue = null;
        this.vertex = null;
        return this;
    }

};

exports.create = function (edge, lr) {
    if (_pool.length > 0) {
        return _pool.pop().init(edge, lr);
    }
    else {
        return new Halfedge(edge, lr);
    }
};

exports.createDummy = function () {
    return exports.create(null, null);
};