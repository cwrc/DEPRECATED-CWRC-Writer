define(['jquery', 'jquery-ui'], function($, jqueryUi) {
	
return function(writer) {
	var w = writer;
	
	var id = "title";
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	$(document.body).append(''+
	'<div id="'+id+'Dialog" class="annotationDialog">'+
		'<div id="'+id+'_level">'+
			'<p>Type:</p>'+
			'<input type="radio" value="a" name="level" id="'+id+'_level_a"/>'+
			'<label for="'+id+'_level_a">Analytic <span>article, poem, or other item published as part of a larger item</span></label><br/>'+
			'<input type="radio" value="m" name="level" id="'+id+'_level_m" checked="checked"/>'+
			'<label for="'+id+'_level_m">Monographic <span>book, collection, single volume, or other item published as a distinct item</span></label><br/>'+
			'<input type="radio" value="j" name="level" id="'+id+'_level_j"/>'+
			'<label for="'+id+'_level_j">Journal <span>magazine, newspaper or other periodical publication</span></label><br/>'+
			'<input type="radio" value="s" name="level" id="'+id+'_level_s"/>'+
			'<label for="'+id+'_level_s">Series <span>book, radio, or other series</span></label><br/>'+
			'<input type="radio" value="u" name="level" id="'+id+'_level_u"/>'+
			'<label for="'+id+'_level_u">Unpublished <span>thesis, manuscript, letters or other unpublished material</span></label><br/>'+
		'</div>'+
		'<div id="'+id+'_certainty">'+
	    	'<p>This identification is:</p>'+
			'<input type="radio" id="'+id+'_definite" name="'+id+'_id_certainty" value="definite" /><label for="'+id+'_definite">Definite</label>'+
			'<input type="radio" id="'+id+'_reasonable" name="'+id+'_id_certainty" value="reasonably certain" /><label for="'+id+'_reasonable">Reasonably Certain</label>'+
			'<input type="radio" id="'+id+'_probable" name="'+id+'_id_certainty" value="probable" /><label for="'+id+'_probable">Probable</label>'+
			'<input type="radio" id="'+id+'_speculative" name="'+id+'_id_certainty" value="speculative" /><label for="'+id+'_speculative">Speculative</label>'+
	    '</div>'+
	'</div>');
	
	var title = $('#'+id+'Dialog');
	title.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#'+id+'Dialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 375,
		width: 435,
		autoOpen: false,
		buttons: {
			'Tag Text/Title': function() {
				titleResult();
			},
			'Cancel': function() {
				titleResult(true);
			}
		}
	});
	
	$('#'+id+'_certainty').buttonset();
	
	$('#titleDialog input').keyup(function(event) {
		if (event.keyCode == '13') {
			event.preventDefault();
			titleResult();
		}
	});
	
	var titleResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			var level = $('input[name="level"]:checked', title).val();
			var certainty = $('#'+id+'_certainty input:checked').val();
			
			data = {
				level: level,
				certainty: certainty
			};
		}
		if (mode == EDIT && data != null) {
			w.tagger.editEntity(w.editor.currentEntity, data);
		} else {
			w.tagger.finalizeEntity('title', data);
		}
		title.dialog('close');
	};
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Tag ';
			
			$('#'+id+'_certainty input:checked').prop('checked', false).button('refresh');
			
			if (mode == ADD) {
				$('input[value="m"]', title).prop('checked', true);
			} else {
				prefix = 'Edit ';
				var level = config.entry.info.level;
				var cert = config.entry.info.certainty;
				
				$('input[value="'+level+'"]', title).prop('checked', true);
				$('#'+id+'_certainty input[value="'+cert+'"]').prop('checked', true).button('refresh');
			}
			
			var t = prefix+config.title;
			title.dialog('option', 'title', t);
			if (config.pos) {
				title.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				title.dialog('option', 'position', 'center');
			}
			title.dialog('open');
		},
		hide: function() {
			title.dialog('close');
		}
	};
};

});