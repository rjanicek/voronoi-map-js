voronoi-map-js
--------------

JavaScript port of Amit Patel's mapgen2 https://github.com/amitp/mapgen2 Map generator for games. Generates island maps with a focus on mountains, rivers, coastlines.

Based on commit: 671303ad1c5aff4b2f90726c1f2bcb1e58174cec

Flash dependencies removed.

Built with JavaScript, JQuery, Lo-Dash, Grunt, Browserify, UglifyJS, Nodeunit, Sublime Text.

[Try the demo](http://rjanicek.github.io/voronoi-map-js/)

[Install me from NPM](https://npmjs.org/package/voronoi-map)

[Fork me on GitHub](https://github.com/rjanicek/voronoi-map-js)

## Installation & usage

Using [`npm`](http://npmjs.org/):

```bash
npm install --save voronoi-map
```

In CommonJS / [Browserify](http://browserify.org/):

```js
var vm = require('voronoi-map');

var map = vm.map({width: 1000.0, height: 1000.0});
map.newIsland(vm.islandShape.makeRadial(1), 1);

map.go0PlacePoints(100);
map.go1ImprovePoints();
map.go2BuildGraph();
map.assignBiomes();
map.go3AssignElevations();
map.go4AssignMoisture();
map.go5DecorateMap();

var lava = vm.lava();
var roads = vm.roads();
roads.createRoads(map, [0, 0.05, 0.37, 0.64]);
var watersheds = vm.watersheds();
watersheds.createWatersheds(map);
var noisyEdges = vm.noisyEdges();
noisyEdges.buildNoisyEdges(map, lava, map.mapRandom.seed);

var canvas = document.createElement('canvas');
vm.canvasRender.graphicsReset(canvas, map.SIZE.width, map.SIZE.height, vm.style.displayColors);
vm.canvasRender.renderDebugPolygons(canvas, map, vm.style.displayColors);
```