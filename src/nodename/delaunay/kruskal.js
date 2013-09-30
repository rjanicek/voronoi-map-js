/* jshint camelcase:false */

'use strict';

var _ = require('lodash');
var def = require('../../janicek/core').def;
var lineSegmentCore = require('../geom/line-segment').core;
var nodeModule = require('./node');
var pointCore = require('../../as3/point-core');

exports.find = function (node) {
    if (node.parent === node) {
        return node;
    } else {
        var root = exports.find(node.parent);
        // this line is just to speed up subsequent finds by keeping the tree depth low:
        node.parent = root;
        return root;
    }
};

/**
*  Kruskal's spanning tree algorithm with union-find
 * Skiena: The Algorithm Design Manual, p. 196ff
 * Note: the sites are implied: they consist of the end points of the line segments
*/
exports.kruskal = function (lineSegments, type) {
    type = def(type, 'minimum');

    var nodes = {}; // Dictionary<Node>
    var mst = []; // Vector<LineSegment>
    var nodePool = []; // Vector<Node>
    
    switch (type) {
        // note that the compare functions are the reverse of what you'd expect
        // because (see below) we traverse the lineSegments in reverse order for speed
    case 'maximum':
        lineSegments.sort(lineSegmentCore.compareLengths);
        break;
    default:
        lineSegments.sort(lineSegmentCore.compareLengthsMax);
    }

    var i = lineSegments.length - 1;
    //for (var i:int = lineSegments.length; --i > -1;)
    while (i >= 0) {
        var lineSegment = lineSegments[i];
        i--;
        
        var node0 = nodes[pointCore.hash(lineSegment.p0)];
        var rootOfSet0;
        if (node0 === null) {
            node0 = nodePool.length > 0 ? nodePool.pop() : nodeModule();
            // intialize the node:
            rootOfSet0 = node0.parent = node0;
            node0.treeSize = 1;
        
            nodes[pointCore.hash(lineSegment.p0)] = node0;
        } else {
            rootOfSet0 = exports.find(node0);
        }
        
        var node1 = nodes[pointCore.hash(lineSegment.p1)];
        var rootOfSet1;
        if (node1 === null) {
            node1 = nodePool.length > 0 ? nodePool.pop() : nodeModule();
            // intialize the node:
            rootOfSet1 = node1.parent = node1;
            node1.treeSize = 1;
        
            nodes[pointCore.hash(lineSegment.p1)] = node1;
        } else {
            rootOfSet1 = exports.find(node1);
        }
        
        if (rootOfSet0 !== rootOfSet1) {   // nodes not in same set
            mst.push(lineSegment);
            
            // merge the two sets:
            var treeSize0 = rootOfSet0.treeSize;
            var treeSize1 = rootOfSet1.treeSize;
            if (treeSize0 >= treeSize1) {
                // set0 absorbs set1:
                rootOfSet1.parent = rootOfSet0;
                rootOfSet0.treeSize += treeSize1;
            } else {
                // set1 absorbs set0:
                rootOfSet0.parent = rootOfSet1;
                rootOfSet1.treeSize += treeSize0;
            }
        }
    }
    
    _(nodes).each(function (node) {
        nodePool.push(node);
    });
    
    return mst;
};