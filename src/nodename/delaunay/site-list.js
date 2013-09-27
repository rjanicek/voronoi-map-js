'use strict';

var _ = require('lodash');
var circle = require('../geom/circle');
var def = require('../../janicek/core').def;
var rectangle = require('../../as3/rectangle');
var siteModule = require('./site');

module.exports = function () {
    var _sites = []; // Vector<Site>
    var _currentIndex = 0;
    var _sorted = false;

    var pub = {};

    pub.dispose = function () {
        if (_sites !== null) {
            _(_sites).each(function (site) {
                site.dispose();
            });
            _sites = null;
        }
    };

    pub.push = function (site) {
        _sorted = false;
        return _sites.push(site);
    };

    Object.defineProperties(pub, {
        'length': {get: function () { return _sites.length; }}
    });

    pub.next = function () {
        if (_sorted === false) {
            throw 'SiteList::next():  sites have not been sorted';
        }
        if (_currentIndex < _sites.length) {
            return _sites[_currentIndex++];
        } else {
            return null;
        }
    };

    pub.getSitesBounds = function () {
        if (_sorted === false) {
            siteModule.sortSites(_sites);
            _currentIndex = 0;
            _sorted = true;
        }
        var xmin, xmax, ymin, ymax;
        if (_sites.length === 0) {
            return rectangle(0, 0, 0, 0);
        }
        
        xmin = Number.POSITIVE_INFINITY;
        xmax = Number.POSITIVE_INFINITY;
        _(_sites).each(function (site) {
            if (site.x < xmin) {
                xmin = site.x;
            }
            if (site.x > xmax) {
                xmax = site.x;
            }
        });
        // here's where we assume that the sites have been sorted on y:
        ymin = _sites[0].y;
        ymax = _sites[_sites.length - 1].y;
        
        return rectangle(xmin, ymin, xmax - xmin, ymax - ymin);
    };

    pub.siteColors = function (referenceImage) {
        referenceImage = def(referenceImage, null);

        var colors = []; // Vector<Int>
        _(_sites).each(function (site) {
            colors.push(referenceImage !== null ? referenceImage.getPixel(site.x, site.y) : site.color);
        });
        return colors;
    };

    pub.siteCoords = function () {
        var coords = []; // Vector<Point>
        _(_sites).each(function (site) {
            coords.push(site.coord);
        });
        return coords;
    };

    /**
     * 
     * @return the largest circle centered at each site that fits in its region;
     * if the region is infinite, return a circle of radius 0.
     * 
     */
    pub.circles = function () {
        var circles = []; // Vector<Circle>
        _(_sites).each(function (site) {
            //var radius:Number = 0;
            var nearestEdge = site.nearestEdge();
            
            var radius = (!nearestEdge.isPartOfConvexHull()) ? (nearestEdge.sitesDistance() * 0.5): 0;
            //!nearestEdge.isPartOfConvexHull() && (radius = nearestEdge.sitesDistance() * 0.5);
            circles.push(circle(site.x, site.y, radius));
        });
        return circles;
    };

    pub.regions = function (plotBounds) {
        var regions = []; // Vector<Vector<Point>>
        _(_sites).each(function (site) {
            regions.push(site.region(plotBounds));
        });
        return regions;
    };

    /**
     * 
     * @param proximityMap a BitmapData whose regions are filled with the site index values; see PlanePointsCanvas::fillRegions()
     * @param x
     * @param y
     * @return coordinates of nearest Site to (x, y)
     * 
     */
    pub.nearestSitePoint = function (proximityMap, x, y) {
        var index = proximityMap.getPixel(x, y);
        if (index > _sites.length - 1) {
            return null;
        }
        return _sites[index].coord;
    };

    return pub;
};