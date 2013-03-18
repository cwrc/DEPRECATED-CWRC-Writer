var LinkDialog = function(config) {
	var w = config.writer;
	
	var currentType = null;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	$(document.body).append(''+
	'<div id="linkDialog">'+
		'<div><label for="link_input">HTTP Link</label><input type="text" id="link_input" style="margin-right: 10px;"/><button>Check Link</button></div>'+
	'</div>');
	
	var link = $('#linkDialog');
	link.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#linkDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 125,
		width: 345,
		autoOpen: false,
		buttons: {
			'Tag Link': function() {
				linkResult();
			},
			'Cancel': function() {
				linkResult(true);
			}
		}
	});
	
	$('#linkDialog button').button().click(function() {
		var src = $('#link_input').val();
		if (src != '') {
			if (src.match(/^https?:\/\//) == null) {
				src = 'http://'+src;
			}
			window.open(src, 'linkTestWindow');
		}
	});
	
	var linkResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			var data = {
				url: $('#link_input').val() 
			};
		}
		if (mode == EDIT && data != null) {
			w.editEntity(w.editor.currentEntity, data);
		} else {
			w.finalizeEntity(currentType, data);
		}
		link.dialog('close');
		currentType = null;
	};
	
	return {
		show: function(config) {
			currentType = config.type;
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Add ';
			
			if (mode == ADD) {
				$('#link_input').val('http://');
			} else {
				prefix = 'Edit ';
				$('#link_input').val(config.entry.info.url);
			}
			
			var title = prefix+config.title;
			link.dialog('option', 'title', title);
			if (config.pos) {
				link.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				link.dialog('option', 'position', 'center');
			}
			link.dialog('open');
		},
		hide: function() {
			link.dialog('close');
		}
	};
};