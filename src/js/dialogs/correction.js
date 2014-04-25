define(['jquery', 'jquery-ui'], function($, jqueryUi) {
	
return function(writer) {
	var w = writer;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var sicText = null;
	
	$(document.body).append(''+
	'<div id="correctionDialog">'+
	    '<div><p>Correction</p><textarea id="correctionInput" name="correction"></textarea></div>'+
	'</div>');
	
	var correction = $('#correctionDialog');
	correction.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#correctionDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 220,
		width: 385,
		autoOpen: false,
		buttons: {
			'Tag Correction': function() {
				correctionResult();
			},
			'Cancel': function() {
				correctionResult(true);
			}
		}
	});
	var correctionInput = $('#correctionDialog textarea')[0];
	
	var correctionResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			data = {
				corrText: correctionInput.value,
				sicText: sicText
			};
		}
		if (mode == EDIT && data != null) {
			if (sicText == null) {
				// edit the correction text
				var entityStart = $('[name="'+w.editor.currentEntity+'"]', writer.editor.getBody())[0];
				var textNode = w.utilities.getNextTextNode(entityStart);
				textNode.textContent = data.corrText;
			}
			w.tagger.editEntity(w.editor.currentEntity, data);
		} else {
			if (data != null) {
				if (sicText == null) {
					// insert the correction text so we can make an entity out of that
					w.editor.execCommand('mceInsertContent', false, data.corrText);
				}
			}
			w.tagger.finalizeEntity('correction', data);
		}
		correction.dialog('close');
	};
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Add ';
			
			if (mode == ADD) {
				sicText = w.editor.currentBookmark.rng.toString();
				if (sicText == '') sicText = null;
				correctionInput.value = '';
			} else {
				prefix = 'Edit ';
				if (config.entry.info.sicText) sicText = config.entry.info.sicText;
				else sicText = null;
				correctionInput.value = config.entry.info.corrText;
			}
			
			var title = prefix+config.title;
			correction.dialog('option', 'title', title);
			if (config.pos) {
				correction.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				correction.dialog('option', 'position', 'center');
			}
			correction.dialog('open');
		},
		hide: function() {
			correction.dialog('close');
		}
	};
};

});