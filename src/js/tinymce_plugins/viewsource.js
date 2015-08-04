(function(tinymce) {
    // make sure snippet is available
    var $ = require('jquery');
    require(['jquery.snippet']);
    
    tinymce.PluginManager.add('viewsource', function(editor) {
        
        function htmlEncode(str) {
            return str.replace(/[&<>"']/g, function($0) {
                return "&" + {"&":"amp", "<":"lt", ">":"gt", '"':"quot", "'":"#39"}[$0] + ";";
            });
        }
        
        $(document.body).append(''+
            '<div id="viewSourceDialog">'+
            '</div>'
        );
            
        var d = $('#viewSourceDialog');
        d.dialog({
            title: 'View Source',
            modal: true,
            resizable: true,
            closeOnEscape: true,
            height: 480,
            width: 640,
            autoOpen: false,
            buttons: {
                'Ok': function() {
                    d.dialog('close');
                }
            }
        });
        
        editor.addCommand('viewSource', function() {
            var content = editor.writer.converter.getDocumentContent(false);
            var source = '<pre>'+htmlEncode(content)+'</pre>';
            $('#viewSourceDialog').html(source);
            $('#viewSourceDialog > pre').snippet('html', {
                style: 'typical',
                transparent: true,
                showNum: false,
                menu: false
            });
            d.dialog('open');
        });
        
        editor.addButton('viewsource', {
            title: 'View Source',
            image: editor.writer.cwrcRootUrl+'img/page_white_code.png',
            onclick: function() {
                editor.execCommand('removeHighlights');
                editor.execCommand('viewSource');
            }
        });
    });
})(tinymce);