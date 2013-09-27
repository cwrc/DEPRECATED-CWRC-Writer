var CorrectionDialog = function(config) {
	var w = config.writer;
	
	var currentType = null;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	$(document.body).append(''+
	'<div id="correctionDialog">'+
	    '<div><p>Correction</p><textarea id="correctionInput" name="correction"></textarea></div>'+
	    '<div id="corr_cert"><p>Certainty</p>'+
	    '<input type="radio" id="corr_definite" name="corr_certainty" value="definite" /><label for="corr_definite">Definite</label>'+
		'<input type="radio" id="corr_reasonable" name="corr_certainty" value="reasonable" /><label for="corr_reasonable">Reasonably Certain</label>'+
		'<input type="radio" id="corr_probable" name="corr_certainty" value="probable" /><label for="corr_probable">Probable</label>'+
		'<input type="radio" id="corr_speculative" name="corr_certainty" value="speculative" /><label for="corr_speculative">Speculative</label>'+
		'</div>'+
		'<div id="corr_type"><p>Type</p>'+
		'<input type="radio" id="corr_ocr" name="corr_type" value="ocr" /><label for="corr_ocr">OCR</label>'+
		'<input type="radio" id="corr_typo" name="corr_type" value="typographical" /><label for="corr_typo">Typographical</label>'+
		'<input type="radio" id="corr_other" name="corr_type" value="other" /><label for="corr_other">Other</label>'+
		'</div>'+
	'</div>');
	
	var correction = $('#correctionDialog');
	correction.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#correctionDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 355,
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
	$('#corr_cert, #corr_type').buttonset();
	
	var correctionResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			data = {
				content: correctionInput.value,
				certainty: $('#corr_cert input:checked').val(),
				type: $('#corr_type input:checked').val()
			};
		}
		if (mode == EDIT && data != null) {
			w.editEntity(w.editor.currentEntity, data);
		} else {
			w.finalizeEntity(currentType, data);
		}
		correction.dialog('close');
		currentType = null;
	};
	
	return {
		show: function(config) {
			currentType = config.type;
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Add ';
			
			if (mode == ADD) {
				correctionInput.value = '';
				$('#corr_cert input:eq(0)').click();
				$('#corr_type input:eq(0)').click();
			} else {
				prefix = 'Edit ';
				correctionInput.value = config.entry.info.content;
				$('#corr_cert input[value="'+config.entry.info.certainty+'"]').click();
				$('#corr_type input[value="'+config.entry.info.type+'"]').click();
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