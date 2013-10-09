'use strict';

module.exports = function () {

    var start;
    var last;

    return {
        start: function () {
            start = last = Date.now();
        },

        mark: function () {
            var now = Date.now();
            var times = { mark: now - last, total: now - start };
            last = now;
            return times;
        }
    };
};

