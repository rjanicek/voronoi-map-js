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

// @r587

/* jshint es3:false */

'use strict';

var def = require('../janicek/core').def;

var Vector3D = function (x, y, z, w) {
    this.w = def(w, 0);
    this.x = def(x, 0);
    this.y = def(y, 0);
    this.z = def(z, 0);
};

var vector3d = function (x, y, z, w) {
    return new Vector3D(x, y, z, w);
};

Vector3D.prototype = {

    getLength: function () {
        return Math.abs(vector3d.distance(this, vector3d()));
    },
    get length() { return this.getLength(); },

    getLengthSquared: function () {
        return this.length * this.length;
    },
    get lengthSquared() { return this.getLengthSquared(); },

    add: function (a) {
        return vector3d(this.x + a.x, this.y + a.y, this.z + a.z);
    },

    clone: function () {
        return vector3d(this.x, this.y, this.z, this.w);
    },

    crossProduct: function (a) {
        return vector3d(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x, 1);
    },

    decrementBy: function (a) {
        this.x -= a.x;
        this.y -= a.y;
        this.z -= a.z;
    },

    dotProduct: function (a) {
        return this.x * a.x + this.y * a.y + this.z * a.z;
    },

    equals: function (toCompare, allFour) {
        allFour = def(allFour, false);
        return this.x === toCompare.x && this.y === toCompare.y && this.z === toCompare.z && (!allFour || this.w === toCompare.w);
    },

    incrementBy: function (a) {
        this.x += a.x;
        this.y += a.y;
        this.z += a.z;
    },

    nearEquals: function (toCompare, tolerance, allFour) {
        allFour = def(allFour, false);
        return Math.abs(this.x - toCompare.x) < tolerance &&
            Math.abs(this.y - toCompare.y) < tolerance &&
            Math.abs(this.z - toCompare.z) < tolerance &&
            (!allFour || Math.abs(this.w - toCompare.w) < tolerance);
    },

    negate: function () {
        this.x *= -1;
        this.y *= -1;
        this.z *= -1;
    },

    normalize: function () {
        var l = this.length;
        if (l !== 0) {
            this.x /= l;
            this.y /= l;
            this.z /= l;
        }
        return l;
    },

    project: function () {
        this.x /= this.w;
        this.y /= this.w;
        this.z /= this.w;
    },

    scaleBy: function (s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
    },

    subtract: function (a) {
        return vector3d(this.x - a.x, this.y - a.y, this.z - a.z);
    },

    toString: function () {
        return 'Vector3D(' + this.x + ', ' + this.y + ', ' + this.z + ')';
    }
};

vector3d.angleBetween = function (a, b) {
    var a0 = a.clone();
    a0.normalize();
    var b0 = b.clone();
    b0.normalize();
    return Math.acos(a0.dotProduct(b0));
};

vector3d.distance = function (pt1, pt2) {
    var x = pt2.x - pt1.x;
    var y = pt2.y - pt1.y;
    var z = pt2.z - pt1.z;
    
    return Math.sqrt(x * x + y * y + z * z);
};

Object.defineProperties(vector3d, {
    'X_AXIS': {get: function () { return vector3d(1, 0, 0); }}
});

Object.defineProperties(vector3d, {
    'Y_AXIS': {get: function () { return vector3d(0, 1, 0); }}
});

Object.defineProperties(vector3d, {
    'Z_AXIS': {get: function () { return vector3d(0, 0, 1); }}
});

module.exports = vector3d;