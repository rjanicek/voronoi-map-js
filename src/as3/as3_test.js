/* jshint camelcase:false */

'use strict';

var _ = require('lodash');
var pointCore = require('./point-core');

// exports.should_allow_duplicate_points_as_map_keys = function (test) {
//     var p1 = { x: 1.0, y: 1.0 };
//     var p2 = { x: 1.0, y: 1.0 };
//     var d = {};
//     d[pointCore.hash(p1)] = p1;
//     d[pointCore.hash(p2)] = p2;
//     test.strictEqual(_(d).size(), 2);
//     test.done();
// };