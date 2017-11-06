define([
    'jquery',
    'jquery-ui',
    'dialogForm'
], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div id="'+id+'_tagAs">'+
            '<p>Tag as:</p>'+
            '<span class="tagAs" data-type="tagAs"></span>'+
        '</div>'+
        '<div id="'+id+'_certainty" data-transform="buttonset" data-type="radio" data-mapping="cert">'+
            '<p>This identification is:</p>'+
            '<input type="radio" id="'+id+'_high" name="'+id+'_id_certainty" value="high" data-default="true" /><label for="'+id+'_high">High</label>'+
            '<input type="radio" id="'+id+'_low" name="'+id+'_id_certainty" value="low" /><label for="'+id+'_low">Low</label>'+
            '<input type="radio" id="'+id+'_medium" name="'+id+'_id_certainty" value="medium" /><label for="'+id+'_medium">Medium</label>'+
            '<input type="radio" id="'+id+'_unknown" name="'+id+'_id_certainty" value="unknown" /><label for="'+id+'_unknown">Unknown</label>'+
        '</div>'+
        '<div data-transform="accordion">'+
            '<h3>Markup options</h3>'+
            '<div id="'+id+'_teiParent" class="attributes" data-type="attributes" data-mapping="attributes">'+
            '</div>'+
        '</div>'+
        '<input type="hidden" id="'+id+'_ref" data-type="hidden" data-mapping="ref"/>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        width: 400,
        height: 450,
        type: 'org',
        tag: 'orgName',
        title: 'Tag Organization',
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