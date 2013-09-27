'use strict';

exports.intFromBoolean = function (b) {
    return b ? 1 : 0;
};

exports.booleanFromInt = function (i) {
    return (i === null) ? false : i > 0;
};