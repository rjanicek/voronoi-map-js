// Factory class to choose points for the graph

// Point selection is random for the original article, with Lloyd
// Relaxation, but there are other ways of choosing points. Grids in
// particular can be much simpler to start with, because you don't need
// Voronoi at all. HOWEVER for ease of implementation, I continue to use
// Voronoi here, to reuse the graph building code. If you're using a grid,
// generate the graph directly.

/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var prng = require('./polygonal/pm-prng');
var rectangle = require('./as3/rectangle');
var voronoiModule = require('./nodename/delaunay/voronoi');

var api = {

	// The square and hex grid point selection remove randomness from
	// where the points are; we need to inject more randomness elsewhere
	// to make the maps look better. I do this in the corner
	// elevations. However I think more experimentation is needed.
	needsMoreRandomness: function (fn) {
		return fn === api.generateSquare || fn === api.generateHexagon;	
	},

	// Generate points at random locations
	generateRandom: function (width, height, seed) {
		return function (numPoints) {
		  	var mapRandom = prng();
		  	mapRandom.seed = seed;
		  	var points = []; // Vector.<Point>

		  	for (var i = 0; i < numPoints; i++) {
		    	points.push({
		    		x: mapRandom.nextDoubleRange(10, width - 10),
		        	y: mapRandom.nextDoubleRange(10, height - 10)
		    	});
		  	}

			return points;
		};
	},

  	// Improve the random set of points with Lloyd Relaxation
	generateRelaxed: function (width, height, seed, numLloydRelaxations) {
	    numLloydRelaxations = numLloydRelaxations || 2;
	    return function (numPoints) {
			// We'd really like to generate "blue noise". Algorithms:
			// 1. Poisson dart throwing: check each new point against all
			//     existing points, and reject it if it's too close.
			// 2. Start with a hexagonal grid and randomly perturb points.
			// 3. Lloyd Relaxation: move each point to the centroid of the
			//     generated Voronoi polygon, then generate Voronoi again.
			// 4. Use force-based layout algorithms to push points away.
			// 5. More at http://www.cs.virginia.edu/~gfx/pubs/antimony/
			// Option 3 is implemented here. If it's run for too many iterations,
			// it will turn into a grid, but convergence is very slow, and we only
			// run it a few times.
			var points = api.generateRandom(width, height, seed)(numPoints);
	      	for (var i = 0; i < numLloydRelaxations; i++) {
	        	var voronoi = voronoiModule.make(points, null, rectangle(0, 0, width, height));
	        	for (var pointsIndex = 0; pointsIndex < points.length; pointsIndex++) {
	        		var p = points[pointsIndex];
		            var region = voronoi.region(p);
		            p.x = 0.0;
		            p.y = 0.0;
		            for (var regionIndex = 0; regionIndex < region.length; regionIndex++) {
		            	var q = region[regionIndex];
		                p.x += q.x;
		                p.y += q.y;
		            }
		            p.x /= region.length;
		            p.y /= region.length;
		            region.splice(0, region.length);
	          	}
	        	voronoi.dispose();
	      	}
	      	return points;
	    };
  	},

  	// Generate points on a square grid
	generateSquare: function (width, height) {
		return function (numPoints) {
		  	var points = []; // Vector.<Point>
		  	var n = Math.sqrt(numPoints);
		  	for (var x = 0; x < n; x++) {
		    	for (var y = 0; y < n; y++) {
		      		points.push({
		      			x: (0.5 + x) / n * width,
		      			y: (0.5 + y) / n * height
		      		});
		    	}
		  	}
		  	return points;
		};
	},

 	// Generate points on a hexagon grid
  	generateHexagon: function (width, height) {
		return function (numPoints) {
			var points = []; // Vector.<Point>
			var n = Math.sqrt(numPoints);
			for (var x = 0; x < n; x++) {
				for (var y = 0; y < n; y++) {
					points.push({
						x: (0.5 + x) / n * width,
						y: (0.25 + 0.5 * x % 2 + y) / n * height
					});
				}
			}
			return points;
		};
  	}

};

module.exports = api;