var AddOrganizationDialog = function(config) {
	var w = config.writer;
	
	$(document.body).append(''+
	'<div id="addOrganizationDialog">'+
		'<div>'+
		'<label>Organization Name</label>'+
		'<input type="text" name="placename" value=""/>'+
		'</div>'+
		'<div>'+
		'<label>Type</label>'+
		'<select name="type">'+
		'<option value="">Corporation</option>'+
		'<option value="">Government</option>'+
		'<option value="">Non-governmental</option>'+
		'<option value="">International</option>'+
		'<option value="">Charity</option>'+
		'<option value="">Not-for-profit corporation</option>'+
		'<option value="">Cooperative</option>'+
		'<option value="">University</option>'+
		'</select>'+
		'</div>'+
	    '<button>Add Further Information</button>'+
	    '<p>Note: for DEMO purposes only. Saves are NOT permanent.'+
	'</div>');
	
	var d = $('#addOrganizationDialog');
	d.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#addOrganizationDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		title: 'Create New Organization',
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
	
	$('#addOrganizationDialog > button').button();
	
	return {
		show: function(config) {
			$('#addOrganizationDialog input').val('');
			d.dialog('open');
		},
		hide: function() {
			d.dialog('close');
		}
	};
};