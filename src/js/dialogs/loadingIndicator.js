define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    $(document.body).append(''+
    '<div id="loadingIndicatorDialog">'+
        '<div class="progressBar"><div class="progressLabel"></div></div>'+
    '</div>');
    
    var loadingIndicator = $('#loadingIndicatorDialog');
    var $writer = $('#cwrc_wrapper');
    loadingIndicator.dialog({
        title: 'CWRC-Writer',
        modal: true,
        resizable: true,
        closeOnEscape: true,
        height: 160,
        width: 300,
        position: { my: "center", at: "center", of: $writer },
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
    w.event('documentLoaded').subscribe(function(success, docBody) {
        progressBar.progressbar('value', 100);
        if (success !== true) {
            progressLabel.text('Error Loading Document');
            loadingIndicator.dialog('option', 'buttons', {
                'Ok': function() {
                    loadingIndicator.dialog('close');
                }
            });
        } else {
            progressLabel.text('Document Loaded');
            loadingIndicator.fadeOut(1000, function() {
                loadingIndicator.dialog('close');
            });
        }
    });
    w.event('schemaLoaded').subscribe(function() {
        progressLabel.text('Schema Loaded');
    });
    
    return {
        show: function(config) {
            loadingIndicator.dialog('option', 'buttons', {});
            loadingIndicator.dialog('open');
        },
        hide: function() {
            loadingIndicator.dialog('close');
        }
    };
};

});
