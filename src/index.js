/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

module.exports = {
    canvasRender: require('./voronoimap/canvas-render'),
    islandShape: require('./voronoimap/island-shape'),
    lava: require('./voronoimap/lava'),
    map: require('./voronoimap/map'),
    mapLands: require('./voronoimap/map-lands'),
    noisyEdges: require('./voronoimap/noisy-edges'),
    pointSelector: require('./voronoimap/point-selector'),
    roads: require('./voronoimap/roads'),
    style: require('./voronoimap/style'),
    watersheds: require('./voronoimap/watersheds')
};