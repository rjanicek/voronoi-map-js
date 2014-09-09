/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var mapModule = require('./map');

var api = {};

api.countLands = function (centers) {
    return _(_(centers).filter(function (c) { return !c.water; })).size();
};

// Rebuilds the map varying the number of points until desired number of land
// centers are generated or timeout is reached. Not an efficient algorithim,
// but gets the job done.
api.tryMutateMapPointsToGetNumberLands = function (map, pointSelector, numberOfLands, options) {
    options = _.defaults(options || {}, {
        timeoutMilliseconds: 10 * 1000,
        initialNumberOfPoints: numberOfLands,
        lakeThreshold: mapModule.DEFAULT_LAKE_THRESHOLD
    });

    var pointCount = options.initialNumberOfPoints;
    var startTime = Date.now();
    var targetLandCountFound = false;
    do {
        map.go0PlacePoints(pointCount, pointSelector);
        map.go1BuildGraph();
        map.go2AssignElevations(options.lakeThreshold);
        var lands = api.countLands(map.centers);
        if (lands === numberOfLands) {
            targetLandCountFound = true;
        } else {
            pointCount += (lands < numberOfLands ? 1 : -1);
        }
    } while (!targetLandCountFound && Date.now() - startTime < options.timeoutMilliseconds);
    return map;
};

module.exports = api;