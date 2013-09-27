/* jshint camelcase:false */

'use strict';

var color = require('./html-color');

exports.should_get_red_green_blue_color_coponents = function (test) {
    test.strictEqual(color.getRedComponent(0x112233), 0x11);
    test.strictEqual(color.getRedComponent(0x9112233), 0x11);
    test.strictEqual(color.getGreenComponent(0x112233), 0x22);
    test.strictEqual(color.getGreenComponent(0x9112233), 0x22);
    test.strictEqual(color.getBlueComponent(0x112233), 0x33);
    test.strictEqual(color.getBlueComponent(0x9112233), 0x33);

    test.done();
};

exports.should_make_html_color_strings = function (test) {
    test.strictEqual(color.hsl(0, 0.0, 0.0), 'hsl(0,0%,0%)');
    test.strictEqual(color.hsla(0, 0.0, 0.0, 0.5), 'hsla(0,0%,0%,0.5)');
    test.strictEqual(color.hsla(0, 0.5, 1.0, 1.0), 'hsla(0,50%,100%,1)');

    test.strictEqual(color.rgb(0, 0, 0), 'rgb(0,0,0)');
    test.strictEqual(color.rgba(0, 0, 0, 0), 'rgba(0,0,0,0)');
    test.strictEqual(color.rgba(0, 0, 0, 0.5), 'rgba(0,0,0,0.5)');

    test.strictEqual(color.rgbF(0.0, 0.5, 1), 'rgb(0%,50%,100%)');
    test.strictEqual(color.rgbaF(0.0, 0.5, 1.0, 0), 'rgba(0%,50%,100%,0)');
    test.strictEqual(color.rgbaF(0.0, 0.5, 1.0, 0.5), 'rgba(0%,50%,100%,0.5)');

    test.done();
};

exports.should_calculate_a_color_fraction = function (test) {
    test.strictEqual(color.colorFraction(0.0), 0);
    test.strictEqual(color.colorFraction(0.5), 127);
    test.strictEqual(color.colorFraction(1.0), 255);
    
    test.done();
};

exports.should_make_HTML_hex_color_codes = function (test) {
    test.strictEqual(color.intToHexColor(0), '#000000');
    test.strictEqual(color.intToHexColor(0xffffff), '#FFFFFF');

    test.done();
};