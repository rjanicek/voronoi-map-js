'use strict';

module.exports = function (string) {
    return {
        startsWith: function (pattern) {
            return string.indexOf(pattern) === 0;
        }
    };
};