define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    $(document.body).append(''+
    '<div id="addEventDialog">'+
        '<div>'+
        '<label>Event Name</label>'+
        '<input type="text" name="eventname" value=""/>'+
        '</div>'+
        '<div style="float: right; width: 100px;">'+
        '<input type="radio" name="addDateType" value="date" id="add_type_date" checked="checked"/><label for="add_type_date">Date</label><br/>'+
        '<input type="radio" name="addDateType" value="range" id="add_type_range"/><label for="add_type_range">Date Range</label>'+
        '</div>'+
        '<div id="addDate">'+
        '<label for="addDatePicker">Date</label><input type="text" id="addDatePicker" />'+
        '</div>'+
        '<div id="addRange">'+
        '<label for="addStartDate">Start Date</label><input type="text" id="addStartDate" style="margin-bottom: 5px;"/><br />'+
        '<label for="addEndDate">End Date</label><input type="text" id="addEndDate" />'+
        '</div>'+
        '<p>Format: yyyy or yyyy-mm-dd<br/>e.g. 2010, 2010-10-05</p>'+
        '<button type="button">Add Further Information</button>'+
        '<p>Note: for DEMO purposes only. Saves are NOT permanent.'+
    '</div>');
    
    var d = $('#addEventDialog');
    d.dialog({
        modal: true,
        resizable: false,
        closeOnEscape: false,
        open: function(event, ui) {
            $('#addEventDialog').parent().find('.ui-dialog-titlebar-close').hide();
        },
        title: 'Create New Event',
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
    
    $('#addEventDialog > button').button();
    
    var dateInput = $('#addDatePicker')[0];
    $(dateInput).focus(function() {
        $(this).css({borderBottom: ''});
    });
    
    $('#addEventDialog input[name="addDateType"]').change(function() {
        var type = this.id.split('_')[2];
        toggleDate(type);
    });
    
    $('#addEventDialog input').keyup(function(event) {
        if (event.keyCode == '13') {
            event.preventDefault();
//            dateResult();
        }
    });
    
    $('#addDatePicker').datepicker({
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
    
    var startDate = $('#addStartDate')[0];
    $(startDate).focus(function() {
        $(this).css({borderBottom: ''});
    });
    var endDate = $('#addEndDate')[0];
    $(endDate).focus(function() {
        $(this).css({borderBottom: ''});
    });
    
    var dateRange = $('#addStartDate, #addEndDate').datepicker({
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
            var option = this.id == "startDate" ? "minDate" : "maxDate";
            var instance = $(this).data("datepicker");
            var date = $.datepicker.parseDate(instance.settings.dateFormat || $.datepicker._defaults.dateFormat, selectedDate, instance.settings);
            dateRange.not(this).datepicker("option", option, date);
        }
    });
    
    var toggleDate = function(type) {
        if (type == 'date') {
            $('#addDate').show();
            $('#addRange').hide();
        } else {
            $('#addDate').hide();
            $('#addRange').show();
        }
    };
    
    var dateResult = function(cancelled) {
        var data = {};
        if (!cancelled) {
            var type = $('#addEventDialog input[name="addDateType"]:checked', date).val();
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
        
        d.dialog('close');
    };
    
    return {
        show: function(config) {
//            toggleDate('date');
//            $('#add_type_date').attr('checked', true);
//            
//            $(dateInput).css({borderBottom: ''});
//            $(startDate).css({borderBottom: ''});
//            $(endDate).css({borderBottom: ''});
//            
//            $('#addEventDialog input').val('');
//            d.dialog('open');
            w.dialogManager.show('message', {
                title: 'Event Under Development',
                msg: 'The Event dialog is currently under development and cannot be used at this time.',
                type: 'info'
            });
        },
        hide: function() {
            d.dialog('close');
        }
    };
};

});