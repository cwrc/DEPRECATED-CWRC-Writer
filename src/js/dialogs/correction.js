define([
    'jquery',
    'jquery-ui'
], function($, jqueryUi) {
	
return function(writer) {
	var w = writer;
	
	var id = 'correctionDialog';
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var sicText = null;
	
	$(document.body).append(''+
	'<div id="'+id+'" class="annotationDialog">'+
	    '<div>'+
	    	'<p>Correction</p><textarea id="correctionInput" name="correction"></textarea>'+
	    '</div>'+
	'</div>');
	
	$('#'+id+'_teiParent').parent().accordion({
		heightStyle: 'content',
		animate: false,
		collapsible: true,
		active: false
	});
	
	var correction = $('#correctionDialog');
	correction.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#correctionDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 250,
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
			
			correctionInput.value = '';
			$('#'+id+'_teiParent').parent().accordion('option', 'active', false);
			
			var prefix = 'Add ';
			
			if (mode == ADD) {
				sicText = w.editor.currentBookmark.rng.toString();
				if (sicText == '') sicText = null;
				correctionInput.value = '';
			} else {
				var data = config.entry.info;
				
				prefix = 'Edit ';
				if (data.sicText) sicText = data.sicText;
				else sicText = null;
				correctionInput.value = data.corrText;
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