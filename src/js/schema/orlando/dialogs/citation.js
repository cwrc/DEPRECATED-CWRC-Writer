define(['jquery', 'jquery-ui', 'dialogForm'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<p>Citation</p><textarea data-type="textbox" data-mapping="custom.content"></textarea>'+
        '</div>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        width: 385,
        height: 250,
        type: 'citation',
        title: 'Tag Citation',
        html: html
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});