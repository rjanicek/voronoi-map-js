/* jshint camelcase:false */

'use strict';

var hash = require('./hash');
var _ = require('lodash');

exports.should_make_djb2_hash = function (test) {
    test.ok(_(hash.djb2('text')).isNumber());
    test.done();
};