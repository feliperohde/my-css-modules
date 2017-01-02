'use strict';

import fs from 'fs';
import path from 'path';
import foldero from 'foldero';
import jade from 'pug';
import yaml from 'js-yaml';
import postHtml from 'posthtml-stylus-modules';
import gutil from 'gulp-util';

export default function(gulp, plugins, args, config, taskTarget, browserSync) {
  let dirs = config.directories;
  let dest = path.join(taskTarget);
  let dataPath = path.join(dirs.source, dirs.data);

  // Jade template compile
  gulp.task('jade', () => {

    try {
      delete require.cache[require.resolve('../'+path.join(dirs.source, dirs.styles) + '/css_modules_all.json')];
    } catch (data) {
      console.log(data);
    }

    let jsonCssMap = {};
    fs.stat(path.join(dirs.source, dirs.styles) + '/css_modules_all.json', function(err, stat) {
        if(err == null) {
            gutil.log('File exists');
            jsonCssMap = require('../'+ path.join(dirs.source, dirs.styles) + '/css_modules_all.json');
            compileJade();

            if(args.map) gutil.log(jsonCssMap);
        } else {
          //compileJade();
          gutil.log(err.code);
        }
    });


    let siteData = {};
    if (fs.existsSync(dataPath)) {
      // Convert directory to JS Object
      siteData = foldero(dataPath, {
        recurse: true,
        whitelist: '(.*/)*.+\.(json|ya?ml)$',
        loader: function loadAsString(file) {
          let json = {};
          try {
            if (path.extname(file).match(/^.ya?ml$/)) {
              json = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
            }
            else {
              json = JSON.parse(fs.readFileSync(file, 'utf8'));
            }
          }
          catch(e) {
            console.log('Error Parsing JSON/YAML file: ' + file);
            console.log('==== Details Below ====');
            console.log(e);
          }
          return json;
        }
      });
    }

    // Add --debug option to your gulp task to view
    // what data is being loaded into your templates
    if (args.debug) {
      console.log('==== DEBUG: site.data being injected to templates ====');
      console.log(siteData);
      console.log('\n==== DEBUG: package.json config being injected to templates ====');
      console.log(config);
    }

    let compileJade = () => {
      return gulp.src([
        path.join(dirs.source, '**/*.pug'),
        '!' + path.join(dirs.source, '{**/\_*,**/\_*/**}')
      ])
      .pipe(plugins.changed(dest))
      .pipe(plugins.plumber())

      .pipe(plugins.pug({
        jade: jade,
        pretty: true,
        locals: {
          config: config,
          debug: true,
          css: jsonCssMap,
          site: {
            data: siteData
          }
        }
      }))

      .pipe(plugins.htmlmin({
        collapseBooleanAttributes: true,
        conservativeCollapse: true,
        removeCommentsFromCDATA: true,
        removeEmptyAttributes: true,
        removeRedundantAttributes: true
      }))
      .pipe(postHtml(jsonCssMap))
      .pipe(gulp.dest(dest))
      .on('end', browserSync.reload);
    };


  });
}
