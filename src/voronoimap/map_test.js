/* jshint camelcase:false */

'use strict';

var mapModule = require('./map');
var islandShape = require('./island-shape');
var lavaModule = require('./lava');
var roadsModule = require('./roads');
var watershedsModule = require('./watersheds');
var noisyEdgesModule = require('./noisy-edges');

var map = mapModule({width: 1000.0, height: 1000.0});
map.newIsland(islandShape.makeRadial(1), 1);
var numPoints = 100;

exports.should_place_points = function (test) {
    map.go0PlacePoints(numPoints);

    test.strictEqual(map.points.length, numPoints);
    test.done();
};

exports.should_improve_points = function (test) {
    map.go1ImprovePoints();
    test.done();
};

exports.should_build_a_graph = function (test) {
    map.go2BuildGraph();
    map.assignBiomes();
    test.done();
};

exports.should_add_features = function (test) {
    map.go3AssignElevations();
    map.go4AssignMoisture();
    map.go5DecorateMap();
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

