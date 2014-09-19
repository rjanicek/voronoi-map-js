/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

window.voronoiMap = {
    islandShape: require('./island-shape'),
    lava: require('./lava'),
    map: require('./map'),
    mapLands: require('./map-lands'),
    noisyEdges: require('./noisy-edges'),
    pointSelector: require('./point-selector'),
    renderCore: require('./render-core'),
    renderCanvas: require('./render-canvas'),
    renderPixi: require('./render-pixi'),
    roads: require('./roads'),
    style: require('./style'),
    watersheds: require('./watersheds')
};