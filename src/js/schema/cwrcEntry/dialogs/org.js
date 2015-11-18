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
        '<div>'+
            '<p>Organization type:</p>'+
            '<select data-type="select" data-mapping="ORGTYPE">'+
                '<option value=""></option>'+
                '<option value="labour">labour</option>'+
                '<option value="club or society">club or society</option>'+
                '<option value="political">political</option>'+
                '<option value="academic">academic</option>'+
                '<option value="research">research</option>'+
                '<option value="corporate">corporate</option>'+
                '<option value="activist">activist</option>'+
                '<option value="governmental">governmental</option>'+
                '<option value="military">military</option>'+
                '<option value="law-enforcement">law-enforcement</option>'+
                '<option value="professional">professional</option>'+
                '<option value="sporting">sporting</option>'+
                '<option value="medical">medical</option>'+
                '<option value="altruistic">altruistic</option>'+
                '<option value="non-profit">non-profit</option>'+
                '<option value="artistic">artistic</option>'+
                '<option value="dramatic">dramatic</option>'+
                '<option value="ethnic">ethnic</option>'+
                '<option value="literary">literary</option>'+
                '<option value="musical">musical</option>'+
                '<option value="religious">religious</option>'+
                '<option value="publishing">publishing</option>'+
                '<option value="school">school</option>'+
            '</select>'+
        '</div>'+
        '<input type="hidden" id="'+id+'_ref" data-type="hidden" data-mapping="REF"/>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        width: 200,
        height: 200,
        type: 'org',
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