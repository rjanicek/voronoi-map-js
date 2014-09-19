/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

exports.displayColors = {
    // Features
    OCEAN: 0x44447a,
    COAST: 0x33335a,
    LAKESHORE: 0x225588,
    LAKE: 0x336699,
    RIVER: 0x225588,
    MARSH: 0x2f6666,
    ICE: 0x99ffff,
    BEACH: 0xa09077,
    ROAD1: 0x442211,
    ROAD2: 0x553322,
    ROAD3: 0x664433,
    BRIDGE: 0x686860,
    LAVA: 0xcc3333,

    // Terrain
    SNOW: 0xffffff,
    TUNDRA: 0xbbbbaa,
    BARE: 0x888888,
    SCORCHED: 0x555555,
    TAIGA: 0x99aa77,
    SHRUBLAND: 0x889977,
    TEMPERATE_DESERT: 0xc9d29b,
    TEMPERATE_RAIN_FOREST: 0x448855,
    TEMPERATE_DECIDUOUS_FOREST: 0x679459,
    GRASSLAND: 0x88aa55,
    SUBTROPICAL_DESERT: 0xd2b98b,
    TROPICAL_RAIN_FOREST: 0x337755,
    TROPICAL_SEASONAL_FOREST: 0x559944
};

exports.elevationGradientColors = {
    OCEAN: 0x008800,
    GRADIENT_LOW: 0x008800,
    GRADIENT_HIGH: 0xffff00
};