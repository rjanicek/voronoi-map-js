'use strict';

module.exports = {
    LEFT: 'left',
    RIGHT: 'right',

    other: function (leftRight) {
        return leftRight === this.LEFT ? this.RIGHT : this.LEFT;
    }
};