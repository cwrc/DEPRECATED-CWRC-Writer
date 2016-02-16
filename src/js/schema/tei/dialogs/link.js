define(['jquery', 'jquery-ui', 'dialogForm'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog">'+
        '<div>'+
            '<label for="'+id+'_input">Hypertext link (URL or URI)</label>'+
            '<input type="text" id="'+id+'_input" data-type="textbox" data-mapping="target" style="margin-right: 10px;"/>'+
            '<button type="button">Check Link</button>'+
        '</div>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        width: 345,
        height: 125,
        type: 'link',
        title: 'Tag Link',
        html: html
    });
    
    $('#'+id+'Dialog button').button().click(function() {
        var src = $('#'+id+'_input').val();
        if (src != '') {
            if (src.match(/^https?:\/\//) == null) {
                src = 'http://'+src;
            }
            try {
                window.open(src, 'linkTestWindow');
            } catch(e) {
                alert(e);
            }
        }
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});