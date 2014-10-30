define([
    'jquery',
    'jquery-ui',
    'dialogForm'
], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        type: 'place',
        title: 'Tag Place',
        height: 150,
        width: 450,
        html: html
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});