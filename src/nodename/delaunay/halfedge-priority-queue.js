/* jshint bitwise:false */

'use strict';

var halfedgeModule = require('./halfedge');
var core = require('../../janicek/core');

module.exports = function (ymin, deltay, sqrtNsites) {
    var pub = {};

    var _hash = null; //Vector<Halfedge>
    var _count = 0;
    var _minBucket = 0;
    var _hashsize = 0;
    
    var _ymin = 0.0;
    var _deltay = 0.0;

    function initialize() {
        var i;

        _count = 0;
        _minBucket = 0;
        _hash = [];
        // dummy Halfedge at the top of each hash
        for (i = 0; i < _hashsize; i++) {
            _hash[i] = halfedgeModule.createDummy();
            _hash[i].nextInPriorityQueue = null;
        }
    }

    function bucket(halfEdge) {
        var theBucket = core.toInt((halfEdge.ystar - _ymin) / _deltay * _hashsize);
        if (theBucket < 0) {
            theBucket = 0;
        }
        if (theBucket >= _hashsize) {
            theBucket = _hashsize - 1;
        }
        return theBucket;
    }

    pub.dispose = function () {
        // get rid of dummies
        var i;
        for (i = 0; i < _hashsize; i++) {
            _hash[i].dispose();
            _hash[i] = null;
        }
        _hash = null;
    };

    pub.insert = function (halfEdge) {
        var previous, next;
        var insertionBucket = bucket(halfEdge);

        if (insertionBucket < _minBucket) {
            _minBucket = insertionBucket;
        }
        previous = _hash[insertionBucket];
        while ((next = previous.nextInPriorityQueue) !== null &&
            (halfEdge.ystar  > next.ystar || (halfEdge.ystar === next.ystar && halfEdge.vertex.x > next.vertex.x))) {
            previous = next;
        }
        halfEdge.nextInPriorityQueue = previous.nextInPriorityQueue;
        previous.nextInPriorityQueue = halfEdge;
        ++_count;
    };

    pub.remove = function (halfEdge) {
        var previous;
        var removalBucket = bucket(halfEdge);
        
        if (halfEdge.vertex !== null) {
            previous = _hash[removalBucket];
            while (previous.nextInPriorityQueue !== halfEdge) {
                previous = previous.nextInPriorityQueue;
            }
            previous.nextInPriorityQueue = halfEdge.nextInPriorityQueue;
            _count--;
            halfEdge.vertex = null;
            halfEdge.nextInPriorityQueue = null;
            halfEdge.dispose();
        }
    };

    function isEmpty(bucket) {
        return (_hash[bucket].nextInPriorityQueue === null);
    }

     /**
     * move _minBucket until it contains an actual Halfedge (not just the dummy at the top); 
     * 
     */
    function adjustMinBucket() {
        while (_minBucket < _hashsize - 1 && isEmpty(_minBucket)) {
            ++_minBucket;
        }
    }

    pub.empty = function () {
        return _count === 0;
    };

    /**
     * @return coordinates of the Halfedge's vertex in V*, the transformed Voronoi diagram
     * 
     */
    pub.min = function () {
        adjustMinBucket();
        var answer = _hash[_minBucket].nextInPriorityQueue;
        return {x: answer.vertex.x, y: answer.ystar};
    };

    /**
     * remove and return the min Halfedge
     * @return 
     * 
     */
    pub.extractMin = function () {
        var answer;
    
        // get the first real Halfedge in _minBucket
        answer = _hash[_minBucket].nextInPriorityQueue;
        
        _hash[_minBucket].nextInPriorityQueue = answer.nextInPriorityQueue;
        _count--;
        answer.nextInPriorityQueue = null;
        
        return answer;
    };


    _ymin = ymin;
    _deltay = deltay;
    _hashsize = 4 * sqrtNsites;
    initialize();

    return pub;
};