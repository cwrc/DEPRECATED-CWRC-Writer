define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    var docsMappings;
    
    require(['text!docsMappings.js'], function(mappings) {
       docsMappings = $.parseJSON(mappings); 
    });
    
    $(document.body).append(''+
    '<div id="helpDialog">'+
        '<div class="content"></div>'+
    '</div>');
    
    var $helpDialog = $('#helpDialog');
    var $writer = $('#cwrc_wrapper');
    $helpDialog.dialog({
        modal: true,
        resizable: true,
        closeOnEscape: true,
        height: 650,
        width: 650,
        position: { my: "center", at: "center", of: $writer },
        autoOpen: false,
        dialogClass: 'splitButtons',
        buttons: [{
            text: 'View full Documentation',
            'class': 'left',
            click: function() {
                window.open('http://cwrc.ca/CWRC-Writer_Documentation/');
            }
        },{
            text: 'Ok',
            click: function() {
                $helpDialog.dialog('close');
            }
        }]
    });
    
    function showContent(content) {
        $('div.content', $helpDialog).html(content);
        
        // handle internal docs links (this assumes there are no external doc links)
        $('div.content a', $helpDialog).on('click', function(e) {
            e.preventDefault();
            var url = $(e.target).attr('href');
            w.delegator.getDocumentation(url, function(doc) {
                var content = $(doc).find('body')[0].innerHTML;
                showContent(content);
                $helpDialog[0].scrollTop = 0;
            });
        });
        
        $helpDialog.dialog('open');
    }
    
    return {
        show: function(config) {
            var title = config.title;
            var content = config.content;
            var id = config.id;
            var modal = config.modal === undefined ? false : config.modal;
            
            $helpDialog.dialog('option', 'title', title);
            $helpDialog.dialog('option', 'modal', modal);
            
            if (content !== undefined) {
                showContent(content);
            } else if (id !== undefined) {
                var url = docsMappings[id];
                if (url !== undefined) {
                    w.delegator.getDocumentation(url, function(doc) {
                        var content = $(doc).find('body')[0].innerHTML;
                        showContent(content);
                    });
                }
            }
        },
        hide: function() {
            $helpDialog.dialog('close');
        }
    };
};

});
