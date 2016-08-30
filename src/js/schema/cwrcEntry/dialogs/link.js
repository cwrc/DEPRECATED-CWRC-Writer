define(['jquery', 'jquery-ui', 'dialogForm'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<label for="'+id+'_input">Hypertext link (URL or URI)</label>'+
            '<input type="text" id="'+id+'_input" data-type="textbox" data-mapping="URL" style="margin-right: 10px;"/>'+
            '<button type="button">Check Link</button>'+
        '</div>'+
        '<div data-transform="accordion">'+
            '<h3>Markup options</h3>'+
            '<div id="'+id+'_attParent" class="attributes" data-type="attributes" data-mapping="attributes">'+
            '</div>'+
        '</div>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        width: 350,
        height: 370,
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