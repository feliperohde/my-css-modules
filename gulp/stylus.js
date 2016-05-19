'use strict';

import path from 'path';
import autoprefixer from 'autoprefixer';
import gulpif from 'gulp-if';
import jeet from "jeet";
import nib from "nib";
import cssModules from "postcss-modules";
import fs from "fs";
import gutil from "gulp-util";

export default function(gulp, plugins, args, config, taskTarget, browserSync) {

  let dirs = config.directories;
  let entries = config.entries;
  let dest = path.join(taskTarget, dirs.styles.replace(/^_/, ''));

  function string_src(filename, string) {
    var src = require('stream').Readable({ objectMode: true })
    src._read = function () {
      this.push(new gutil.File({ cwd: "", base: "", path: filename, contents: new Buffer(string) }))
      this.push(null)
    }
    return src
  }

  // Stylus compilation
  gulp.task('stylus', () => {
    gulp.src(path.join(dirs.source, dirs.styles, entries.css))
      .pipe(plugins.plumber())
      .pipe(plugins.sourcemaps.init())
      .pipe(plugins.stylus({
          compress: true,
          paths:  ['node_modules', 'styles/globals'],
          import: ['jeet/stylus/jeet', 'stylus-type-utils', 'nib', 'rupture/rupture'],
          use: [nib(), jeet()],
          'include css': true
        }))
      .pipe(
        plugins.postcss(

        [

        autoprefixer({browsers: ['last 2 version', '> 5%', 'safari 5', 'ios 6', 'android 4']}),

        cssModules({
          getJSON: function(cssFileName, json) {
              var path          = require('path');
              var cssName       = path.basename(cssFileName, '.css');
              var jsonFileName  = path.resolve("css_modules_" + cssName + '.json');
              //fs.writeFileSync( jsonFileName, JSON.stringify(json));
              return string_src(jsonFileName, JSON.stringify(json))
                    .pipe(gulp.dest(path.join(dirs.source, dirs.styles)))
            }
          })

        ]

        )
      )
      .pipe(plugins.rename(function(path) {
        // Remove 'source' directory as well as prefixed folder underscores
        // Ex: 'src/_styles' --> '/styles'
        path.dirname = path.dirname.replace(dirs.source, '').replace('_', '');
      }))
      .pipe(gulpif(args.production, plugins.cssnano({rebase: false})))
      .pipe(plugins.sourcemaps.write('./'))
      .pipe(gulp.dest(dest))
      .pipe(browserSync.stream());
  });
}
