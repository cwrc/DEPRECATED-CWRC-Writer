'use strict';

var $ = require('jquery');
require('jquery-ui-core');
require('jquery-ui/ui/widgets/dialog');
require('jquery-ui/ui/widgets/progressbar');
    
function LoadingIndicator(writer) {
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
    w.event('processingDocument').subscribe(function(percentComplete) {
        var val = percentComplete === undefined ? 50 : percentComplete;
        progressLabel.text('Processing Document');
        progressBar.progressbar('value', val);
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
            loadingIndicator.dialog('close');
            // FIXME need to close immediately because of problems if there's another modal showing
//            progressLabel.text('Document Loaded');
//            loadingIndicator.fadeOut(1000, function() {
//                loadingIndicator.dialog('close');
//            });
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

module.exports = LoadingIndicator;
