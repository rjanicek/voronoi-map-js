/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = function () {
    return {
        index: null,
      
        point: null,        // Point location
        water: null,        // lake or ocean
        ocean: null,        // ocean
        coast: null,        // land polygon touching an ocean
        border: null,       // at the edge of the map
        biome: null,          // biome type (see article)
        elevation: null,     // 0.0-1.0
        moisture: null,      // 0.0-1.0

        neighbors: null,    // Vector<Center>
        borders: null,      // Vector<Edge>
        corners: null       // Vector<Corner>
    };
};