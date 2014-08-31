/* jshint 
    browser: true, jquery: true, node: true,
    bitwise: true, camelcase: true, curly: true, eqeqeq: true, es3: true, evil: true, expr: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, noarg: true, noempty: true, nonew: true, quotmark: single, regexdash: true, strict: true, sub: true, trailing: true, undef: true, unused: vars, white: true
*/

/**
 * Copyright (c) 2010, Jeash contributors.
 * 
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 *   - Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   - Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/*

   Contrary to any adobe documentation , points transform with:


   [ X'  Y'  ]   =  [ X  Y  1 ] [  a   b ]
   [  c   d ]
   [  tx  ty]


 */

'use strict';

var core = require('../janicek/core');
var def = core.def;


var matrix = function (inA, inB, inC, inD, inTx, inTy) {
    
    var pub = {

        a: def(inA, 1.0),
        b: def(inB, 0.0),
        c: def(inC, 0.0),
        d: def(inD, 1.0),
        tx: def(inTx, 0.0),
        ty: def(inTy, 0.0),

        clone: function () { return matrix(pub.a, pub.b, pub.c, pub.d, pub.tx, pub.ty); },

        createGradientBox: function (inWidth, inHeight, rotation, inTx, inTy) {
            pub.a = inWidth / 1638.4;
            pub.d = inHeight / 1638.4;

            // rotation is clockwise
            if (!core.isUndefinedOrNull(rotation) && rotation !== 0.0) {
                var cos = Math.cos(rotation);
                var sin = Math.sin(rotation);
                pub.b = sin * pub.d;
                pub.c = -sin * pub.a;
                pub.a *= cos;
                pub.d *= cos;
            } else {
                pub.b = pub.c = 0;
            }

            pub.tx = !core.isUndefinedOrNull(inTx) ? inTx + inWidth / 2 : inWidth / 2;
            pub.ty = !core.isUndefinedOrNull(inTy) ? inTy + inHeight / 2 : inHeight / 2;
        },

        setRotation: function (inTheta, inScale) {
            var scale = core.isUndefinedOrNull(inScale) ? 1.0 : inScale;
            pub.a = Math.cos(inTheta) * scale;
            pub.c = Math.sin(inTheta) * scale;
            pub.b = -pub.c;
            pub.d = pub.a;
        },

        invert: function () {
            var norm = pub.a * pub.d - pub.b * pub.c;
            if (norm === 0) {
                pub.a = pub.b = pub.c = pub.d = 0;
                pub.tx = -pub.tx;
                pub.ty = -pub.ty;
            } else {
                norm = 1.0 / norm;
                var a1 = pub.d * norm;
                pub.d = pub.a * norm;
                pub.a = a1;
                pub.b *= -norm;
                pub.c *= -norm;

                var tx1 = - pub.a * pub.tx - pub.c * pub.ty;
                pub.ty = - pub.b * pub.tx - pub.d * pub.ty;
                pub.tx = tx1;
            }
            return this;
        },

        transformPoint: function (inPos) {
            return {x: inPos.x * pub.a + inPos.y * pub.c + pub.tx, y: inPos.x * pub.b + inPos.y * pub.d + pub.ty };
        },

        translate: function (inDX, inDY) {
            pub.tx += inDX;
            pub.ty += inDY;
        },

        /*
           Rotate object "after" other transforms

           [  a  b   0 ][  ma mb  0 ]
           [  c  d   0 ][  mc md  0 ]
           [  tx ty  1 ][  mtx mty 1 ]

           ma = md = cos
           mb = -sin
           mc = sin
           mtx = my = 0

         */

        rotate: function (inTheta) {
            var cos = Math.cos(inTheta);
            var sin = Math.sin(inTheta);

            var a1 = pub.a * cos - pub.b * sin;
            pub.b = pub.a * sin + pub.b * cos;
            pub.a = a1;

            var c1 = pub.c * cos - pub.d * sin;
            pub.d = pub.c * sin + pub.d * cos;
            pub.c = c1;

            var tx1 = pub.tx * cos - pub.ty * sin;
            pub.ty = pub.tx * sin + pub.ty * cos;
            pub.tx = tx1;
        },

        /*

           Scale object "after" other transforms

           [  a  b   0 ][  sx  0   0 ]
           [  c  d   0 ][  0   sy  0 ]
           [  tx ty  1 ][  0   0   1 ]
         */
        scale: function (inSX, inSY) {
            pub.a *= inSX;
            pub.b *= inSY;

            pub.c *= inSX;
            pub.d *= inSY;

            pub.tx *= inSX;
            pub.ty *= inSY;
        },

        /*

           A "translate" . concat "rotate" rotates the translation component.
           ie,

           [X'] = [X][trans][rotate]


           Multiply "after" other transforms ...


           [  a  b   0 ][  ma mb  0 ]
           [  c  d   0 ][  mc md  0 ]
           [  tx ty  1 ][  mtx mty 1 ]


         */
        concat: function (m) {
            var a1 = pub.a * m.a + pub.b * m.c;
            pub.b = pub.a * m.b + pub.b * m.d;
            pub.a = a1;

            var c1 = pub.c * m.a + pub.d * m.c;
            pub.d = pub.c * m.b + pub.d * m.d;
            pub.c = c1;

            var tx1 = pub.tx * m.a + pub.ty * m.c + m.tx;
            pub.ty = pub.tx * m.b + pub.ty * m.d + m.ty;
            pub.tx = tx1;
        },

        mult: function (m) {
            var result = matrix();
            result.a = pub.a * m.a + pub.b * m.c;
            result.b = pub.a * m.b + pub.b * m.d;
            result.c = pub.c * m.a + pub.d * m.c;
            result.d = pub.c * m.b + pub.d * m.d;

            result.tx = pub.tx * m.a + pub.ty * m.c + m.tx;
            result.ty = pub.tx * m.b + pub.ty * m.d + m.ty;
            return result;
        },

        identity: function () {
            pub.a = 1;
            pub.b = 0;
            pub.c = 0;
            pub.d = 1;
            pub.tx = 0;
            pub.ty = 0;
        },

        toMozString: function () {
            var m = 'matrix(';
            m += pub.a + ', ';
            m += pub.b + ', ';
            m += pub.c + ', ';
            m += pub.d + ', ';
            m += pub.tx + 'px, ';
            m += pub.ty + 'px)';
            return m;
        },

        toString: function () {
            var m = 'matrix(';
            m += pub.a + ', ';
            m += pub.b + ', ';
            m += pub.c + ', ';
            m += pub.d + ', ';
            m += pub.tx + ', ';
            m += pub.ty + ')';
            return m;
        }
    };

    return pub;
};

module.exports = matrix;