/* jshint camelcase:false */

'use strict';

var core = require('./core');

exports.def_should_return_default_value_for_undefined = function (test) {
    test.strictEqual(core.def(undefined, 'default'), 'default');
    test.strictEqual(core.def('value', 'default'), 'value');
    test.done();
};

exports.coalesce_should_coalesce_function_arguments = function (test) {
    test.strictEqual(core.coalesce(1), 1);
    test.strictEqual(core.coalesce(null, 1), 1);
    test.strictEqual(core.coalesce(null, undefined, 1), 1);
    test.done();
};