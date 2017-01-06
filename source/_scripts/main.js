// Main javascript entry point
// Should handle bootstrapping/starting application

import $ from 'jquery';
import Link from '../_components/link/link';
import css from '../_styles/css_map_all.json';

'use strict';
$(() => {
  var link = new Link();

  console.log(css);
});
