require.config({
  paths: {
    'text': 'lib/require/text',
    'jquery': ['http://code.jquery.com/jquery-1.9.1.min', 'lib/jquery/jquery-1.9.1'],
    'jquery-ui': ['lib/jquery/jquery-ui-1.10.4.min'],
    'jquery-migrate': ['lib/jquery/jquery-migrate-1.2.1'],
    'jquery.layout': 'lib/jquery/jquery.layout-latest.min',
    'jquery.tablayout': 'lib/jquery/jquery.layout.resizeTabLayout-1.3',
    'jquery.contextmenu': 'lib/jquery/jquery.contextmenu',
    'jquery.tmpl': 'lib/jquery/jquery.tmpl.min',
    'jquery.watermark': 'lib/jquery/jquery.watermark.min',
    'jquery.jstree': 'lib/jstree/jstree.3.0.0',
    'jquery.snippet': 'lib/snippet/jquery.snippet.min',

    'tinymce': 'lib/tinymce/tiny_mce_src',
    'tinymce-copyevent': 'lib/tinymce/copy_event',

    'objtree': 'lib/objtree/ObjTree',
    'moment': 'lib/moment/moment.min',

    'octokit': 'lib/octokit/octokit',

    'dialogForm': 'dialogs/dialogForm',
    'attributeWidget': 'dialogs/attributeWidget',

    // cwrcDialogs
    'knockout': ['http://cdnjs.cloudflare.com/ajax/libs/knockout/2.3.0/knockout-min', 'lib/knockout/knockout-2.3.0'],
    'bootstrap': ['lib/bootstrap/bootstrap.min'],
    'bootstrap-datepicker': 'lib/bootstrap/bootstrap-datepicker',
    'cwrc-api': 'cwrcDialogs/cwrc-api',
    'cwrcDialogs': 'cwrcDialogs/cD'
  },
  shim: {
    'jquery-ui': ['jquery'],
    'jquery.layout': ['jquery', 'jquery-ui'],
    'jquery.tablayout': ['jquery.layout'],
    'jquery.contextmenu': ['jquery'],
    'jquery.tmpl': ['jquery'],
    'jquery.watermark': ['jquery'],
    'jquery.snippet': ['jquery', 'jquery-migrate'],
    'tinymce': {
      exports: 'tinymce',
      init: function () {
        'use strict';
        this.tinymce.DOM.events.domLoaded = true;
        return this.tinymce;
      }
    },
    'tinymce-copyevent': ['tinymce'],

    'bootstrap': ['jquery', 'jquery-ui'],
    'bootstrap-datepicker': ['bootstrap'],
    'cwrcDialogs': {
      deps: ['jquery', 'jquery-ui', 'knockout', 'bootstrap', 'bootstrap-datepicker', 'cwrc-api']
    }
  },
  map: {
    // '*' means all modules will get 'jquery-private'
    // for their 'jquery' dependency.
    '*': { 'jquery': 'jquery-private' },
    'jquery-private': { 'jquery': 'jquery' }
  }
});

// and the 'jquery-private' module, in the
// jquery-private.js file:
define('jquery-private', ['jquery'], function ($) {
  'use strict';
  return $.noConflict(true);
});

require(['jquery', 'knockout'], function ($, knockout) {
  'use strict';
  window.ko = knockout; // requirejs shim isn't working for knockout
  require(['writer',
    'delegator',
    'jquery.layout',
    'jquery.tablayout'], function (Writer, Delegator) {
    $(function () {
      cwrcWriterInit.call(window, $, Writer, Delegator);
    });
  });
});