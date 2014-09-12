define(['jquery',
        'jquery-ui',
        'moment',
        'dialogForm'
], function($, jqueryUi, moment, DialogForm) {
	
return function(writer) {
	var w = writer;
	
	var id = 'date';
	
	var html = ''+
	'<div id="'+id+'Dialog" class="annotationDialog">'+
		'<div id="'+id+'_type" data-transform="buttonset">'+
			'<p>Date type:</p>'+
			'<input type="radio" name="dateType" value="date" id="'+id+'_type_date" checked="checked"/><label for="'+id+'_type_date">Single Date</label>'+
			'<input type="radio" name="dateType" value="range" id="'+id+'_type_range"/><label for="'+id+'_type_range">Date Range</label>'+
		'</div>'+
		'<div id="'+id+'_date">'+
			'<label for="'+id+'_cwrc_datePicker">Date:</label><br/><input type="text" id="'+id+'_cwrc_datePicker" />'+
		'</div>'+
		'<div id="'+id+'_range">'+
			'<label for="'+id+'_startDate">Start date:</label><br/><input type="text" id="'+id+'_startDate" style="margin-bottom: 5px;"/><br />'+
		    '<label for="'+id+'_endDate">End date:</label><br/><input type="text" id="'+id+'_endDate" />'+
	    '</div>'+
	    '<div>Format: YYYY, YYYY-MM, or YYYY-MM-DD<br/>e.g. 2010, 2010-10, 2010-10-31</div>'+
	    '<div id="'+id+'_certainty" data-transform="buttonset" data-type="radio" data-mapping="certainty">'+
	    	'<p>This identification is:</p>'+
			'<input type="radio" id="'+id+'_definite" name="'+id+'_id_certainty" value="definite" data-default="true" /><label for="'+id+'_definite">Definite</label>'+
			'<input type="radio" id="'+id+'_reasonable" name="'+id+'_id_certainty" value="reasonably certain" /><label for="'+id+'_reasonable">Reasonably Certain</label>'+
			'<input type="radio" id="'+id+'_probable" name="'+id+'_id_certainty" value="probable" /><label for="'+id+'_probable">Probable</label>'+
			'<input type="radio" id="'+id+'_speculative" name="'+id+'_id_certainty" value="speculative" /><label for="'+id+'_speculative">Speculative</label>'+
	    '</div>'+
	    '<div data-transform="accordion">'+
		    '<h3>Markup options</h3>'+
		    '<div id="'+id+'_teiParent" class="attributes" data-type="attributes" data-mapping="attributes">'+
		    '</div>'+
		'</div>'+
	'</div>';
	
	var dialog = new DialogForm({
		writer: w,
		id: id,
		type: 'date',
		tag: 'date',
		title: 'Tag Date',
		height: 580,
		width: 400,
		html: html
	});
	
	$('#'+id+'_certainty input').change(function() {
		dialog.attributesWidget.setData({date: {cert: $(this).val()}});
	});
	$('#'+id+'_type input').click(function() {
		toggleDate($(this).val());
	});
	
	var dateInput = $('#'+id+'_cwrc_datePicker')[0];
	$(dateInput).focus(function() {
		$(this).css({borderBottom: ''});
	});
	
	$('#'+id+'_cwrc_datePicker').datepicker({
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
		buttonImageOnly: true
	});
	// wrap the datepicker div with our custom class
	// TODO find a better way to do this
	$('#ui-datepicker-div').wrap('<div class="cwrc" />');
	
	var startDate = $('#'+id+'_startDate')[0];
	$(startDate).focus(function() {
		$(this).css({borderBottom: ''});
	});
	var endDate = $('#'+id+'_endDate')[0];
	$(endDate).focus(function() {
		$(this).css({borderBottom: ''});
	});
	
	var dateRange = $('#'+id+'_startDate, #'+id+'_endDate').datepicker({
		dateFormat: 'yy-mm-dd',
		constrainInput: false,
		changeMonth: true,
		changeYear: true,
		yearRange: '-210:+10',
		minDate: new Date(1800, 0, 1),
		maxDate: new Date(2020, 11, 31),
		showOn: 'button',
		buttonText: 'Date Picker',
		buttonImage:  w.cwrcRootUrl+'img/calendar.png',
		buttonImageOnly: true,
		onSelect: function(selectedDate) {
			var option = this.id.indexOf("startDate") === -1 ? "maxDate" : "minDate";
			var instance = $(this).data("datepicker");
			var date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);
			dateRange.not(this).datepicker("option", option, date);
		}
	});
	
	var toggleDate = function(type) {
		if (type == 'date') {
			$('#'+id+'_date').show();
			$('#'+id+'_range').hide();
		} else {
			$('#'+id+'_date').hide();
			$('#'+id+'_range').show();
		}
	};
	
	dialog.$el.on('beforeShow', function(e, config) {
		if (dialog.mode === DialogForm.ADD) {
			var dateValue = '';
			
			var dateString = w.editor.currentBookmark.rng.toString();
			if (dateString != '') {
				var dateObj = moment(dateString).toDate(); // use moment library to parse date string properly
				var year = dateObj.getFullYear();
				if (!isNaN(year)) {
					if (dateString.length > 4) {
						var month = dateObj.getMonth();
						month++; // month is zero based index
						if (month < 10) month = '0'+month;
						var day = dateObj.getDate();
						if (day < 10) day = '0'+day;
						dateValue = year+'-'+month+'-'+day;
					} else {
						year++; // if just the year, Date makes it dec 31st at midnight of the prior year
						dateValue = year;
					}
				}
			}

			toggleDate('date');
			$('#'+id+'_type_date').prop('checked', true).button('refresh');
			dateInput.value = dateValue;
			startDate.value = '';
			endDate.value = '';
		} else {
			var data = config.entry.info;
			if (data.date) {
				toggleDate('date');
				$('#'+id+'_type_date').prop('checked', true).button('refresh');
				dateInput.value = data.date;
				startDate.value = '';
				endDate.value = '';
			} else {
				toggleDate('range');
				$('#'+id+'_type_range').prop('checked', true).button('refresh');
				dateInput.value = '';
				startDate.value = data.startDate;
				endDate.value = data.endDate;
			}
		}
		
		$(dateInput).css({borderBottom: ''});
		$(startDate).css({borderBottom: ''});
		$(endDate).css({borderBottom: ''});
		$(dateInput).focus();
	});
	
	dialog.$el.on('beforeSave', function() {
		var type = $('#'+id+'_type input:checked').val();
		if (type == 'date') {
			var dateString = dateInput.value;
			if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || dateString.match(/^\d{4}-\d{2}$/) || dateString.match(/^\d{4}$/)) {
				dialog.currentData.date = dateString;
			} else {
				$(dateInput).css({borderBottom: '1px solid red'});
				return false;
			}
		} else {
			var startString = startDate.value;
			var endString = endDate.value;
			var error = false;
			var padStart = '';
			var padEnd = '';
			
			if (startString.match(/^\d{4}-\d{2}-\d{2}$/)) {
				dialog.currentData.startDate = startString;
			} else if (startString.match(/^\d{4}-\d{2}$/)) {
				dialog.currentData.startDate = startString;
				padStart = '-01';
			} else if (startString.match(/^\d{4}$/)) {
				dialog.currentData.startDate = startString;
				padStart = '-01-01';
			} else {
				$(startDate).css({borderBottom: '1px solid red'});
				error = true;
			}
			
			if (endString.match(/^\d{4}-\d{2}-\d{2}$/)) {
				dialog.currentData.endDate = endString;
			} else if (endString.match(/^\d{4}-\d{2}$/)) {
				dialog.currentData.endDate = endString;
				padEnd = '-01';
			} else if (endString.match(/^\d{4}$/)) {
				dialog.currentData.endDate = endString;
				padEnd = '-01-01';
			} else {
				$(endDate).css({borderBottom: '1px solid red'});
				error = true;
			}
			
			var start = $.datepicker.parseDate('yy-mm-dd', startString+padStart);
			var end = $.datepicker.parseDate('yy-mm-dd', endString+padEnd);
			
			if (start > end) {
				$(startDate).css({borderBottom: '1px solid red'});
				$(endDate).css({borderBottom: '1px solid red'});
				error = true;
			}
			
			if (error) return false;
		}
	});
	
	return {
		show: function(config) {
			dialog.show(config);
		}
	};
};

});