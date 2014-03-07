define(['jquery', 'jquery-ui'], function($, jqueryUi) {
	
return function(writer) {
	var w = writer;
	
	// TODO add validation
	$(document.body).append(''+
	'<div id="addSchemaDialog">'+
		'<div>'+
			'<label>Schema Name</label>'+
			'<input type="text" name="name" value=""/>'+
		'</div>'+
		'<div>'+
			'<label>Schema URL</label>'+
			'<input type="text" name="url" value=""/>'+
		'</div>'+
		'<div>'+
			'<label>Schema CSS URL</label>'+
			'<input type="text" name="cssUrl" value=""/>'+
		'</div>'+
	'</div>');
	
	var d = $('#addSchemaDialog');
	d.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#addSchemaDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		title: 'Add Schema',
		height: 170,
		width: 300,
		autoOpen: false,
		buttons: {
			'Add': function() {
				var info = {};
				$('#addSchemaDialog input').each(function(index, el) {
					info[el.getAttribute('name')] = $(el).val();
				});
				var id = w.schemaManager.addSchema(info);
				d.dialog('close');
			},
			'Cancel': function() {
				d.dialog('close');
			}
		}
	});
	
	return {
		show: function(config) {
			$('#addSchemaDialog input').val('');
			d.dialog('open');
		},
		hide: function() {
			d.dialog('close');
		}
	};
};

});