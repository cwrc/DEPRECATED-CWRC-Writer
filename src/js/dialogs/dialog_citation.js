var CitationDialog = function(config) {
	var w = config.writer;
	
	var currentType = null;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	$(document.body).append(''+
	'<div id="citationDialog">'+
	    '<textarea name="citation" style="margin-top: 10px;"></textarea>'+
	    '<p><b>NB</b>: This popup is not yet functional. Eventually it will let you look up the text to which you want to refer, or to add an entry for a new text.</p>'+
	'</div>');
	
	var citation = $('#citationDialog');
	citation.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#citationDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 280,
		width: 380,
		autoOpen: false,
		buttons: {
			'Tag Citation': function() {
				citationResult();
			},
			'Cancel': function() {
				citationResult(true);
			}
		}
	});
	var citationInput = $('#citationDialog textarea')[0];
	
	var citationResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			data = {};
			data[currentType] = citationInput.value;
		}
		if (mode == EDIT && data != null) {
			w.editEntity(w.editor.currentEntity, data);
		} else {
			w.finalizeEntity(currentType, data);
		}
		citation.dialog('close');
		currentType = null;
	};
	
	return {
		show: function(config) {
			currentType = config.type;
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Add ';
			
			if (mode == ADD) {
				citationInput.value = '';
			} else {
				prefix = 'Edit ';
				citationInput.value = config.entry.info[currentType];
			}
			
			var title = prefix+config.title;
			citation.dialog('option', 'title', title);
			if (config.pos) {
				citation.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				citation.dialog('option', 'position', 'center');
			}
			citation.dialog('open');
		},
		hide: function() {
			citation.dialog('close');
		}
	};
};