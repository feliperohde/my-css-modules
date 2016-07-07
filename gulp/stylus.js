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
import concat from "gulp-concat";

export default function(gulp, plugins, args, config, taskTarget, browserSync) {

  // contact
  gulp.task('concatcss', function() {
    return gulp.src(dest + '/*.css')
      .pipe(concat('build.css'))
      .pipe(gulp.dest(dest + '/build/'));
  });

  let dirs = config.directories;
  let entries = config.entries;
  let dest = path.join(taskTarget, dirs.styles.replace(/^_/, ''));

  let string_src = (filename, string) => {
    var src = require('stream').Readable({ objectMode: true })
    src._read = function () {
      this.push(new gutil.File({ cwd: "", base: "", path: filename, contents: new Buffer(string) }))
      this.push(null)
    }
    return src;
  }

  let hashCode = (s) => {
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
  }

  let jsonConcat = (o1, o2) => {
   for (var key in o2) {
    o1[key] = o2[key];
   }
   return o1;
  }

  let toCamelCase = (str) => {
    return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
  }

  let jsonData = {};
  let stylusCompileTask = (file, isLast) => {

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

              //json
              jsonData = jsonConcat(jsonData, json);

              if(isLast) {
                string_src("css_modules_all.json", toCamelCase(JSON.stringify(jsonData)))
                .pipe(gulp.dest(path.join(dirs.source + '/' + dirs.styles)));

                gulp.start('cleanCssBuild');
                gulp.start('concatcss');
              }

                return string_src(jsonFileName, toCamelCase(JSON.stringify(json)))
                .pipe(gulp.dest(path.dirname(file)));
            },
            generateScopedName: function(name, filename, css) {
              var i         = css.indexOf('.' + name);
              var numLines  = css.substr(0, i).split(/[\r\n]/).length;
              var file      = path.basename(filename, '.css');

              //for insane obfuscating
              //return  Math.random().toString(36).substr(2, 12);
              if(args.production) {
                return '_' + file + '_' + hashCode(name +  numLines);
              } else {
                return '_' + file + '_' + toCamelCase(name);
              }

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

    return glob('./source/_modules/**/**.styl', function (er, files) {
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.

      if (er) {
        done(er);
      }

      for (var i = files.length - 1; i >= 0; i--) {
        stylusCompileTask(files[i], (i == 0) ? true : false);
      }

    });

  });

  // Stylus compilation
  gulp.task('stylusmain', () => {

    return glob(path.join(dirs.source, dirs.styles, entries.css), function (er, files) {
    // files is an array of filenames.
    // If the `nonull` option is set, and nothing
    // was found, then files is ["**/*.js"]
    // er is an error object or null.

      if (er) {
        //done(er);
      }

      for (var i = files.length - 1; i >= 0; i--) {
        //gutil.log(path.resolve(files[i]));
        stylusCompileTask(files[i], null);
      }

    });

  });
}
