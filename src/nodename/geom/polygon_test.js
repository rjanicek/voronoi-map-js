'use strict';

exports.signedDoubleArea = function (test) {
    var polygon = require('./polygon');
    var winding = require('./winding');

    var square = polygon([{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 1}]);

    test.strictEqual(square.winding(), winding.COUNTERCLOCKWISE);
    test.strictEqual(square.area(), 1);

    test.done();
};