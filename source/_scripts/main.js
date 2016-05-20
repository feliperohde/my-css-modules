// Main javascript entry point
// Should handle bootstrapping/starting application

import $ from 'jquery';
import Link from '../_modules/link/link';
import css from '../_styles/css_modules_main.json';

'use strict';
$(() => {
  var link = new Link();

  console.log(css.world);
});
