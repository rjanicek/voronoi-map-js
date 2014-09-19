voronoi-map-js
==============

JavaScript port of Amit Patel's mapgen2 https://github.com/amitp/mapgen2 Map generator for games. Generates island maps with a focus on mountains, rivers, coastlines.

Based on commit: e05075cbb82851e2a3bacaa2e49e4da998894379

Flash dependencies removed.

Built with JavaScript, Node.js, JQuery, Lo-Dash, Browserify, UglifyJS, Nodeunit, Sublime Text.

[Try the demo](http://rjanicek.github.io/voronoi-map-js/)

[Install me from NPM](https://npmjs.org/package/voronoi-map)

[Fork me on GitHub](https://github.com/rjanicek/voronoi-map-js)

Installation & usage
--------------------

Using [`npm`](http://npmjs.org/):

```bash
npm install --save voronoi-map
```

In CommonJS / [Browserify](http://browserify.org/):

```js
var PIXI = require('pixi.js');

var islandShape = require('voronoi-map/island-shape');
var lavaModule = require('voronoi-map/lava');
var mapModule = require('voronoi-map/map');
var noisyEdgesModule = require('voronoi-map/noisy-edges');
var pointSelectorModule = require('voronoi-map/point-selector');
var renderCanvas = require('voronoi-map/render-canvas');
var renderPixi = require('voronoi-map/render-pixi');
var roadsModule = require('voronoi-map/roads');
var style = require('voronoi-map/style');
var watershedsModule = require('voronoi-map/watersheds');

var map = mapModule({width: 1000.0, height: 1000.0});
map.newIsland(islandShape.makeRadial(1), 1);
map.go0PlacePoints(100, pointSelectorModule.generateRandom(map.SIZE.width, map.SIZE.height, map.mapRandom.seed));
map.go1BuildGraph();
map.assignBiomes();
map.go2AssignElevations();
map.go3AssignMoisture();
map.go4DecorateMap();

var lava = lavaModule();
var roads = roadsModule();
roads.createRoads(map, [0, 0.05, 0.37, 0.64]);
var watersheds = watershedsModule();
watersheds.createWatersheds(map);
var noisyEdges = noisyEdgesModule();
noisyEdges.buildNoisyEdges(map, lava, map.mapRandom.seed);

// render with Canvas Context 2D

var canvas = document.createElement('canvas');
renderCanvas.graphicsReset(canvas, map.SIZE.width, map.SIZE.height, style.displayColors);
renderCanvas.renderDebugPolygons(canvas, map, style.displayColors);

// or render with Pixi / WebGL

var context = { renderer: new PIXI.autoDetectRenderer() };
document.body.appendChild(context.renderer.view);
renderPixi.graphicsReset(context, map.SIZE.width, map.SIZE.height, style.displayColors);
renderPixi.renderDebugPolygons(context, map, style.displayColors);
context.renderer.render(context.stage);
```

In vanilla JavaScript, all modules are exported to global `voronoiMap` object :

```html
<script type="text/javascript" src="voronoi-map.min.js"></script>
<script type="text/javascript">
	
	var map = voronoiMap.mapModule({width: 1000.0, height: 1000.0});
	...
</script>
```

Tasks
-----

* fix smooth rendering bug for square point selection
	* `canvas-render.js` ~line 300, problem is with `graphics.stroke()` original render logic only draws fill paths. HTML canvas fill path does not join other paths and shows a seam between them. stroke() worked to hide the seam but square point selection exposes a bug where some strokes are not the correct color
* fix point-selector square and hexagon so distribution is symetrical when size is asymetrical
* pixi WebGL rendering is quite slow, too slow for animation
	* moving some of the rendering functions into GLSL shaders would help, especially the noisy edges parts