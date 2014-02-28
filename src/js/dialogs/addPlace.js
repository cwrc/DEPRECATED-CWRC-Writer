define(['jquery', 'jquery-ui'], function($, jqueryUi) {
	
return function(writer) {
	var w = writer;
	
	$(document.body).append(''+
	'<div id="addPlaceDialog">'+
		'<div>'+
		'<label>Place Name</label>'+
		'<input type="text" name="placename" value=""/>'+
		'</div>'+
		'<div>'+
		'<label>Location</label>'+
		'<input type="text" name="location" value=""/>'+
		'</div>'+
	    '<button>Add Further Information</button>'+
	    '<p>Note: for DEMO purposes only. Saves are NOT permanent.'+
	'</div>');
	
	var d = $('#addPlaceDialog');
	d.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#addPlaceDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		title: 'Create New Place',
		height: 300,
		width: 400,
		autoOpen: false,
		buttons: {
			'Submit for Review': function() {
				alert('New records can\'t be added yet. The popup is here only to solicit feedback.');
				d.dialog('close');
			},
			'Cancel': function() {
				d.dialog('close');
			}
		}
	});
	
	$('#addPlaceDialog > button').button();
	
	return {
		show: function(config) {
			$('#addPlaceDialog input').val('');
			d.dialog('open');
		},
		hide: function() {
			d.dialog('close');
		}
	};
};

});