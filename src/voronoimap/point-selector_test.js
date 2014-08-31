/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: false, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var pointSelector = require('./point-selector');

exports.needsMoreRandomness_should_work_with_functions = function (test) {

	test.ok(!pointSelector.needsMoreRandomness(pointSelector.generateRandom));
	test.ok(pointSelector.needsMoreRandomness(pointSelector.generateSquare));

	test.done();
};