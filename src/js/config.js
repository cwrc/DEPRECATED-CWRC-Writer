require.config({
	baseUrl: 'js',
	paths: {
		'text': 'lib/require/text', // requirejs text plugin
		
		'jquery': ['http://code.jquery.com/jquery-1.9.1.min','lib/jquery/jquery-1.9.1'],
		'jquery-ui': ['http://code.jquery.com/ui/1.10.4/jquery-ui.min','lib/jquery/jquery-ui-1.10.4.custom'],
		'jquery.layout': ['http://cdnjs.cloudflare.com/ajax/libs/jquery-layout/1.3.0-rc-30.79/jquery.layout.min','lib/jquery/jquery.layout-latest.min'],
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
		
		'attributeWidget': 'dialogs/attributeWidget',
		
		// cwrcDialogs
		'knockout': ['http://cdnjs.cloudflare.com/ajax/libs/knockout/2.3.0/knockout-min','lib/knockout/knockout-2.3.0'],
		'bootstrap': ['http://netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min','lib/bootstrap/bootstrap'],
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
	}
	// cache busting
//	urlArgs: "bust=" +  (new Date()).getTime(),
});

require(['jquery', 'knockout'], function($, knockout) {
	window.ko = knockout; // requirejs shim isn't working for knockout
	
	require(['writer',
	         'delegator',
	         'jquery.layout',
	         'jquery.tablayout'
	], function(Writer, Delegator) {
		$(function() {
			cwrcWriterInit.call(window, Writer, Delegator);
		});
	});
});