var require = {
	baseUrl: '../src/js',
	paths: {
		'jquery': 'lib/jquery/jquery-1.9.1',
		'jquery-ui': 'lib/jquery/jquery-ui-1.10.3.custom',
		'jquery.layout': 'lib/jquery/jquery.layout-latest.min',
		'jquery.tablayout': 'lib/jquery/jquery.layout.resizeTabLayout-1.3',
		'jquery.contextmenu': 'lib/jquery/jquery.contextmenu',
		'jquery.tmpl': 'lib/jquery/jquery.tmpl.min',
		'jquery.watermark': 'lib/jquery/jquery.watermark.min',
		'jquery.hotkeys': 'lib/jstree/jquery.hotkeys',
		'jquery.jstree': 'lib/jstree/jquery.jstree', // can't use jquery.jtree.min.js due to modification
		'jquery.snippet': 'lib/snippet/jquery.snippet.min',
		
		'QUnit': 'http://code.jquery.com/qunit/qunit-git',
		
		'tinymce': 'lib/tinymce/tiny_mce_src',
		'tinymce-copyevent': 'lib/tinymce/copy_event',
		
		'objtree': 'lib/objtree/ObjTree',
		'moment': 'lib/moment/moment.min',
		
		'attributeWidget': 'dialogs/attributeWidget',
		'searchWidget': 'dialogs/searchWidget'
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
		'QUnit' : {
			exports : 'QUnit',
			init : function() {
				QUnit.config.reorder = false;
				QUnit.config.autostart = false;
			}
		},
		'tinymce': {
			exports: 'tinymce',
			init: function() {
				this.tinymce.DOM.events.domLoaded = true;
				return this.tinymce;
			}
		},
		'tinymce-copyevent': ['tinymce']
	},
	// initial dependencies
	deps: ['jquery',
	       'writer',
	       'delegator',
	       'QUnit',
	       'jquery.layout',
	       'jquery.tablayout',
	       'jquery.snippet' // need to move to viewsource plugin
	       ],
	callback: function($, Writer, Delegator, QUnit) {
		$(function() {
			cwrcWriterInit.call(window, Writer, Delegator);
		});
	}
};