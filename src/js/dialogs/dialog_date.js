var DateDialog = function(config) {
	var w = config.writer;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	$(document.body).append(''+
	'<div id="dateDialog">'+
		'<div style="float: right; width: 100px;">'+
		'<input type="radio" name="dateType" value="date" id="type_date" checked="checked"/><label for="type_date">Date</label><br/>'+
		'<input type="radio" name="dateType" value="range" id="type_range"/><label for="type_range">Date Range</label>'+
		'</div>'+
		'<div id="date">'+
		'<label for="datePicker">Date</label><input type="text" id="datePicker" />'+
		'</div>'+
		'<div id="range">'+
		'<label for="startDate">Start Date</label><input type="text" id="startDate" style="margin-bottom: 5px;"/><br />'+
	    '<label for="endDate">End Date</label><input type="text" id="endDate" />'+
	    '</div>'+
	    '<p>Format: yyyy or yyyy-mm-dd<br/>e.g. 2010, 2010-10-05</p>'+
	'</div>');
	
	var date = $('#dateDialog');
	date.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#dateDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 200,
		width: 375,
		autoOpen: false,
		buttons: {
			'Tag Date': function() {
				dateResult();
			},
			'Cancel': function() {
				dateResult(true);
			}
		}
	});
	
	var dateInput = $('#datePicker')[0];
	$(dateInput).focus(function() {
		$(this).css({borderBottom: ''});
	});
	
	$('#dateDialog input[name="dateType"]').change(function() {
		var type = this.id.split('_')[1];
		toggleDate(type);
	});
	
	$('#dateDialog input').keyup(function(event) {
		if (event.keyCode == '13') {
			event.preventDefault();
			dateResult();
		}
	});
	
	$('#datePicker').datepicker({
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
	
	var startDate = $('#startDate')[0];
	$(startDate).focus(function() {
		$(this).css({borderBottom: ''});
	});
	var endDate = $('#endDate')[0];
	$(endDate).focus(function() {
		$(this).css({borderBottom: ''});
	});
	
	var dateRange = $('#startDate, #endDate').datepicker({
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
			var option = this.id == "startDate" ? "minDate" : "maxDate";
			var instance = $(this).data("datepicker");
			var date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);
			dateRange.not(this).datepicker("option", option, date);
		}
	});
	
	var toggleDate = function(type) {
		if (type == 'date') {
			$('#date').show();
			$('#range').hide();
		} else {
			$('#date').hide();
			$('#range').show();
		}
	};
	
	var dateResult = function(cancelled) {
		var data = {};
		if (!cancelled) {
			var type = $('#type_date:checked').val();
			if (type == 'date') {
				var dateString = dateInput.value;
				if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || dateString.match(/^\d{4}$/)) {
					data.date = dateString;
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
					data.startDate = startString;
				} else if (startString.match(/^\d{4}$/)) {
					data.startDate = startString;
					padStart = '-01-01';
				} else {
					$(startDate).css({borderBottom: '1px solid red'});
					error = true;
				}
				
				if (endString.match(/^\d{4}-\d{2}-\d{2}$/)) {
					data.endDate = endString;
				} else if (endString.match(/^\d{4}$/)) {
					data.endDate = endString;
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
		} else {
			data = null;
		}
		if (mode == EDIT && data != null) {
			w.editEntity(w.editor.currentEntity, data);
		} else {
			w.finalizeEntity('date', data);
		}
		date.dialog('close');
	};
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Tag ';
			
			if (mode == ADD) {
				var dateValue = '';
				var dateString = w.editor.currentBookmark.rng.toString();
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

				toggleDate('date');
				$('#type_date').attr('checked', true);
				dateInput.value = dateValue;
				startDate.value = '';
				endDate.value = '';
			} else {
				prefix = 'Edit ';
				var info = config.entry.info;
				if (info.date) {
					toggleDate('date');
					$('#type_date').attr('checked', true);
					dateInput.value = info.date;
					startDate.value = '';
					endDate.value = '';
				} else {
					toggleDate('range');
					$('#type_date').attr('checked', false);
					dateInput.value = '';
					startDate.value = info.startDate;
					endDate.value = info.endDate;
				}
			}
			
			$(dateInput).css({borderBottom: ''});
			$(startDate).css({borderBottom: ''});
			$(endDate).css({borderBottom: ''});
			var title = prefix+config.title;
			date.dialog('option', 'title', title);
			if (config.pos) {
				date.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				date.dialog('option', 'position', 'center');
			}
			date.dialog('open');
			$(dateInput).focus();
		},
		hide: function() {
			date.dialog('close');
		}
	};
};