'use strict';

exports.check = function (test) {
    var boundsCheck = require('./bounds-check');
    var rect = require('../../as3/rectangle')(0, 0, 1, 1);

    test.strictEqual(boundsCheck.check({x: 0.5, y: 0.5}, rect), 0);
    test.strictEqual(boundsCheck.check({x: 0.5, y: 0}, rect), boundsCheck.TOP);
    test.strictEqual(boundsCheck.check({x: 0.5, y: 1}, rect), boundsCheck.BOTTOM);

    test.done();
};