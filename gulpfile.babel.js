'use strict';

import gulp from 'gulp';
import path from 'path';
import gulpLoadPlugins from 'gulp-load-plugins';
import pjson from './package.json';
import minimist from 'minimist';
import wrench from 'wrench';
import spritesmith from 'gulp.spritesmith';
import browserSyncLib from 'browser-sync';

// Load all gulp plugins based on their names
// EX: gulp-copy -> copy
const plugins = gulpLoadPlugins();
// Create karma server
const KarmaServer = require('karma').Server;

let config = pjson.config;
let args = minimist(process.argv.slice(2));
let dirs = config.directories;
let taskTarget = args.production ? dirs.destination : dirs.temporary;

// Create a new browserSync instance
let browserSync = browserSyncLib.create();

// This will grab all js in the `gulp` directory
// in order to load all gulp tasks
wrench.readdirSyncRecursive('./gulp').filter((file) => {
  return (/\.(js)$/i).test(file);
}).map(function(file) {
  require('./gulp/' + file)(gulp, plugins, args, config, taskTarget, browserSync);
});

// Default task
gulp.task('default', ['clean'], () => {
  gulp.start('build');
});

// Build production-ready code
gulp.task('build', [
  'copy',
  'imagemin',
  'jade',
  'stylus',
  'browserify'
]);

// Server tasks with watch
gulp.task('serve', [
  'imagemin',
  'copy',
  'stylus',
  'jade',
  'browserify',
  'browserSync',
  'watch'
]);

// generate sprite.png and _sprite.scss
gulp.task('sprite', function() {
  var spriteData =
    gulp.src('./src/_images/*.png')
      .pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.styl',
        cssFormat: 'stylus',
        algorithm: 'top-down',
        algorithmOpts: {sort: false},
        cssTemplate: 'stylus.template.mustache',
        cssVarMap: function(sprite) {
            sprite.name = 's-' + sprite.name
        }
      }));

  spriteData.img.pipe(gulp.dest('./src/_images/anim/'));
  spriteData.css.pipe(gulp.dest('./src/_styles/sprites/'));
});

// Testing
gulp.task('test', ['eslint'], (done) => {
  new KarmaServer({
    configFile: path.join(__dirname, '/karma.conf.js'),
    singleRun: !args.watch,
    autoWatch: args.watch
  }, done).start();
});
