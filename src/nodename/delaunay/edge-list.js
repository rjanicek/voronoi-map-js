/* jshint bitwise:false */

'use strict';

var halfedgeModule = require('./halfedge');
var edgeModule = require('./edge');

module.exports = function (xmin, deltax, sqrtNsites) {
    var pub = {};

    var _deltax = 0.0;
    var _xmin  = 0.0;
    
    var _hashsize = 0;
    var _hash = []; // Vector<Halfedge>;

    var _leftEnd = null; //Halfedge;
    pub.getLeftEnd = function () {
        return _leftEnd;
    };
    Object.defineProperties(pub, {
        'leftEnd': {get: function () { return pub.getLeftEnd(); }}
    });

    var _rightEnd = null; //Halfedge;
    pub.getRightEnd = function () {
        return _rightEnd;
    };
    Object.defineProperties(pub, {
        'rightEnd': {get: function () { return pub.getRightEnd(); }}
    });

    pub.dispose = function () {
        var halfEdge = _leftEnd;
        var prevHe;
        while (halfEdge !== _rightEnd) {
            prevHe = halfEdge;
            halfEdge = halfEdge.edgeListRightNeighbor;
            prevHe.dispose();
        }
        _leftEnd = null;
        _rightEnd.dispose();
        _rightEnd = null;

        var i;
        for (i = 0; i < _hashsize; i++) {
            _hash[i] = null;
        }
        _hash = null;
    };

    /**
     * Insert newHalfedge to the right of lb 
     * @param lb
     * @param newHalfedge
     * 
     */
    pub.insert = function (lb, newHalfedge) {
        newHalfedge.edgeListLeftNeighbor = lb;
        newHalfedge.edgeListRightNeighbor = lb.edgeListRightNeighbor;
        lb.edgeListRightNeighbor.edgeListLeftNeighbor = newHalfedge;
        lb.edgeListRightNeighbor = newHalfedge;
    };

    /**
     * This function only removes the Halfedge from the left-right list.
     * We cannot dispose it yet because we are still using it. 
     * @param halfEdge
     * 
     */
    pub.remove = function (halfEdge) {
        halfEdge.edgeListLeftNeighbor.edgeListRightNeighbor = halfEdge.edgeListRightNeighbor;
        halfEdge.edgeListRightNeighbor.edgeListLeftNeighbor = halfEdge.edgeListLeftNeighbor;
        halfEdge.edge = edgeModule.DELETED;
        halfEdge.edgeListLeftNeighbor = halfEdge.edgeListRightNeighbor = null;
    };


    /* Get entry from hash table, pruning any deleted nodes */
    function getHash(b) {
        var halfEdge;
    
        if (b < 0 || b >= _hashsize) {
            return null;
        }
        halfEdge = _hash[b];
        if (halfEdge !== null && halfEdge.edge === edgeModule.DELETED) {
            /* Hash table points to deleted halfedge.  Patch as necessary. */
            _hash[b] = null;
            // still can't dispose halfEdge yet!
            return null;
        } else {
            return halfEdge;
        }
    }

    /**
     * Find the rightmost Halfedge that is still left of p 
     * @param p
     * @return 
     * 
     */
    pub.edgeListLeftNeighbor = function (p) {
        var bucket;
        var halfEdge;
    
        /* Use hash table to get close to desired halfedge */
        bucket = ((p.x - _xmin) / _deltax) * _hashsize;
        if (bucket < 0) {
            bucket = 0;
        }
        if (bucket >= _hashsize) {
            bucket = _hashsize - 1;
        }
        halfEdge = getHash(bucket);
        if (halfEdge === null) {
            var i = 1;
            while (true) {
                if ((halfEdge = this.getHash(bucket - i)) !== null) {
                    break;
                }
                if ((halfEdge = this.getHash(bucket + i)) !== null) {
                    break;
                }
                
                i++;
            }
        }
        /* Now search linear list of halfedges for the correct one */
        if (halfEdge === this.getLeftEnd()  || (halfEdge !== this.getRightEnd() && halfEdge.isLeftOf(p))) {
            do {
                halfEdge = halfEdge.edgeListRightNeighbor;
            } while (halfEdge !== this.getRightEnd() && halfEdge.isLeftOf(p));
            halfEdge = halfEdge.edgeListLeftNeighbor;
        } else {
            do {
                halfEdge = halfEdge.edgeListLeftNeighbor;
            } while (halfEdge !== this.getLeftEnd() && !halfEdge.isLeftOf(p));
        }
    
        /* Update hash table and reference counts */
        if (bucket > 0 && bucket < _hashsize - 1) {
            _hash[bucket] = halfEdge;
        }
        return halfEdge;
    };

    _xmin = xmin;
    _deltax = deltax;
    _hashsize = 2 * sqrtNsites;

    //var i:Int;
    _hash = [];
    
    // two dummy Halfedges:
    _leftEnd = halfedgeModule.createDummy();
    _rightEnd = halfedgeModule.createDummy();
    _leftEnd.edgeListLeftNeighbor = null;
    _leftEnd.edgeListRightNeighbor = _rightEnd;
    _rightEnd.edgeListLeftNeighbor = _leftEnd;
    _rightEnd.edgeListRightNeighbor = null;
    _hash[0] = _leftEnd;
    _hash[_hashsize - 1] = _rightEnd;

    return pub;
};