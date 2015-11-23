define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    var firstCopy = true;
    var firstPaste = true;
    
    var cwrcCopy = false;
    
    var copyMsg = 'It looks like you\'re trying to copy content.<br/>Consider having a look at the <a href="">Copy & Paste Documentation</a>';
    var pasteMsg = 'It looks like you\'re trying to paste from outside CWRC-Writer. Be aware that <b>all tags will be removed</b> and only plain text will remain.<br/>Consider having a look at the <a href="">Copy & Paste Documentation</a>';
    
    $(document.body).append(''+
    '<div id="copyPasteDialog">'+
        '<div class="content"></div>'+
    '</div>');
    
    var $copyPasteDialog = $('#copyPasteDialog');
    $copyPasteDialog.dialog({
        title: 'Copy & Paste Help',
        modal: true,
        resizable: true,
        closeOnEscape: true,
        height: 150,
        width: 350,
        autoOpen: false,
        dialogClass: 'splitButtons',
        buttons: [{
            text: 'Ok',
            click: function() {
                $copyPasteDialog.dialog('close');
            }
        }]
    });
    
    w.event('contentCopied').subscribe(function() {
        cwrcCopy = true;
        if (firstCopy) {
            firstCopy = false;
            cp.show({
                type: 'copy'
            });
        }
    });
    
    w.event('contentPasted').subscribe(function() {
        if (firstPaste && !cwrcCopy) {
            firstPaste = false;
            cp.show({
                type: 'paste'
            });
        }
        cwrcCopy = false;
    });
    
    var cp = {
        show: function(config) {
            var type = config.type;
            var modal = config.modal === undefined ? false : config.modal;
            
            $copyPasteDialog.dialog('option', 'modal', modal);
            
            var msg;
            if (type == 'copy') {
                msg = copyMsg;
            } else if (type == 'paste') {
                msg = pasteMsg;
            }
            $copyPasteDialog.find('.content').html(msg);
            $copyPasteDialog.find('a').on('click', function(e) {
                e.preventDefault();
                $copyPasteDialog.dialog('close');
                w.dialogManager.show('help', {
                    id: 'copyPaste',
                    title: 'Copy & Paste Help'
                });
            });
            
            $copyPasteDialog.dialog('open');
        },
        hide: function() {
            $copyPasteDialog.dialog('close');
        }
    };
    
    return cp;
};

});