'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            options: { debug : '<%= debug %>'},
            build: {
                src: ['src/index.js'],
                dest: 'bin/voronoi-map.js'
            }
        },
        uglify: {
            build: {
                src: ['bin/voronoi-map.js'],
                dest: 'bin/voronoi-map.js'
            }
        },
        nodeunit: {
            all: ['src/**/*_test.js']
        }
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');

    grunt.registerTask('default', ['browserify', 'uglify']);
    grunt.registerTask('debug', function () {
        grunt.config('debug', true);
        grunt.task.run('browserify');
    });
    grunt.registerTask('test', ['nodeunit']);
};