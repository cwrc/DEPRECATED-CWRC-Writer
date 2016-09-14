define([
    'jquery',
    'jquery-ui',
    'dialogForm'
], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<label for="'+id+'_input">Standard name</label>'+
            '<input type="text" id="'+id+'_input" data-type="textbox" data-mapping="STANDARD" />'+
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
        height: 350,
        type: 'person',
        title: 'Tag Person',
        html: html
    });
    
    dialog.$el.on('beforeShow', function(e, config, dialog) {
        var cwrcInfo = dialog.currentData.cwrcInfo;
        if (cwrcInfo !== undefined) {
            dialog.attributesWidget.setData({REF: cwrcInfo.id});
            dialog.attributesWidget.expand();
        }
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});