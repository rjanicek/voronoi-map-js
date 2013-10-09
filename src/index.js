/* jshint camelcase:false */
'use strict';

var _ = require('lodash');
var canvasCore = require('./janicek/canvas');
var canvasRenderModule = require('./voronoimap/canvas-render');
var colorModule = require('./janicek/html-color');
var islandShapeModule = require('./voronoimap/island-shape');
var lavaModule = require('./voronoimap/lava');
var mapModule = require('./voronoimap/map');
var noisyEdgesModule = require('./voronoimap/noisy-edges');
var prng = require('./janicek/pseudo-random-number-generators');
var roadsModule = require('./voronoimap/roads');
var string = require('./janicek/string');
var style = require('./voronoimap/style');
var watershedsModule = require('./voronoimap/watersheds');
var timer = require('./janicek/timer')();

var html = {
    ID_map: 'map',

    S_addNoise: '#addNoise',
    S_edgeNoise: '#edgeNoise',
    S_fields: '#fields',
    S_fieldset: '#fieldset',
    S_generate: '#generate',
    S_height: '#height',
    S_imageFile: '#imageFile',
    S_imageThreshold: '#imageThreshold',
    S_imageThumb: '#imageThumb',
    S_invertImage: '#invertImage',
    S_islandFactor: '#islandFactor',
    S_islandShape: '#islandShape',
    S_lakeThreshold: '#lakeThreshold',
    S_lloydIterations: '#lloydIterations',
    S_map: '#map',
    S_numberOfLands: '#numberOfLands',
    S_numberOfPoints: '#numberOfPoints',
    S_oceanRatio: '#oceanRatio',
    S_random: '#random',
    S_riverChance: '#riverChance',
    S_roadElevationThresholds: '#roadElevationThresholds',
    S_seed: '#seed',
    S_shapeRandom: '#shapeRandom',
    S_shapeSeed: '#shapeSeed',
    S_toggle: '#toggle',
    S_view: '#view',
    S_viewBridges: '#viewBridges',
    S_viewEdges: '#viewEdges',
    S_viewRivers: '#viewRivers',
    S_viewRoads: '#viewRoads',
    S_viewWatersheds: '#viewWatersheds',
    S_width: '#width'
};

var image;
var state;

function updateThumb() {
    var threshold = $(html.S_imageThreshold).val();
    var color1 = style.displayColors.OCEAN;
    var color2 = style.displayColors.GRASSLAND;
    if ($(html.S_invertImage).is(':checked')) {
        var colorHold = color1;
        color1 = color2;
        color2 = colorHold;
    }
    var thresholdImageData = canvasCore.makeAverageThresholdImageData(canvasCore.getImageData(image), threshold, color1, color2);
    var imageDataUrl = canvasCore.makeImageDataUrlFromImageData(thresholdImageData);
    $(html.S_imageThumb).attr('src', imageDataUrl);
}

function render(state) {
    var c = exports.getContext();
    canvasRenderModule.graphicsReset(c, state.map.SIZE.width, state.map.SIZE.height, style.displayColors);
    switch ($(html.S_view).val()) {
    case 'debug polygons':
        canvasRenderModule.renderDebugPolygons(c, state.map, style.displayColors);
        break;
    case 'smooth':
        canvasRenderModule.renderPolygons(c, style.displayColors, null, canvasRenderModule.colorWithSlope, state.map, state.noisyEdges);
        canvasRenderModule.renderEdges(c, style.displayColors, state.map, state.noisyEdges, state.lava, $(html.S_viewRivers).is(':checked'));
        break;
    }

    if ($(html.S_viewEdges).is(':checked')) {
        canvasRenderModule.renderAllEdges(c, colorModule.rgba(0xd0, 0xd0, 0xd0, 0.25), state.map, state.noisyEdges);
    }

    if ($(html.S_viewRoads).is(':checked')) {
        canvasRenderModule.renderRoads(c, state.map, state.roads, style.displayColors);
    }
    
    if ($(html.S_viewBridges).is(':checked')) {
        canvasRenderModule.renderBridges(c, state.map, state.roads, style.displayColors);
    }
    
    if ($(html.S_viewWatersheds).is(':checked')) {
        canvasRenderModule.renderWatersheds(c, state.map, state.watersheds);
    }
    
    if ($(html.S_addNoise).is(':checked')) {
        canvasCore.addNoiseToCanvas(c, 666, 10, true);
    }
}

exports.initializeUi = function () {
    image = new Image();
    image.onload = function () {
        $(html.S_imageThumb).attr('src', image.src);
        updateThumb();
    };
    image.src = 'world-map.jpg';
    
    $(html.S_random).click(function () {
        $(html.S_seed).val(String(prng.makeRandomSeed()));
    });
    $(html.S_shapeRandom).click(function () {
        $(html.S_shapeSeed).val(String(prng.makeRandomSeed()));
    });
    
    $(html.S_islandShape).change(function (e) {
        $([html.S_islandFactor, html.S_oceanRatio, html.S_shapeSeed, html.S_imageFile, html.S_imageThumb, html.S_invertImage, html.S_imageThreshold].toString()).parent().hide();
        switch ($(html.S_islandShape).val()) {
        case 'bitmap':
            $([html.S_imageFile, html.S_imageThumb, html.S_invertImage, html.S_imageThreshold].toString()).parent().show();
            break;
        case 'noise':
            $(html.S_shapeSeed).parent().show();
            break;
        case 'perlin':
            $([html.S_oceanRatio, html.S_shapeSeed].toString()).parent().show();
            break;
        case 'radial':
            $([html.S_islandFactor, html.S_shapeSeed].toString()).parent().show();
            break;
        }
    });
    
    $(html.S_imageFile).change(function (e) {
        console.log('file changed');
        var fileUpload = $(html.S_imageFile).get()[0];
        var files = fileUpload.files;
        if (files.length === 1) {
            var file = files[0];
            if (string(file.type).startsWith('image')) {
                canvasCore.loadFileIntoImage(file, image);
            }
        }
    });

    $([html.S_invertImage, html.S_imageThreshold].toString()).change(function (e) { updateThumb(); });
    
    if ($(html.S_width).val().length === 0) {
        $(html.S_width).val($(window).width());
    }
    if ($(html.S_height).val().length === 0) {
        $(html.S_height).val($(window).height());
    }
    
    $(html.S_view).change(function (e) {
        switch ($(html.S_view).val()) {
        case 'debug polygons':
            $(html.S_addNoise).removeAttr('checked');
            break;
        case 'smooth':
            $(html.S_addNoise).attr('checked', 'true');
            break;
        }
    });
    
    $([html.S_view, html.S_viewRivers, html.S_viewRoads, html.S_viewBridges, html.S_viewWatersheds, html.S_viewEdges, html.S_addNoise].toString()).change(function (e) {
        render(state);
    });

    $(html.S_viewRoads).change(function (e) {
        $(html.S_roadElevationThresholds).parent().toggle();
    });
    
    $(html.S_generate).click(function () { state = exports.generate(); });
    
    $(html.S_toggle).click(function () {
        var fields = $(html.S_fields);
        fields.toggle(500, function () {
            $(html.S_toggle).text(fields.is(':visible') ? 'hide' : 'show');
        });
    });
};

exports.getContext = function () {
    var canvas = document.getElementById(html.ID_map);
    return canvas.getContext('2d');
};

function findOrCreateCanvas() {
    var canvas = document.getElementById(html.ID_map);
    if (canvas === null) {
        canvas = document.createElement('canvas');
        canvas.id = html.ID_map;
        document.body.appendChild(canvas);
    }
    
    return canvas;
}

function getIntegerOrStringSeed(s) {
    if (_(s).isNumber()) {
        return _(s).parseInt();
    }
    
    return Math.abs(prng.stringToSeed(s));
}

exports.generate = function () {
    timer.start();

    var state = { map : null, noisyEdges : null, roads : null, watersheds : null, lava : null };
    
    var canvas = findOrCreateCanvas();
    canvas.width = _($(html.S_width).val()).parseInt();
    canvas.height = _($(html.S_height).val()).parseInt();
    
    state.map = mapModule({ width: canvas.width + 0.0, height: canvas.height + 0.0 });
    var seed = getIntegerOrStringSeed($(html.S_seed).val());
    var shapeSeed = getIntegerOrStringSeed($(html.S_shapeSeed).val());
    
    var islandShape = $(html.S_islandShape).val();
    
    switch (islandShape) {
    case 'bitmap' :
        var imageData = canvasCore.getImageData(image);
        var bitmap = canvasCore.makeAverageThresholdBitmap(imageData, _.parseInt($(html.S_imageThreshold).val()));
        if ($(html.S_invertImage).is(':checked')) {
            bitmap = canvasCore.invertBitmap(bitmap);
        }
        state.map.newIsland(islandShapeModule.makeBitmap(bitmap), seed);
        break;
    case 'blob' :
        state.map.newIsland(islandShapeModule.makeBlob(), seed);
        break;
    case 'noise' :
        state.map.newIsland(islandShapeModule.makeNoise(shapeSeed), seed);
        break;
    case 'perlin' :
        state.map.newIsland(islandShapeModule.makePerlin(shapeSeed, $(html.S_oceanRatio).val()), seed);
        break;
    case 'radial' :
        state.map.newIsland(islandShapeModule.makeRadial(shapeSeed, $(html.S_islandFactor).val()), seed);
        break;
    case 'square' :
        state.map.newIsland(islandShapeModule.makeSquare(), seed);
        break;
    }
    
    state.watersheds = watershedsModule();
    state.noisyEdges = noisyEdgesModule();
    state.lava = lavaModule();
    state.roads = roadsModule();
    
    var numberOfLands = $(html.S_numberOfLands).val();
    if (_(numberOfLands).isNumber()) {
        mapModule.tryMutateMapPointsToGetNumberLands(state.map, numberOfLands, 30, numberOfLands * 2);
    }
    else {
        state.map.go0PlacePoints($(html.S_numberOfPoints).val());
        state.map.go1ImprovePoints($(html.S_lloydIterations).val());
        state.map.go2BuildGraph();
        state.map.go3AssignElevations($(html.S_lakeThreshold).val());
    }
    state.map.go4AssignMoisture($(html.S_riverChance).val());
    state.map.go5DecorateMap();
    
    var thresholds = $(html.S_roadElevationThresholds).val().split(',');
    state.roads.createRoads(state.map, thresholds);
    state.watersheds.createWatersheds(state.map);
    state.noisyEdges.buildNoisyEdges(state.map, state.lava, seed, $(html.S_edgeNoise).val());

    $('#generateMs').text(timer.mark().mark);
    
    render(state);
    
    var renderTime = timer.mark();
    $('#renderMs').text(renderTime.mark);
    $('#totalMs').text(renderTime.total);

    return state;
};

// ----------------------------------------------------------------------------
// Main

function main() {
    exports.initializeUi();
    state = exports.generate();
    require('./janicek/perf').traceCounters();
}

main();