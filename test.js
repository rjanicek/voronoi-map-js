/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var glob = require('glob');
var nodeunit = require('nodeunit');
var reporter = nodeunit.reporters.default;

var pattern = process.argv.length === 3 ? process.argv[2] : '';

glob('src/**/*' + pattern + '*_test.js', function (er, files) {
    reporter.run(files, null, function () {
        process.exit();
    });
});