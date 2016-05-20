'use strict';

import path from 'path';
import del from 'del';
import concat from "gulp-concat";

export default function(gulp, plugins, args, config, taskTarget, browserSync) {
  let dirs = config.directories;

  // concat
   gulp.task('buildCss', ['stylusmain','stylusModules'], function() {
    return gulp.src(dest + '/*.css')
      .pipe(concat('build.css'))
      .pipe(gulp.dest(dest));
  });
}
