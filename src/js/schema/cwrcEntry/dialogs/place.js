define([
    'jquery',
    'jquery-ui',
    'dialogForm'
], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<input type="hidden" id="'+id+'_ref" data-type="hidden" data-mapping="REF"/>'+
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
    
    dialog.$el.on('beforeShow', function(e, config, dialog) {
        var cwrcInfo = dialog.currentData.cwrcInfo;
        if (cwrcInfo !== undefined) {
            $('#'+id+'_ref').val(cwrcInfo.id);
        }
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});