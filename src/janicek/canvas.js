/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

'use strict';

var array2d = require('./array2d');
var core = require('./core');
var htmlColor = require('./html-color');
var math = require('./math');
var prng = require('./pseudo-random-number-generators');


var CANVAS_ELEMENTS_PER_PIXEL = 4;
var CANVAS_RED_OFFSET = 0;
var CANVAS_GREEN_OFFSET = 1;
var CANVAS_BLUE_OFFSET = 2;
var CANVAS_ALPHA_OFFSET = 3;


/**
 * Iterate canvas pixel array color channels.
 * Functor is called with red, green, blue, and alpha channel values for each pixel.
 * Functor can return new color channel values which will be assigned to pixel. Null values are ignored.
 * 
 * Can be used to analyze and transform a canvas pixel array.
 */
exports.renderCanvasPixelArray = function (imageData, f) {
    var pixels = imageData.data;
    var index;
    for (var i = 0; i < core.toInt(pixels.length / CANVAS_ELEMENTS_PER_PIXEL); i++) {
        index = i * CANVAS_ELEMENTS_PER_PIXEL;
        var newValues = f(index, pixels[index + CANVAS_RED_OFFSET], pixels[index + CANVAS_GREEN_OFFSET], pixels[index + CANVAS_BLUE_OFFSET], pixels[index + CANVAS_ALPHA_OFFSET]);
        if (newValues !== null) {
            if (newValues.red !== null) {
                pixels[index + CANVAS_RED_OFFSET] = newValues.red;
            }
            if (newValues.green !== null) {
                pixels[index + CANVAS_GREEN_OFFSET] = newValues.green;
            }
            if (newValues.blue !== null) {
                pixels[index + CANVAS_BLUE_OFFSET] = newValues.blue;
            }
            if (newValues.alpha !== null) {
                pixels[index + CANVAS_ALPHA_OFFSET] = newValues.alpha;
            }
        }
    }
};

/**
 * Add random noise to image data by modifying each pixel color channel by a random amount between + and - noiseLevel.
 * @param   noiseLevel Value between 1 and 255
 * @param   grayScale True to change all color channels by same amount so only brightness of pixel is changed and not color. Doesn't affect alpha. (Default = false)
 * @param   red Add noise to red channel. (Default = true)
 * @param   green Add noise to green channel. (Default = true)
 * @param   blue Add noise to blue channel. (Default = true)
 * @param   alpha Add noise to alpha channel. (Default = false)
 * @return  New bitmap containing the bitmap passed in with noise added.
 */
exports.addNoise = function (pixelData, randomSeed, noiseLevel, grayScale, changeRed, changeGreen, changeBlue, changeAlpha) {

    grayScale = core.def(grayScale, false);
    changeRed = core.def(changeRed, true);
    changeGreen = core.def(changeGreen, true);
    changeBlue = core.def(changeBlue, true);
    changeAlpha = core.def(changeAlpha, false);

    var gen = prng.randomGenerator(randomSeed, prng.nextParkMiller);

    noiseLevel = math.clamp(noiseLevel, 1, 255);
    var delta;
    
    exports.renderCanvasPixelArray(pixelData, function (index, red, green, blue, alpha) {
        delta = prng.toIntRange(gen(), -noiseLevel, noiseLevel);
        var newColors = { red: null, green: null, blue: null, alpha: null };
        if (changeRed) {
            newColors.red = red + delta;
        }
        if (changeGreen) {
            newColors.green = green + (grayScale ? delta : prng.toIntRange(gen(), -noiseLevel, noiseLevel));
        }
        if (changeBlue) {
            newColors.blue = blue + (grayScale ? delta : prng.toIntRange(gen(), -noiseLevel, noiseLevel));
        }
        if (changeAlpha) {
            newColors.alpha = alpha + prng.toIntRange(gen(), -noiseLevel, noiseLevel);
        }
        return newColors;
    });
    
    return pixelData;
};

/**
 * Add noise to canvas.
 * @param   context Canvas drawing context.
 * @param   randomSeed Random seed to use to make random noise.
 * @param   noiseLevel Value between 1 and 255
 * @param   grayScale True to change all color channels by same amount so only brightness of pixel is changed and not color. Doesn't affect alpha. (Default = false)
 * @param   red Add noise to red channel. (Default = true)
 * @param   green Add noise to green channel. (Default = true)
 * @param   blue Add noise to blue channel. (Default = true)
 * @param   alpha Add noise to alpha channel. (Default = false)
 */
exports.addNoiseToCanvas = function (context, randomSeed, noiseLevel, grayScale, red, green, blue, alpha) {
    grayScale = core.def(grayScale, false);
    red = core.def(red, true);
    green = core.def(green, true);
    blue = core.def(blue, true);
    alpha = core.def(alpha, false);

    var imageData = context.getImageData(0, 0, context.canvas.width, context.canvas.height);
    imageData = exports.addNoise(imageData, randomSeed, noiseLevel, grayScale, red, green, blue, alpha);
    context.putImageData(imageData, 0, 0);
};

// ------------------------------------------------------------------------
// Images

/**
 * Load a file into an image.
 */
exports.loadFileIntoImage = function (file, img) {
    var reader = new FileReader();
    reader.onload = function (event) {
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
};

/**
 * Get image data from an HTML image.
 */
exports.getImageData = function (image) {
    var canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return imageData;
};

/**
 * Make image data URL from image data.
 */
exports.makeImageDataUrlFromImageData = function (imageData) {
    var canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas.toDataURL();
};

// ------------------------------------------------------------------------
// Monochrome Converters

/**
 * Converts HTML5 image data to monochrome image data by comparing the average of each color channel to a
 * threshold value to determine which color channels are converted to target monochrome colors.
 * @param   threshold Value between 0 and 255.
 * @param   lessthanThresholdColor Color to use for pixels below threshold.
 * @param   greaterthanOrEqualToThresholdColor Color to use for pixels equal to or above threshold.
 * @param   alpha Optioal alpha to assign to result pixels. (default = 1.0)
 */
exports.makeAverageThresholdImageData = function (imageData, threshold, lessthanThresholdColor, greaterthanOrEqualToThresholdColor, alpha) {
    alpha = core.def(alpha, 1.0);
    var intAlpha = htmlColor.colorFraction(alpha);
    exports.renderCanvasPixelArray(imageData, function (index, red, green, blue, alpha) {
        var color = math.average([red, green, blue]) >= threshold ? greaterthanOrEqualToThresholdColor : lessthanThresholdColor;
        return {
            red : htmlColor.getRedComponent(color),
            green : htmlColor.getGreenComponent(color),
            blue : htmlColor.getBlueComponent(color),
            alpha : intAlpha
        };
    });
    return imageData;
};

/**
 * Convert image to monochrome bitmap boolean array.
 * Converts HTML5 image data to a 2D Array of Bool by comparing the average of each color channel to a
 * threshold value to determine which color channels are converted to 0 and 1.
 * @param {ImageData} imageData Image data
 * @param {int} threshold Value between 0 and 255.
 */
exports.makeAverageThresholdBitmap = function (imageData, threshold) {
    threshold = math.clamp(threshold, 0, 255);
    return exports.makeBitmap(imageData, function (red, green, blue, alpha) {
        return math.average([red, green, blue]) >= threshold;
    });
};

/**
 * Make a boolean array from html image data.
 * @param {ImageData} imageData Image data
 * @returns {[[bool]]} bitmap
 */
exports.makeBitmap = function (imageData, f) {
    var array = array2d([]);
    var imageDataWidth = core.toInt(imageData.width);
    exports.renderCanvasPixelArray(imageData, function (index, red, green, blue, alpha) {
        var indices = array2d.getIndices(index, imageDataWidth, CANVAS_ELEMENTS_PER_PIXEL);
        array.set(indices.x, indices.y, f(red, green, blue, alpha));
        return null;
    });
    return array.value;
};

/**
 * Inverts an array of bool.
 * @param   bitmap Array of bool to invert.
 * @param {[[bool]]} bitmap
 * @returns {[[bool]]} Inverted array of bool.
 */
exports.invertBitmap = function (bitmap) {
    var bm = array2d(bitmap);
    bm.foreachXY(function (x, y, value) {
        bm.set(x, y, !value);
    });
    return bm.value;
};