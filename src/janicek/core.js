/* jshint bitwise:false */

'use strict';

var _ = require('lodash');

module.exports = {
    /**
     * Return value or default if undefined.
     * Usefull for assigning argument default values.
     */
    def: function (value, defaultValue) {
        return _.isUndefined(value) ? defaultValue : value;
    },

    toInt: function (something) {
        return something | 0;
    },

    /**
     * Return first argument that is not undefined and not null.
     */
    coalesce: function () {
        return _.find(arguments, function (arg) {
            return !_.isNull(arg) && !_.isUndefined(arg);
        });
    },

    isUndefinedOrNull: function (thing) {
        return _.isUndefined(thing) || _.isNull(thing);
    }
};