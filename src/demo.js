/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: false, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var canvasCore = require('./janicek/canvas');
var colorModule = require('./janicek/html-color');
var islandShape = require('./island-shape');
var lava = require('./lava');
var map = require('./map');
var mapLands = require('./map-lands');
var noisyEdges = require('./noisy-edges');
var pointSelector = require('./point-selector');
var PIXI = require('pixi.js');
var prng = require('./janicek/pseudo-random-number-generators');
var renderCanvas = require('./render-canvas');
var renderCore = require('./render-core');
var renderPixi = require('./render-pixi');
var roads = require('./roads');
var string = require('./janicek/string');
var style = require('./style');
var watersheds = require('./watersheds');

var ID_map = 'canvas';

var S_addNoise = '#addNoise';
var S_edgeNoise = '#edgeNoise';
var S_fields = '#fields';
var S_fieldset = '#fieldset';
var S_generate = '#generate';
var S_height = '#height';
var S_imageFile = '#imageFile';
var S_imageThreshold = '#imageThreshold';
var S_imageThumb = '#imageThumb';
var S_invertImage = '#invertImage';
var S_islandFactor = '#islandFactor';
var S_islandShape = '#islandShape';
var S_lakeThreshold = '#lakeThreshold';
var S_lloydIterations = '#lloydIterations';
var S_map = '#map';
var S_numberOfLands = '#numberOfLands';
var S_numberOfPoints = '#numberOfPoints';
var S_oceanRatio = '#oceanRatio';
var S_random = '#random';
var S_riverChance = '#riverChance';
var S_roadElevationThresholds = '#roadElevationThresholds';
var S_seed = '#seed';
var S_shapeRandom = '#shapeRandom';
var S_shapeSeed = '#shapeSeed';
var S_toggle = '#toggle';
var S_view = '#view';
var S_renderer = '#renderer';
var S_viewBridges = '#viewBridges';
var S_viewEdges = '#viewEdges';
var S_viewRivers = '#viewRivers';
var S_viewRoads = '#viewRoads';
var S_viewWatersheds = '#viewWatersheds';
var S_width = '#width';

var image;
var state;

function getSize() {
    return {
        width: _($(S_width).val()).parseInt(),
        height: _($(S_height).val()).parseInt()
    };
}

function updateThumb() {
    var threshold = $(S_imageThreshold).val();
    var color1 = style.displayColors.OCEAN;
    var color2 = style.displayColors.GRASSLAND;
    if ($(S_invertImage).is(':checked')) {
        var colorHold = color1;
        color1 = color2;
        color2 = colorHold;
    }
    var thresholdImageData = canvasCore.makeAverageThresholdImageData(canvasCore.getImageData(image), threshold, color1, color2);
    var imageDataUrl = canvasCore.makeImageDataUrlFromImageData(thresholdImageData);
    $(S_imageThumb).attr('src', imageDataUrl);
}

function getIntegerOrStringSeed(s) {
    if (_(s).isNumber()) {
        return _(s).parseInt();
    }
    
    return Math.abs(prng.stringToSeed(s));
}

function generate() {
    console.time('generate');

    var size = getSize();

    var state = { map : null, noisyEdges : null, roads : null, watersheds : null, lava : null };
    
    state.map = map({ width: size.width + 0.0, height: size.height + 0.0 });

    var seed = getIntegerOrStringSeed($(S_seed).val());
    var shapeSeed = getIntegerOrStringSeed($(S_shapeSeed).val());
    
    switch ($(S_islandShape).val()) {
    case 'bitmap' :
        var imageData = canvasCore.getImageData(image);
        var bitmap = canvasCore.makeAverageThresholdBitmap(imageData, _.parseInt($(S_imageThreshold).val()));
        if ($(S_invertImage).is(':checked')) {
            bitmap = canvasCore.invertBitmap(bitmap);
        }
        state.map.newIsland(islandShape.makeBitmap(bitmap), seed);
        break;
    case 'blob' :
        state.map.newIsland(islandShape.makeBlob(), seed);
        break;
    case 'noise' :
        state.map.newIsland(islandShape.makeNoise(shapeSeed), seed);
        break;
    case 'perlin' :
        state.map.newIsland(islandShape.makePerlin(shapeSeed, $(S_oceanRatio).val()), seed);
        break;
    case 'radial' :
        state.map.newIsland(islandShape.makeRadial(shapeSeed, $(S_islandFactor).val()), seed);
        break;
    case 'square' :
        state.map.newIsland(islandShape.makeSquare(), seed);
        break;
    }
    
    state.watersheds = watersheds();
    state.noisyEdges = noisyEdges();
    state.lava = lava();
    state.roads = roads();

    var ps = (function (pointSelection, width, height, seed) { switch (pointSelection) {
        case 'random': return pointSelector.generateRandom(width, height, seed);
        case 'relaxed': return pointSelector.generateRelaxed(width, height, seed, $(S_lloydIterations).val());
        case 'square': return pointSelector.generateSquare(width, height);
        case 'hex': return pointSelector.generateHexagon(width, height);
        default: throw 'unknown point selector ' + pointSelection;
    }})($('#pointSelection').val(), state.map.SIZE.width, state.map.SIZE.height, state.map.mapRandom.seed);

    var numberOfLands = $(S_numberOfLands).val();
    if (numberOfLands.length > 0) {
        mapLands.tryMutateMapPointsToGetNumberLands(state.map, ps, parseInt(numberOfLands, 10));
    } else {
        state.map.go0PlacePoints($(S_numberOfPoints).val(), ps);
        state.map.go1BuildGraph();
        state.map.go2AssignElevations($(S_lakeThreshold).val());
    }
    state.map.go3AssignMoisture($(S_riverChance).val());
    state.map.go4DecorateMap();
    
    var thresholds = $(S_roadElevationThresholds).val().split(',');
    state.roads.createRoads(state.map, thresholds);
    state.watersheds.createWatersheds(state.map);
    state.noisyEdges.buildNoisyEdges(state.map, state.lava, seed, $(S_edgeNoise).val());

    console.timeEnd('generate');
    return state;
}

// ----------------------------------------------------------------------------
// Renderers

function getCanvasContext() {
    var canvas = document.getElementById(ID_map);
    if (canvas === null) {
        canvas = document.createElement('canvas');
        canvas.id = ID_map;
        var size = getSize();
        canvas.width = size.width;
        canvas.height = size.height;
        document.body.insertBefore(canvas, document.getElementById('fieldset'));
    }
    return canvas.getContext('2d');
}

var pixiContext = null;

function getPixiContext() {
    if (!pixiContext) {
        var size = getSize();
        
        pixiContext = {
            renderer: $(S_renderer).val() === 'pixi webgl' ?
                new PIXI.WebGLRenderer(size.width, size.height) :
                new PIXI.CanvasRenderer(size.width, size.height)
        };

        var canvas = pixiContext.renderer.view;
        canvas.id = ID_map;
        document.body.insertBefore(canvas, document.getElementById('fieldset'));
    }

    return pixiContext;
}

function clearRendererContext() {
    $(ID_map).remove();
    pixiContext = null;
}

// ----------------------------------------------------------------------------
// Render

function renderWithEngine(state, context, engine) {
    
    engine.graphicsReset(context, state.map.SIZE.width, state.map.SIZE.height, style.displayColors);

    switch ($(S_view).val()) {
    case 'debug polygons':
        engine.renderDebugPolygons(context, state.map, style.displayColors);
        break;
    case 'smooth':
        engine.renderPolygons(context, style.displayColors, null, renderCore.colorWithSlope, state.map, state.noisyEdges);
        engine.renderEdges(context, style.displayColors, state.map, state.noisyEdges, state.lava, $(S_viewRivers).is(':checked'));
        break;
    }

    if ($(S_viewEdges).is(':checked')) {
        engine.renderAllEdges(context, 0xd0d0d0, 0.25, state.map, state.noisyEdges);
    }

    if ($(S_viewRoads).is(':checked')) {
        engine.renderRoads(context, state.map, state.roads, style.displayColors);
    }
    
    if ($(S_viewBridges).is(':checked')) {
        engine.renderBridges(context, state.map, state.roads, style.displayColors);
    }
    
    if ($(S_viewWatersheds).is(':checked')) {
        engine.renderWatersheds(context, state.map, state.watersheds);
    }
    
    if ($(S_addNoise).is(':checked')) {
        engine.addNoise(context, state.map.SIZE.width, state.map.SIZE.height);
    }

}

function render(state) {
    console.time('render');

    if ($(S_renderer).val() === 'canvas') {
        renderWithEngine(state, getCanvasContext(), renderCanvas);
    } else {
        renderWithEngine(state, getPixiContext(), renderPixi);
        var context = getPixiContext();
        context.renderer.render(context.stage);
    }

    console.timeEnd('render');
}

// ----------------------------------------------------------------------------
// UI

function initializeUi () {
    image = new Image();
    image.onload = function () {
        $(S_imageThumb).attr('src', image.src);
        updateThumb();
    };
    image.src = 'world-map.jpg';
    
    $(S_random).click(function () {
        $(S_seed).val(String(prng.makeRandomSeed()));
    });
    $(S_shapeRandom).click(function () {
        $(S_shapeSeed).val(String(prng.makeRandomSeed()));
    });
    
    $(S_islandShape).change(function (e) {
        $([S_islandFactor, S_oceanRatio, S_shapeSeed, S_imageFile, S_imageThumb, S_invertImage, S_imageThreshold].toString()).parent().hide();
        switch ($(S_islandShape).val()) {
        case 'bitmap':
            $([S_imageFile, S_imageThumb, S_invertImage, S_imageThreshold].toString()).parent().show();
            break;
        case 'noise':
            $(S_shapeSeed).parent().show();
            break;
        case 'perlin':
            $([S_oceanRatio, S_shapeSeed].toString()).parent().show();
            break;
        case 'radial':
            $([S_islandFactor, S_shapeSeed].toString()).parent().show();
            break;
        }
    });
    
    $(S_imageFile).change(function (e) {
        console.log('file changed');
        var fileUpload = $(S_imageFile).get()[0];
        var files = fileUpload.files;
        if (files.length === 1) {
            var file = files[0];
            if (string(file.type).startsWith('image')) {
                canvasCore.loadFileIntoImage(file, image);
            }
        }
    });

    $([S_invertImage, S_imageThreshold].toString()).change(function (e) { updateThumb(); });
    
    if ($(S_width).val().length === 0) {
        $(S_width).val($(window).width());
    }
    if ($(S_height).val().length === 0) {
        $(S_height).val($(window).height());
    }
    
    $(S_renderer).change(clearRendererContext);

    $(S_view).change(function (e) {
        switch ($(S_view).val()) {
        case 'debug polygons':
            $(S_addNoise).removeAttr('checked');
            break;
        case 'smooth':
            $(S_addNoise).attr('checked', 'true');
            break;
        }
    });
    
    $([S_renderer, S_view, S_viewRivers, S_viewRoads, S_viewBridges, S_viewWatersheds, S_viewEdges, S_addNoise].toString()).change(function (e) {
        render(state);
    });

    $(S_viewRoads).change(function (e) {
        $(S_roadElevationThresholds).parent().toggle();
    });
    
    $(S_generate).click(function () { 
        state = generate();
        render(state);
    });
    
    $(S_toggle).click(function () {
        var fields = $(S_fields);
        fields.toggle(500, function () {
            $(S_toggle).text(fields.is(':visible') ? 'hide' : 'show');
        });
    });
}

// ----------------------------------------------------------------------------
// Main

function main() {
    console.time('total');

    initializeUi();

    state = generate();

    render(state);

    console.timeEnd('total');
}

main();