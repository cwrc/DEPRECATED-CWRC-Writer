define(['jquery', 'jquery-ui', 'dialogForm'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<p>Correction</p><textarea data-type="textbox" data-mapping="custom.corrText"></textarea>'+
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
        height: 400,
        type: 'correction',
        title: 'Tag Correction',
        html: html
    });
    
    dialog.$el.on('beforeShow', function(e, config, dialog) {
        var sicText;
        if (dialog.mode === DialogForm.ADD) {
            sicText = w.editor.currentBookmark.rng.toString();
        } else {
            sicText = config.entry.getCustomValue('sicText');
        }
        if (sicText !== undefined && sicText !== '') {
            dialog.currentData.customValues.sicText = sicText;
        }
    });
    
    dialog.$el.on('beforeSave', function(e, dialog) {
        var sicText = dialog.currentData.customValues.sicText;
        var corrText = dialog.currentData.customValues.corrText;
        
        // copy customValues to attributes so they display in entitiesList
        // we don't want to store them as just attributes because technically they aren't attributes of this tag
        dialog.currentData.attributes.sicText = sicText;
        dialog.currentData.attributes.corrText = corrText;
        
        if (dialog.mode === DialogForm.EDIT) {
            // TODO
//            if (sicText == undefined) {
//                // edit the correction text
//                var entityStart = $('[name="'+w.entitiesManager.getCurrentEntity()+'"]', writer.editor.getBody())[0];
//                var textNode = w.utilities.getNextTextNode(entityStart);
//                textNode.textContent = data.corrText;
//            }
        } else {
            if (sicText === undefined) {
                // insert the correction text so we can make an entity out of that
                w.editor.execCommand('mceInsertContent', false, corrText);
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