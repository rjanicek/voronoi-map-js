'use strict';

module.exports = function () {

    var start;
    var last;

    return {
        start: function () {
            start = last = Date.now();
        },

        log: function (label) {
            var now = Date.now();
            console.log(label, now - last, now - start);
            last = now;
        }
    };
};

