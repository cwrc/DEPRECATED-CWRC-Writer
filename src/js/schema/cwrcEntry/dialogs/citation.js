define(['jquery', 'jquery-ui', 'dialogForm'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<p>Citation</p><textarea data-type="textbox" data-mapping="custom.content"></textarea>'+
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
        width: 385,
        height: 450,
        type: 'citation',
        title: 'Tag Citation',
        html: html
    });
    
    dialog.$el.on('beforeShow', function(e, config, dialog) {
        var cwrcInfo = dialog.currentData.cwrcInfo;
        if (cwrcInfo !== undefined) {
            dialog.attributesWidget.setData({REF: cwrcInfo.id});
            dialog.attributesWidget.expand();
        }
    });
    
    dialog.$el.on('beforeSave', function() {
        var content = dialog.currentData.customValues.content;
        dialog.currentData.noteContent = content;
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});