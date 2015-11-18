define(['jquery', 'jquery-ui', 'dialogForm'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<p>Correction</p><textarea data-type="textbox" data-mapping="CORR"></textarea>'+
        '</div>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        width: 385,
        height: 250,
        type: 'correction',
        title: 'Tag Correction',
        html: html
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});