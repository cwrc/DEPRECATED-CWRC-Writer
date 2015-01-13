define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    var docsMappings;
    
    $.ajax({url: 'js/docsMappings.js', dataType: 'json'}).then(function(mappings) {
        docsMappings = mappings;
    });
    
    $(document.body).append(''+
    '<div id="helpDialog">'+
        '<div class="content"></div>'+
    '</div>');
    
    var $helpDialog = $('#helpDialog');
    $helpDialog.dialog({
        modal: true,
        resizable: true,
        closeOnEscape: true,
        height: 650,
        width: 650,
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