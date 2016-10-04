define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    $('#headerButtons').append(''+
    '<div id="headerLink"><h2>Edit Header</h2></div>');
    
    $(document.body).append(''+
    '<div id="headerDialog">'+
    '<div><textarea></textarea></div>'+
    '</div>');
    
    var header = $('#headerDialog');
    var $writer = $('#cwrc_wrapper');
    header.dialog({
        title: 'Edit Header',
        modal: true,
        resizable: true,
        height: 380,
        width: 400,
        position: { my: "center", at: "center", of: $writer },
        autoOpen: false,
        buttons: {
            'Ok': function() {
                var editorString = '<head>'+$('#headerDialog textarea').val()+'</head>';
                var xml;
                try {
                    xml = $.parseXML(editorString);
                } catch(e) {
                    w.dialogManager.show('message', {
                        title: 'Invalid XML',
                        msg: 'There was an error parsing the XML.',
                        type: 'error'
                    });
                    return false;
                }
                
                var headerString = '';
                $(xml).find('head').children().each(function(index, el) {
                    headerString += w.converter.buildEditorString(el);
                });
                $('[_tag="'+w.header+'"]', w.editor.getBody()).html(headerString);
                
                header.dialog('close');
            },
            'Cancel': function() {
                header.dialog('close');
            }
        }
    });
    
    function doOpen() {
        var headerString = '';
        var headerEl = $('[_tag="'+w.header+'"]', w.editor.getBody());
        headerEl.children().each(function(index, el) {
            headerString += w.converter.buildXMLString($(el));
        });
        $('#headerDialog textarea').val(headerString);
        header.dialog('open');
    }
    
    $('#headerLink').click(function() {
        doOpen();
    });
    
    return {
        show: function(config) {
            doOpen();
        },
        hide: function() {
            header.dialog('close');
        }
    };
};

});
