'use strict';

module.exports = function () {
    return {
        index: null,
      
        point: null,  // location
        ocean: null,  // ocean
        water: null,  // lake or ocean
        coast: null,  // touches ocean and land polygons
        border: null,  // at the edge of the map
        elevation: null,  // 0.0-1.0
        moisture: null,  // 0.0-1.0

        touches: null,
        protrudes: null,
        adjacent: null,
      
        river: null,  // 0 if no river, or volume of water in river
        downslope: null,  // pointer to adjacent corner most downhill
        watershed: null,  // pointer to coastal corner, or null
        watershedSize: null
    };
};