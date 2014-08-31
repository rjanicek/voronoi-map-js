/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: false, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var vm = require('./index');
var SIZE = 1000.0;
var map = vm.map({width: SIZE, height: SIZE});
map.newIsland(vm.islandShape.makeRadial(1), 1);
var numPoints = 100;

exports.should_place_points = function (test) {
    map.go0PlacePoints(numPoints, vm.pointSelector.generateRandom(SIZE, SIZE, map.mapRandom.seed));

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
    var lava = vm.lava();
    var roads = vm.roads();
    roads.createRoads(map, [0, 0.05, 0.37, 0.64]);
    // lava.createLava(map, map.mapRandom.nextDouble);
    var watersheds = vm.watersheds();
    watersheds.createWatersheds(map);
    var noisyEdges = vm.noisyEdges();
    noisyEdges.buildNoisyEdges(map, lava, map.mapRandom.seed);
    test.ok(roads);
    test.ok(watersheds);
    test.ok(noisyEdges);
    
    test.done();
};
