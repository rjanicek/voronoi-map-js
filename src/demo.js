/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: false, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var _ = require('lodash');
var canvasCore = require('./janicek/canvas');
var colorModule = require('./janicek/html-color');
var prng = require('./janicek/pseudo-random-number-generators');
var string = require('./janicek/string');
var timer = require('./janicek/timer')();
var vm = require('./index');

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
    var color1 = vm.style.displayColors.OCEAN;
    var color2 = vm.style.displayColors.GRASSLAND;
    if ($(html.S_invertImage).is(':checked')) {
        var colorHold = color1;
        color1 = color2;
        color2 = colorHold;
    }
    var thresholdImageData = canvasCore.makeAverageThresholdImageData(canvasCore.getImageData(image), threshold, color1, color2);
    var imageDataUrl = canvasCore.makeImageDataUrlFromImageData(thresholdImageData);
    $(html.S_imageThumb).attr('src', imageDataUrl);
}

function getContext() {
    var canvas = document.getElementById(html.ID_map);
    return canvas.getContext('2d');
}

function render(state) {
    var c = getContext();
    vm.canvasRender.graphicsReset(c, state.map.SIZE.width, state.map.SIZE.height, vm.style.displayColors);
    switch ($(html.S_view).val()) {
    case 'debug polygons':
        vm.canvasRender.renderDebugPolygons(c, state.map, vm.style.displayColors);
        break;
    case 'smooth':
        vm.canvasRender.renderPolygons(c, vm.style.displayColors, null, vm.canvasRender.colorWithSlope, state.map, state.noisyEdges);
        vm.canvasRender.renderEdges(c, vm.style.displayColors, state.map, state.noisyEdges, state.lava, $(html.S_viewRivers).is(':checked'));
        break;
    }

    if ($(html.S_viewEdges).is(':checked')) {
        vm.canvasRender.renderAllEdges(c, colorModule.rgba(0xd0, 0xd0, 0xd0, 0.25), state.map, state.noisyEdges);
    }

    if ($(html.S_viewRoads).is(':checked')) {
        vm.canvasRender.renderRoads(c, state.map, state.roads, vm.style.displayColors);
    }
    
    if ($(html.S_viewBridges).is(':checked')) {
        vm.canvasRender.renderBridges(c, state.map, state.roads, vm.style.displayColors);
    }
    
    if ($(html.S_viewWatersheds).is(':checked')) {
        vm.canvasRender.renderWatersheds(c, state.map, state.watersheds);
    }
    
    if ($(html.S_addNoise).is(':checked')) {
        canvasCore.addNoiseToCanvas(c, 666, 10, true);
    }
}

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

function generate() {
    timer.start();

    var state = { map : null, noisyEdges : null, roads : null, watersheds : null, lava : null };
    
    var canvas = findOrCreateCanvas();
    canvas.width = _($(html.S_width).val()).parseInt();
    canvas.height = _($(html.S_height).val()).parseInt();
    
    state.map = vm.map({ width: canvas.width + 0.0, height: canvas.height + 0.0 });

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
        state.map.newIsland(vm.islandShape.makeBitmap(bitmap), seed);
        break;
    case 'blob' :
        state.map.newIsland(vm.islandShape.makeBlob(), seed);
        break;
    case 'noise' :
        state.map.newIsland(vm.islandShape.makeNoise(shapeSeed), seed);
        break;
    case 'perlin' :
        state.map.newIsland(vm.islandShape.makePerlin(shapeSeed, $(html.S_oceanRatio).val()), seed);
        break;
    case 'radial' :
        state.map.newIsland(vm.islandShape.makeRadial(shapeSeed, $(html.S_islandFactor).val()), seed);
        break;
    case 'square' :
        state.map.newIsland(vm.islandShape.makeSquare(), seed);
        break;
    }
    
    state.watersheds = vm.watersheds();
    state.noisyEdges = vm.noisyEdges();
    state.lava = vm.lava();
    state.roads = vm.roads();

    var pointSelector = (function (pointSelection, width, height, seed) { switch (pointSelection) {
        case 'random': return vm.pointSelector.generateRandom(width, height, seed);
        case 'relaxed': return vm.pointSelector.generateRelaxed(width, height, seed, $(html.S_lloydIterations).val());
        case 'square': return vm.pointSelector.generateSquare(width, height);
        case 'hex': return vm.pointSelector.generateHexagon(width, height);
        default: throw 'unknown point selector ' + pointSelection;
    }})($('#pointSelection').val(), state.map.SIZE.width, state.map.SIZE.height, state.map.mapRandom.seed);

    var numberOfLands = $(html.S_numberOfLands).val();
    if (numberOfLands.length > 0) {
        vm.mapLands.tryMutateMapPointsToGetNumberLands(state.map, pointSelector, parseInt(numberOfLands, 10));
    } else {
        state.map.go0PlacePoints($(html.S_numberOfPoints).val(), pointSelector);
        state.map.go1BuildGraph();
        state.map.go2AssignElevations($(html.S_lakeThreshold).val());
    }
    state.map.go3AssignMoisture($(html.S_riverChance).val());
    state.map.go4DecorateMap();
    
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
}

function initializeUi () {
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
    
    $(html.S_generate).click(function () { state = generate(); });
    
    $(html.S_toggle).click(function () {
        var fields = $(html.S_fields);
        fields.toggle(500, function () {
            $(html.S_toggle).text(fields.is(':visible') ? 'hide' : 'show');
        });
    });
}

// ----------------------------------------------------------------------------
// Main

function main() {
    initializeUi();
    state = generate();
    require('./janicek/perf').traceCounters();
}

main();