/**
 * janicek-core-js
 * ------------------
 * My personal collection of JavaScript core libraries.
 * Copyright (c) 2013 Richard Janicek, http://www.janicek.co
 * 
 * The MIT License (MIT) http://www.opensource.org/licenses/mit-license.php
 * 
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/* jshint bitwise:false */

'use strict';

/**
 * Compute string hash using djb2 algorithm.
 * 
 * Has a good balance of being extremely fast, while providing a reasonable distribution of hash values.
 * @see http://www.cse.yorku.ca/~oz/hash.html
 */
exports.djb2 = function (string) {
    var hash = 5381;
    var i;
    for (i = 0; i < string.length; i++) {
        hash = ((hash << 5) + hash) + string.charCodeAt(i);
    }
    return hash;
};

/**
 * Compute string hash using sdbm algorithm.
 * 
 * This algorithm was created for sdbm (a public-domain reimplementation of ndbm) database library.
 * It was found to do well in scrambling bits, causing better distribution of the keys and fewer splits.
 * It also happens to be a good general hashing function with good distribution.
 * @see http://www.cse.yorku.ca/~oz/hash.html
 */
exports.sdbm = function (string) {
    var hash = 0;
    var i;
    for (i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
};

/**
 * Java's String.hashCode() method implemented in Haxe.
 * @see http://docs.oracle.com/javase/1.4.2/docs/api/java/lang/String.html#hashCode%28%29
 */
exports.javaHashCode = function (string) {
    var hash = 0;
    if (string.length === 0) { return hash; }
    for (var i = 0; i < string.length; i++) {
        hash = ((hash << 5) - hash) + string.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};