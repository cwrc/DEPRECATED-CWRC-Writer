var HeaderDialog = function(config) {
	var w = config.writer;
	
	$('#headerButtons').append(''+
	'<div id="headerLink"><h2>Edit Header</h2></div>');
	
	$(document.body).append(''+
	'<div id="headerDialog">'+
	'<textarea id="header_textarea" style="width: 100%; height: 98%;"></textarea>'+
	'</div>'+
	'</div>');
	
	var header = $('#headerDialog');
	header.dialog({
		title: 'Edit Header',
		modal: true,
		resizable: true,
		height: 380,
		width: 400,
		autoOpen: false,
		buttons: {
			'Ok': function() {
				var editorString = '<head>'+$('#header_textarea').val()+'</head>';
				var xml;
				try {
					xml = $.parseXML(editorString);
				} catch(e) {
					w.dialogs.show('message', {
						title: 'Invalid XML',
						msg: 'There was an error parsing the XML.',
						type: 'error'
					});
					return false;
				}
				
				var headerString = '';
				$(xml).find('head').children().each(function(index, el) {
					headerString += w.fm.buildEditorString(el);
				});
				$(w.editor.getBody()).find('span[_tag="'+w.header+'"]').html(headerString);
				
				header.dialog('close');
			},
			'Cancel': function() {
				header.dialog('close');
			}
		}
	});
	
	function doOpen() {
		var headerString = '';
		var headerEl = $(w.editor.getBody()).find('span[_tag="'+w.header+'"]');
		headerEl.children().each(function(index, el) {
			headerString += w.fm.buildXMLString($(el));
		});
		$('#header_textarea').val(headerString);
		header.dialog('open');
	}
	
	$('#headerLink').click(function() {
		doOpen();
	});
	
	return {
		show: function(config) {
			doOpen();
		},
		hide: function() {
			header.dialog('close');
		}
	};
};