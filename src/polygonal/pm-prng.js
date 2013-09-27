'use strict';

module.exports = function () {

    return {

        /**
         * set seed with a 31 bit unsigned integer
         * between 1 and 0X7FFFFFFE inclusive. don't use 0!
         */
        seed: 1,

        /**
         * provides the next pseudorandom number
         * as a float between nearly 0 and nearly 1.0.
         */
        nextDouble: function () {
            return (this.gen() / 2147483647);
        },

        /**
         * provides the next pseudorandom number
         * as an unsigned integer (31 bits) betweeen
         * a given range.
         */
        nextIntRange: function (min, max) {
            min -= 0.4999;
            max += 0.4999;
            return Math.round(min + ((max - min) * this.nextDouble()));
        },

        /**
         * provides the next pseudorandom number
         * as a float between a given range.
         */
        nextDoubleRange: function (min, max) {
            return min + ((max - min) * this.nextDouble());
        },

        /**
         * generator:
         * new-value = (old-value * 16807) mod (2^31 - 1)
         */
        gen: function () {
            //integer version 1, for max int 2^46 - 1 or larger.
            this.seed = (this.seed * 16807) % 2147483647;
            return this.seed;
            
            /**
             * integer version 2, for max int 2^31 - 1 (slowest)
             */
            //var test:int = 16807 * (seed % 127773 >> 0) - 2836 * (seed / 127773 >> 0);
            //return seed = (test > 0 ? test : test + 2147483647);
            
            /**
             * david g. carta's optimisation is 15% slower than integer version 1
             */
            //var hi:uint = 16807 * (seed >> 16);
            //var lo:uint = 16807 * (seed & 0xFFFF) + ((hi & 0x7FFF) << 16) + (hi >> 15);
            //return seed = (lo > 0x7FFFFFFF ? lo - 0x7FFFFFFF : lo);
        }
    };
};