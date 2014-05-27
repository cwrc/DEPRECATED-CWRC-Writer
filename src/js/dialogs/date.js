define(['jquery',
        'jquery-ui',
        'moment',
        'attributeWidget'
], function($, jqueryUi, moment, AttributeWidget) {
	
return function(writer) {
	var w = writer;
	
	var id = 'dateDialog';
	
	var attWidgetInit = false;
	var attributeWidget;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var initAttributeWidget = function() {
		var dateAtts = w.utilities.getChildrenForTag({tag: 'date', type: 'attribute', returnType: 'array'});
		for (var i = 0; i < dateAtts.length; i++) {
			dateAtts[i].parent = 'date';
		}
		attributeWidget.buildWidget(dateAtts);
		attWidgetInit = true;
	};
	
	$(document.body).append(''+
	'<div id="'+id+'" class="annotationDialog">'+
		'<div id="'+id+'_type">'+
			'<p>Date type:</p>'+
			'<input type="radio" name="dateType" value="date" id="'+id+'_type_date" checked="checked"/><label for="'+id+'_type_date">Single Date</label>'+
			'<input type="radio" name="dateType" value="range" id="'+id+'_type_range"/><label for="'+id+'_type_range">Date Range</label>'+
		'</div>'+
		'<div id="date">'+
			'<label for="cwrc_datePicker">Date:</label><br/><input type="text" id="cwrc_datePicker" />'+
		'</div>'+
		'<div id="range">'+
			'<label for="startDate">Start date:</label><br/><input type="text" id="startDate" style="margin-bottom: 5px;"/><br />'+
		    '<label for="endDate">End date:</label><br/><input type="text" id="endDate" />'+
	    '</div>'+
	    '<div>Format: YYYY, YYYY-MM, or YYYY-MM-DD<br/>e.g. 2010, 2010-10, 2010-10-31</div>'+
	    '<div id="'+id+'_certainty">'+
	    	'<p>This identification is:</p>'+
			'<input type="radio" id="'+id+'_definite" name="'+id+'_id_certainty" value="definite" /><label for="'+id+'_definite">Definite</label>'+
			'<input type="radio" id="'+id+'_reasonable" name="'+id+'_id_certainty" value="reasonably certain" /><label for="'+id+'_reasonable">Reasonably Certain</label>'+
			'<input type="radio" id="'+id+'_probable" name="'+id+'_id_certainty" value="probable" /><label for="'+id+'_probable">Probable</label>'+
			'<input type="radio" id="'+id+'_speculative" name="'+id+'_id_certainty" value="speculative" /><label for="'+id+'_speculative">Speculative</label>'+
	    '</div>'+
	    '<div>'+
		    '<h3>Markup options</h3>'+
		    '<div id="'+id+'_teiParent" style="position: relative; height: 200px;">'+
		    '</div>'+
		'</div>'+
	'</div>');
	
	$('#'+id+'_teiParent').parent().accordion({
		heightStyle: 'content',
		animate: false,
		collapsible: true,
		active: false
	});
	
	var date = $('#'+id);
	date.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#'+id).parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 580,
		width: 400,
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
	
	$('#'+id+'_certainty').buttonset();
	$('#'+id+'_type').buttonset();
	$('#'+id+'_type input').click(function() {
		toggleDate($(this).val());
	});
	
	var dateInput = $('#cwrc_datePicker')[0];
	$(dateInput).focus(function() {
		$(this).css({borderBottom: ''});
	});
	
	$('#'+id+' input').keyup(function(event) {
		if (event.keyCode == '13') {
			event.preventDefault();
			dateResult();
		}
	});
	
	$('#cwrc_datePicker').datepicker({
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
			var type = $('#'+id+'_type input:checked').val();
			if (type == 'date') {
				var dateString = dateInput.value;
				if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) || dateString.match(/^\d{4}-\d{2}$/) || dateString.match(/^\d{4}$/)) {
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
				} else if (startString.match(/^\d{4}-\d{2}$/)) {
					data.startDate = startString;
					padStart = '-01';
				} else if (startString.match(/^\d{4}$/)) {
					data.startDate = startString;
					padStart = '-01-01';
				} else {
					$(startDate).css({borderBottom: '1px solid red'});
					error = true;
				}
				
				if (endString.match(/^\d{4}-\d{2}-\d{2}$/)) {
					data.endDate = endString;
				} else if (endString.match(/^\d{4}-\d{2}$/)) {
					data.endDate = endString;
					padEnd = '-01';
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
			
			data.certainty = $('#'+id+'_certainty input:checked').val();
			data.attributes = attributeWidget.getData();
			
		} else {
			data = null;
		}
		if (mode == EDIT && data != null) {
			w.tagger.editEntity(w.editor.currentEntity, data);
		} else {
			w.tagger.finalizeEntity('date', data);
		}
		date.dialog('close');
	};
	
	attributeWidget = new AttributeWidget({writer: w, parentId: id+'_teiParent'});
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			
			if (attWidgetInit == false) {
				initAttributeWidget();
			}
			
			var prefix = 'Tag ';
			
			// reset the form
			attributeWidget.reset();
			$('#'+id+'_type input:checked').prop('checked', false).button('refresh');
			$('#'+id+'_certainty input:checked').prop('checked', false).button('refresh');
			$('#'+id+'_teiParent').parent().accordion('option', 'active', false);
			
			if (mode == ADD) {
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
				prefix = 'Edit ';
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
				
				var showWidget = attributeWidget.setData(data.attributes);
				if (showWidget) {
					$('#'+id+'_teiParent').parent().accordion('option', 'active', 0);
				}
				
				$('#'+id+'_certainty input[value="'+data.certainty+'"]').prop('checked', true).button('refresh');
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

});