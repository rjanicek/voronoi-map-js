/* jshint camelcase: false */

'use strict';

var node = require('./node');

exports.make = function (test) {
    test.ok(node.make());
    test.done();
};

exports.pool_should_be_singleton = function (test) {
    var node2 = require('./node');
    test.strictEqual(node2.pool.length, 0);
    node.pool.push(node.make());
    test.strictEqual(node2.pool.length, 1);
    test.done();
};