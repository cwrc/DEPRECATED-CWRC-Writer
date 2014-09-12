(function(tinymce) {
	// make sure snippet is available
	var $ = require('jquery');
	require(['jquery.snippet']);

	tinymce.create('tinymce.plugins.ViewSource', {
		init: function(ed, url) {
			var t = this;
			t.url = url;
			t.editor = ed;
			
			ed.addCommand('viewSource', function() {
				var content = ed.writer.converter.getDocumentContent(false);
				var source = '<pre>'+t.htmlEncode(content)+'</pre>';
				$('#viewSourceDialog').html(source);
				$('#viewSourceDialog > pre').snippet('html', {
					style: 'typical',
					transparent: true,
					showNum: false,
					menu: false
				});
				t.d.dialog('open');
			});
			
			$(document.body).append(''+
				'<div id="viewSourceDialog">'+
				'</div>'
			);
			
			t.d = $('#viewSourceDialog');
			t.d.dialog({
				title: 'View Source',
				modal: true,
				resizable: true,
				closeOnEscape: true,
				height: 480,
				width: 640,
				autoOpen: false,
				buttons: {
					'Ok': function() {
						t.d.dialog('close');
					}
				}
			});
		},
		htmlEncode: function(str) {
		    return str.replace(/[&<>"']/g, function($0) {
		        return "&" + {"&":"amp", "<":"lt", ">":"gt", '"':"quot", "'":"#39"}[$0] + ";";
		    });
		},
		createControl: function(n, cm) {
			if (n == 'viewsource') {
				var t = this;
				var url = t.url+'/../../img/';
				var c = cm.createButton('viewSourceButton', {
					title: 'View Source',
					image: url+'viewsource.gif',
					'class': 'wideButton',
					onclick: function() {
						t.editor.execCommand('removeHighlights');
						t.editor.execCommand('viewSource');
					}
				});
				
				return c;
			}
	
			return null;
		}
	});
	
	tinymce.PluginManager.add('viewsource', tinymce.plugins.ViewSource);
})(tinymce);