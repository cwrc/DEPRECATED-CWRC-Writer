define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    function createMessageDialog(config) {
        var id = w.getUniqueId('msg');
        
        $(document.body).append(''+
        '<div id="'+id+'">'+
            '<p>'+
            '<span class="ui-state-highlight" style="border: none;"><span style="float: left; margin-right: 4px;" class="ui-icon ui-icon-info"></span></span>'+
            '<span class="ui-state-error" style="border: none;"><span style="float: left; margin-right: 4px;" class="ui-icon ui-icon-alert"></span></span>'+
            '<span class="message"></span>'+
            '</p>'+
        '</div>');
        var message = $('#'+id);
        
        var title = config.title;
        var modal = config.modal == null ? true : config.modal;
        var $writer = $('#cwrc_wrapper');
        message.dialog({
            title: title,
            modal: modal,
            resizable: true,
            closeOnEscape: true,
            height: 250,
            width: 300,
            position: { my: "center", at: "center", of: $writer },
            autoOpen: false,
            close: function(ev) {
                message.dialog('destroy');
                message.remove();
            }
        });
        
        var msg = config.msg;
        message.find('p > span[class=message]').html(msg);
        
        var type = config.type;
        message.find('p > span[class^=ui-state]').hide();
        if (type == 'info') {
            message.find('p > span[class=ui-state-highlight]').show();
        } else if (type == 'error') {
            message.find('p > span[class=ui-state-error]').show();
        }
        
        return message;
    }
    
    
    return {
        show: function(config) {
            var message = createMessageDialog(config);
            message.dialog('option', 'buttons', {
                'Ok': function() {
                    message.dialog('close');
                }
            });
            message.dialog('open');
        },
        confirm: function(config) {
            var message = createMessageDialog(config);
            var callback = config.callback;
            message.dialog('option', 'buttons', {
                'Yes': function() {
                    message.dialog('close');
                    callback(true);
                },
                'No': function() {
                    message.dialog('close');
                    callback(false);
                }
            });
            message.dialog('open');
        },
        hide: function() {
        }
    };
};

});
