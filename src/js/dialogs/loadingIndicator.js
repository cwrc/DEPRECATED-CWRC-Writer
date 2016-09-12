define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    $(document.body).append(''+
    '<div id="loadingIndicatorDialog">'+
        '<div class="progressBar"><div class="progressLabel"></div></div>'+
        '<h4></h4>'+
        '<p>'+
        '<span class="ui-state-highlight" style="border: none;"><span style="float: left; margin-right: 4px;" class="ui-icon ui-icon-info"></span></span>'+
        '<span class="ui-state-error" style="border: none;"><span style="float: left; margin-right: 4px;" class="ui-icon ui-icon-alert"></span></span>'+
        '<span class="message"></span>'+
        '</p>'+
    '</div>');
    
    var loadingIndicator = $('#loadingIndicatorDialog');
    loadingIndicator.dialog({
        title: 'CWRC-Writer',
        modal: true,
        resizable: true,
        closeOnEscape: true,
        height: 300,
        width: 300,
        autoOpen: false
    });
    
    var progressBar = loadingIndicator.find('.progressBar');
    progressBar.progressbar({
        value: 0
    });
    var progressLabel = loadingIndicator.find('.progressLabel');
    
    w.event('loadingDocument').subscribe(function() {
        w.dialogManager.show('loadingindicator');
        progressLabel.text('Loading Document');
        progressBar.progressbar('value', 5);
    });
    w.event('processingDocument').subscribe(function() {
        progressLabel.text('Processing Document');
        progressBar.progressbar('value', 50);
    });
    w.event('documentLoaded').subscribe(function(docBody, msgObj) {
        progressLabel.text('Document Loaded');
        progressBar.progressbar('value', 100);
        showMessage(msgObj);
    });
    w.event('schemaLoaded').subscribe(function() {
        progressLabel.text('Schema Loaded');
    });
    
    function showMessage(config) {
        var title = config.title;
        var msg = config.msg;
        var type = config.type;
        
        if (type == 'info') {
            $('#loadingIndicatorDialog > p > span[class=ui-state-highlight]').show();
        } else if (type == 'error') {
            $('#loadingIndicatorDialog > p > span[class=ui-state-error]').show();
        }
        
        $('#loadingIndicatorDialog > h4').html(title);
        $('#loadingIndicatorDialog > p > span[class=message]').html(msg);
        
        loadingIndicator.dialog('option', 'buttons', {
            'Ok': function() {
                loadingIndicator.dialog('close');
            }
        });
    }
    
    return {
        show: function(config) {
            $('#loadingIndicatorDialog > h4').html('');
            $('#loadingIndicatorDialog > p > span[class=message]').html('');
            $('#loadingIndicatorDialog > p > span[class^=ui-state]').hide();
            loadingIndicator.dialog('option', 'buttons', {});
            loadingIndicator.dialog('open');
        },
        hide: function() {
            loadingIndicator.dialog('close');
        }
    };
};

});