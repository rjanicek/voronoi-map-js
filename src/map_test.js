/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: false, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var mapModule = require('./map');
var islandShape = require('./island-shape');
var lavaModule = require('./lava');
var pointSelectorModule = require('./point-selector');
var roadsModule = require('./roads');
var watershedsModule = require('./watersheds');
var noisyEdgesModule = require('./noisy-edges');


var SIZE = 1000.0;

var map = mapModule({width: SIZE, height: SIZE});

map.newIsland(islandShape.makeRadial(1), 1);

var numPoints = 100;

exports.should_place_points = function (test) {
    map.go0PlacePoints(numPoints, pointSelectorModule.generateRandom(map.SIZE.width, map.SIZE.height, map.mapRandom.seed));

    test.strictEqual(map.points.length, numPoints);
    test.done();
};

exports.should_build_a_graph = function (test) {
    map.go1BuildGraph();
    map.assignBiomes();
    test.done();
};

exports.should_add_features = function (test) {
    map.go2AssignElevations();
    map.go3AssignMoisture();
    map.go4DecorateMap();
    test.done();
};

exports.should_add_edges = function (test) {
    var lava = lavaModule();
    var roads = roadsModule();
    roads.createRoads(map, [0, 0.05, 0.37, 0.64]);
    // lava.createLava(map, map.mapRandom.nextDouble);
    var watersheds = watershedsModule();
    watersheds.createWatersheds(map);
    var noisyEdges = noisyEdgesModule();
    noisyEdges.buildNoisyEdges(map, lava, map.mapRandom.seed);
    test.ok(roads);
    test.ok(watersheds);
    test.ok(noisyEdges);
    
    test.done();
};

