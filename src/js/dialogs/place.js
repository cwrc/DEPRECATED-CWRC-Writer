define([
    'jquery',
    'jquery-ui'
], function($, jqueryUi) {
	
return function(writer) {
	var w = writer;
	
	var id = 'place';
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var currentId = null;
	var currentData = null;
	
	var processData = function() {
		currentData.certainty = $('#'+id+'_certainty input:checked').val();
		currentData.precision = $('#'+id+'_precision input:checked').val();
		currentData.detail = $('#'+id+'_detail').val();
		
		for (var key in currentData) {
			if (currentData[key] == undefined || currentData[key] == '') {
				delete currentData[key];
			}
		}
	};
	
	var onSaveClick = function() {
		processData();
		dialog.dialog('close');
		
		if (mode == EDIT && currentData != null) {
			w.tagger.editEntity(currentId, currentData);
		} else {
			w.tagger.finalizeEntity('place', currentData);
		}
		currentId = null;
		currentData = null;
	};
	
	$(document.body).append(''+
	'<div id="'+id+'Dialog" class="annotationDialog">'+
		'<div id="'+id+'_tagAs">'+
			'<p>Tag as:</p>'+
			'<span class="tagAs"></span>'+
		'</div>'+
		'<div id="'+id+'_certainty">'+
	    	'<p>This identification is:</p>'+
			'<input type="radio" id="'+id+'_definite" name="'+id+'_id_certainty" value="definite" /><label for="'+id+'_definite">Definite</label>'+
			'<input type="radio" id="'+id+'_reasonable" name="'+id+'_id_certainty" value="reasonably certain" /><label for="'+id+'_reasonable">Reasonably Certain</label>'+
			'<input type="radio" id="'+id+'_probable" name="'+id+'_id_certainty" value="probable" /><label for="'+id+'_probable">Probable</label>'+
			'<input type="radio" id="'+id+'_speculative" name="'+id+'_id_certainty" value="speculative" /><label for="'+id+'_speculative">Speculative</label>'+
	    '</div>'+
	    '<div>'+
		    '<p>Absolute or relative place name:</p>'+
		    '<div id="'+id+'_precision">'+
			    '<input type="radio" id="'+id+'_precise" name="'+id+'_detail_radio" value="precise" /><label for="'+id+'_precise">Precise</label>'+
				'<input type="radio" id="'+id+'_proximate" name="'+id+'_detail_radio" value="proximate" /><label for="'+id+'_proximate">Proximate</label>'+
		    '</div>'+
		    '<label for="'+id+'_detail">Detail (optional):</label><input type="text" id="'+id+'_detail"/>'+
		'</div>'+
	'</div>'+
	'');
	
	var dialog = $('#'+id+'Dialog');
	dialog.dialog({
		title: 'Tag Place',
		modal: true,
		resizable: true,
		dialogClass: 'splitButtons',
		closeOnEscape: false,
		open: function(event, ui) {
			dialog.parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 350,
		width: 400,
		autoOpen: false,
		buttons: [{
			text: 'Cancel',
			click: function() {
				currentData = null;
				currentId = null;
				dialog.dialog('close');
			}
		},{
			text: 'Save',
			id: id+'SaveButton',
			click: onSaveClick
		}]
	});
	
	$('#'+id+'_certainty').buttonset();
	$('#'+id+'_precision').buttonset();
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			
			// reset the form
			$('#'+id+'_certainty input:checked').prop('checked', false).button('refresh');
			$('#'+id+'_precision input:checked').prop('checked', false).button('refresh');
			$('#'+id+'_tagAs span').empty();
			$('#'+id+'_detail').val('');
			
			// TODO how to handle ADD/EDIT with cwrcInfo
			
			currentData = {};
			
			if (config.cwrcInfo != null) {
				$('#'+id+'_tagAs span').html(config.cwrcInfo.name);
				currentData.cwrcInfo = config.cwrcInfo;
			}
			
			if (mode == EDIT) {
				var data = config.entry.info;
				
				currentData.cwrcInfo = data.cwrcInfo;
				$('#'+id+'_tagAs span').html(data.cwrcInfo.name);
				
				currentId = config.entry.props.id;
				$('#'+id+'_certainty input[value="'+data.certainty+'"]').prop('checked', true).button('refresh');
				$('#'+id+'_precision input[value="'+data.precision+'"]').prop('checked', true).button('refresh');
				$('#'+id+'_detail').val(data.detail);
			}
			
			dialog.dialog('open');
		}
	};
};

});