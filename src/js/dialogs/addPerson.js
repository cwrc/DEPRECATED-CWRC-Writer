define(['jquery', 'jquery-ui', 'jquery.watermark'], function($, jqueryUi, watermark) {
	
return function(writer) {
	var w = writer;
	
	$(document.body).append(''+
	'<div id="addPersonDialog" class="annotationDialog">'+
		'<div id="personName">'+
			'<label>Name:</label>'+
			'<input type="text" name="first" value=""/>'+
			'<input type="text" name="middle" value=""/>'+
			'<input type="text" name="maiden" value=""/>'+
			'<input type="text" name="last" value=""/>'+
		'</div>'+
	    '<div>'+
			'<label for="addPersonDialog_dob">Date of Birth (if known):</label><input type="text" id="addPersonDialog_dob" style="margin-bottom: 5px;"/><br />'+
		    '<label for="addPersonDialog_dod">Date of Death (if known):</label><input type="text" id="addPersonDialog_dod" />'+
		    '<p>Format: yyyy-mm-dd<br/>e.g. 2010-10-05</p>'+
	    '</div>'+
	    '<div>'+
	    	'<label>Occupation (if known):</label><input type="text" name="role" value=""/>'+
	    '</div>'+
	    '<p>Note: for DEMO purposes only. Saves are NOT permanent.'+
	'</div>');
	
	var addPerson = $('#addPersonDialog');
	addPerson.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#addPersonDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		title: 'Create New Person',
		height: 350,
		width: 465,
		autoOpen: false,
		buttons: {
			'Submit for Review': function() {
				alert('New records can\'t be added yet. The popup is here only to solicit feedback.');
				addPerson.dialog('close');
			},
			'Cancel': function() {
				addPerson.dialog('close');
			}
		}
	});
	var lifeSpan = $('#addPersonDialog_dob, #addPersonDialog_dod').datepicker({
		dateFormat: 'yy-mm-dd',
		constrainInput: false,
		changeMonth: true,
		changeYear: true,
		yearRange: '-210:+10',
		minDate: new Date(1800, 0, 1),
		maxDate: new Date(2020, 11, 31),
		showOn: 'button',
		buttonText: 'Date Picker',
		buttonImage: w.cwrcRootUrl+'img/calendar.png',
		buttonImageOnly: true,
		onSelect: function(selectedDate) {
			var option = this.id == "addPersonDialog_dob" ? "minDate" : "maxDate";
			var instance = $(this).data("datepicker");
			var date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);
			dateRange.not(this).datepicker("option", option, date);
		}
	});
	
	$('#addPersonDialog input[name="first"]').watermark('First');
	$('#addPersonDialog input[name="middle"]').watermark('Middle');
	$('#addPersonDialog input[name="maiden"]').watermark('Maiden');
	$('#addPersonDialog input[name="last"]').watermark('Last');
	
	return {
		show: function(config) {
			$('input', addPerson).val('');
			$('select', addPerson).val('');
			if (config.data) {
				if (config.data.lastName) {
					$('input[name="last"]', addPerson).val(config.data.lastName);
				}
				if (config.data.firstName) {
					$('input[name="first"]', addPerson).val(config.data.firstName);
				}
				if (config.data.birthDate) {
					$('#addPersonDialog_dob').val(config.data.birthDate);
				}
				if (config.data.deathDate) {
					$('#addPersonDialog_dod').val(config.data.deathDate);
				}
				if (config.data.role) {
					$('input[name="role"]', addPerson).val(config.data.role);
				}
			}
			addPerson.dialog('open');
		},
		hide: function() {
			addPerson.dialog('close');
		}
	};
};

});