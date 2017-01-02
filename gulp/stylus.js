'use strict';

import path from 'path';
import autoprefixer from 'autoprefixer';
import gulpif from 'gulp-if';
import jeet from "jeet";
import nib from "nib";
import cssModules from "postcss-modules";
import fs from "fs";
import gutil from "gulp-util";
import multiglob from "multi-glob";
import concat from "gulp-concat";
import md5 from "js-md5";
import crc from "js-crc";

let glob = multiglob.glob;
let crc16 =  crc.crc16;
let crc32 =  crc.crc32;

export default function(gulp, plugins, args, config, taskTarget, browserSync) {

  // contact
  let dirs = config.directories;
  let entries = config.entries;
  let dest = path.join(taskTarget, dirs.styles.replace(/^_/, ''));

  gulp.task('concatcss', function() {
    return gulp.src(dest + '/*.css')
      .pipe(concat('build.css'))
      .pipe(gulp.dest(dest + '/build/'));
  });


  let string_src = (filename, string) => {
    var src = require('stream').Readable({ objectMode: true })
    src._read = function () {
      this.push(new gutil.File({ cwd: "", base: "", path: filename, contents: new Buffer(string) }))
      this.push(null)
    }
    return src;
  }

  let randomString = (length, chars) => {
    var length = length || 8;
    var chars = chars || "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
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
    return str.replace(/--/g, "_m_").replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
  }

  let jsonData = {};
  let stylusCompileTask = (file, isLast) => {

    gulp.src(file)
    .pipe(plugins.plumber())
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.stylus({
      compress: (args.compress) ?  true : false,
      disableCache: true,
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

                var interval = setInterval(function() {
                  fs.stat(file, function(err, stat) {
                    if(err == null) {
                      gulp.start('cleanCssBuild');
                      gulp.start('concatcss');

                      clearInterval(interval);

                    } else {
                      gutil.log("não encontrou o arquivo de mapa do css");
                    }
                  });

                }, 300);
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
              // if(args.production) {
                // return '_' + file + '_' + randomString(12, name + file);

                if(args.md5)
                  return '_' + md5(name);

                if(args.crc32)
                  return '_' + crc32(name);

                if(args.crc16)
                  return '_' + crc16(name);

                return '_' + toCamelCase(name);

              // } else {
              //   // return '_' + file + '_' + toCamelCase(name); deu ruim
              //   return '_' + toCamelCase(name);
              //   // return '_' + crc16(name);
              // }

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
    //.pipe(gulpif(args.production, plugins.cssnano({rebase: false})))
    .pipe(plugins.sourcemaps.write('./'))
    .pipe(gulp.dest(dest))
    .pipe(browserSync.stream());
  };

  // Stylus compilation
  gulp.task('stylus', ['stylusmain'], () => {

    return glob(['./source/_modules/**/**.styl', './source/_components/**/**.styl'], function (er, files) {
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
