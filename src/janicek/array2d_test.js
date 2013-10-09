/* jshint camelcase:false */

'use strict';

var array2d = require('./array2d');

exports.should_get_value_at_index = function (test) {
    var a = [[1]];
    test.strictEqual(array2d(a).get(0, 0), 1);
    test.done();
};

exports.should_set_value_at_index = function (test) {
    var a = array2d();
    test.strictEqual(a.get(0, 0), null);
    a.set(0, 0, 1);
    test.strictEqual(a.get(0, 0), 1);
    test.done();
};

exports.should_compute_2d_indices_from_array_dimensions = function (test) {

    test.deepEqual(array2d.getIndices(0, 10, 1), {x: 0, y: 0});
    test.deepEqual(array2d.getIndices(9, 10, 1), {x: 9, y: 0});
    test.deepEqual(array2d.getIndices(99, 10, 1), {x: 9, y: 9});
    test.deepEqual(array2d.getIndices(90, 10, 1), {x: 0, y: 9});
    
    test.deepEqual(array2d.getIndices(0, 10, 2), {x: 0, y: 0});
    test.deepEqual(array2d.getIndices(9 * 2, 10, 2), {x: 9, y: 0});
    test.deepEqual(array2d.getIndices(99 * 2, 10, 2), {x: 9, y: 9});
    test.deepEqual(array2d.getIndices(90 * 2, 10, 2), {x: 0, y: 9});
    
    test.deepEqual(array2d.getIndices(0, 46, 4), {x: 0, y: 0});
    test.deepEqual(array2d.getIndices(5, 6, 1), {x: 5, y: 0});

    test.done();
};

exports.should_iterate_y_indexes_or_rows = function (test) {
    var a = array2d([
        [1],
        [2]
    ]);
    var row = 0;
    
    a.foreachY(function (y) {
        test.strictEqual(a.get(0, row), y[0]);
        row++;
    });

    test.strictEqual(row, a.value.length);

    test.done();
};

exports.should_iterate_x_y_indexes_or_cells = function (test) {
    var a = array2d([
        [1, 2],
        [3, 4]
    ]);
    
    a.foreachXY(function (x, y, value) {
        test.strictEqual(a.get(x, y), value);
    });
    test.done();
};

exports.should_find_index_of_anything_in_array = function (test) {
    var a = array2d([
        [1, 2],
        [3, 4]
    ]);
    
    var index = a.any(function (value) { return value === 4; });
    test.deepEqual(index, { x: 1, y: 1 });
    test.done();
};

exports.should_get_valid_dimensions_of_array = function (test) {
    var a = array2d();
    test.deepEqual(a.dimensions(), {x: 0, y: 0});
    a.set(5, 5, 1);
    test.deepEqual(a.dimensions(), {x: 6, y: 6});
    test.done();
};