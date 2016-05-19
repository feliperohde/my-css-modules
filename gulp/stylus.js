'use strict';

import path from 'path';
import autoprefixer from 'autoprefixer';
import gulpif from 'gulp-if';
import jeet from "jeet";
import nib from "nib";
import cssModules from "postcss-modules";
import fs from "fs";
import gutil from "gulp-util";
import glob from "glob";

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
    return src;
  }

  let stylusCompileTask = (file) => {

    gulp.src(file)
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
              var cssName       = path.basename(cssFileName, '.css');
              var jsonFileName  = path.resolve("css_modules_" + cssName + '.json');
                return string_src(jsonFileName, JSON.stringify(json))
                .pipe(gulp.dest(path.join(dirs.source, dirs.styles)))
            },
            generateScopedName: function(name, filename, css) {
              var i         = css.indexOf('.' + name);
              var numLines  = css.substr(0, i).split(/[\r\n]/).length;
              var file      = path.basename(filename, '.css');

              return '_' + file + Math.random().toString(36).substr(2, 9);
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
  };

  // Stylus compilation
  gulp.task('stylus', ['stylusmain'], () => {

    glob('./source/_modules/**/**.styl', function (er, files) {
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.

      if (er) {
        done(er);
      }

      for (var i = files.length - 1; i >= 0; i--) {
        gutil.log(files[i]);
        stylusCompileTask(files[i]);
      }

    });

  });

  // Stylus compilation
  gulp.task('stylusmain', () => {

    glob(path.join(dirs.source, dirs.styles, entries.css), function (er, files) {
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.

      if (er) {
        //done(er);
      }

      for (var i = files.length - 1; i >= 0; i--) {
        gutil.log(files[i]);
        stylusCompileTask(files[i]);
      }

    });

  });
}
