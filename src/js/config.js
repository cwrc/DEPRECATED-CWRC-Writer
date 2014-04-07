var require = {
	baseUrl: 'js',
	paths: {
		'jquery': 'lib/jquery/jquery-1.9.1',
		'jquery-ui': 'lib/jquery/jquery-ui-1.10.4.custom',
		'jquery.layout': 'lib/jquery/jquery.layout-latest.min',
		'jquery.tablayout': 'lib/jquery/jquery.layout.resizeTabLayout-1.3',
		'jquery.contextmenu': 'lib/jquery/jquery.contextmenu',
		'jquery.tmpl': 'lib/jquery/jquery.tmpl.min',
		'jquery.watermark': 'lib/jquery/jquery.watermark.min',
		'jquery.hotkeys': 'lib/jstree/jquery.hotkeys',
		'jquery.jstree': 'lib/jstree/jquery.jstree', // can't use jquery.jtree.min.js due to modification
		'jquery.snippet': 'lib/snippet/jquery.snippet.min',
		
		'tinymce': 'lib/tinymce/tiny_mce_src',
		'tinymce-copyevent': 'lib/tinymce/copy_event',
		
		'objtree': 'lib/objtree/ObjTree',
		'moment': 'lib/moment/moment.min',
		
		'attributeWidget': 'dialogs/attributeWidget',
		'searchWidget': 'dialogs/searchWidget',
		
		// cwrcDialogs
		'knockout': 'lib/knockout/knockout-2.3.0',
		'bootstrap': 'lib/bootstrap/bootstrap',
		'bootstrap-datepicker': 'lib/bootstrap/bootstrap-datepicker',
		'cwrc-api': 'cwrcDialogs/cwrc-api',
		'cwrcDialogs': 'cwrcDialogs/cD'
	},
	shim: {
		'jquery-ui': ['jquery'],
		'jquery.layout': ['jquery'],
		'jquery.tablayout': ['jquery.layout'],
		'jquery.contextmenu': ['jquery'],
		'jquery.tmpl': ['jquery'],
		'jquery.watermark': ['jquery'],
		'jquery.hotkeys': ['jquery'],
		'jquery.jstree': ['jquery.hotkeys'],
		'jquery.snippet': ['jquery'],
		'tinymce': {
			exports: 'tinymce',
			init: function() {
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
	// cache busting
//	urlArgs: "bust=" +  (new Date()).getTime(),
	
	// initial dependencies
	deps: ['jquery',
	       'knockout'],
	callback: function($, knockout) {
		window.ko = knockout; // requirejs shim isn't working for knockout
		
		require(['writer',
		         'delegator',
		         'jquery.layout',
		         'jquery.tablayout',
		         'jquery.snippet' // need to move to viewsource plugin
		], function(Writer, Delegator) {
			$(function() {
				cwrcWriterInit.call(window, Writer, Delegator);
			});
		});
	}
};