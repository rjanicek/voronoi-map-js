/* jshint es3:false */

'use strict';

module.exports = function (a, b, c) {
    var _sites = [a, b, c];
    return {
        get sites() { return _sites; },

        dispose: function () {
            _sites = null;
        }
    };
};