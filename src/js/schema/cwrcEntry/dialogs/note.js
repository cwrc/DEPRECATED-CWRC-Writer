define(['jquery', 'jquery-ui', 'tinymce', 'dialogForm'], function($, jqueryUi, tinymce, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var iframe = null;
    var cwrcWriter = null;
    
    var html = ''+
    '<div id="'+id+'Dialog">'+
        '<div style="position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px; text-align: center;">'+
            '<div id="'+id+'_type" data-transform="buttonset" data-type="radio" data-mapping="prop.tag">'+
                '<input type="radio" id="'+id+'_re" name="'+id+'_type" value="RESEARCHNOTE" data-default="true" /><label for="'+id+'_re">Research Note</label>'+
                '<input type="radio" id="'+id+'_scho" name="'+id+'_type" value="SCHOLARNOTE" /><label for="'+id+'_scho">Scholarly Note</label>'+
            '</div>'+
        '</div>'+
        '<div style="position: absolute; top: 35px; left: 5px; right: 5px; bottom: 5px; border: 1px solid #ccc;">'+
            '<iframe style="width: 100%; height: 100%; border: none;"/>'+ // set src dynamically
        '</div>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        width: 850,
        height: 650,
        type: 'note',
        title: 'Tag Note',
        html: html
    });
    
    $('#'+id+'_type input').click(function() {
        var newTag = $(this).val();
        var allOtherTags = $(this).siblings('input').map(function(index, el) {
            return $(el).val();
        }).get();
        var tagsSelector = '';
        for (var i = 0, len = allOtherTags.length; i < len; i++) {
            tagsSelector += '*[_tag="'+allOtherTags[i]+'"]';
            if (len > 1 && i !== len-1) {
                tagsSelector += ',';
            }
        }
        var parentTag = $(tagsSelector, cwrcWriter.editor.getBody()).first();
        cwrcWriter.tagger.changeTagValue(parentTag, newTag);
    });
    
    dialog.$el.on('beforeShow', function(e, config) {
        iframe = dialog.$el.find('iframe')[0];
        iframe.src = 'note.htm';
        
        // hack to get the writer
        function getCwrcWriter() {
            cwrcWriter = iframe.contentWindow.writer;
            if (cwrcWriter == null) {
                setTimeout(getCwrcWriter, 50);
            } else {
                cwrcWriter.event('writerInitialized').subscribe(postSetup);
            }
        }
        
        function postSetup() {
            iframe.contentWindow.tinymce.DOM.counter = tinymce.DOM.counter + 1;
            
            cwrcWriter.event('documentLoaded').subscribe(function() {
                // TODO remove forced XML/no overlap
                cwrcWriter.mode = cwrcWriter.XML;
                cwrcWriter.allowOverlap = false;
                
                cwrcWriter.editor.focus();
            });
            
            // in case document is loaded before tree
            cwrcWriter.event('structureTreeInitialized').subscribe(function(tree) {
                setTimeout(tree.update, 50); // need slight delay to get indents working for some reason
            });
            cwrcWriter.event('entitiesListInitialized').subscribe(function(el) {
                setTimeout(el.update, 50);
            });
            
            if (dialog.mode === DialogForm.ADD) {
                var noteUrl = w.cwrcRootUrl+'js/schema/cwrcEntry/xml/note_'+writer.schemaManager.schemaId+'.xml';
                cwrcWriter.fileManager.loadDocumentFromUrl(noteUrl);
            } else {
                var parent = config.entry.getTag();
                xmlDoc = $.parseXML(config.entry.getCustomValue('content'));
                var annotation = $(parent, xmlDoc).first();
                // remove the annotationId attribute
                annotation.removeAttr('annotationId');
                // insert the appropriate wrapper tags
                var xml = $.parseXML('<'+writer.root+'><'+parent+'></'+parent+'></'+writer.root+'>');
                var xmlDoc = $(xml).find(parent).append(annotation.contents()).end()[0];
                cwrcWriter.fileManager.loadDocumentFromXml(xmlDoc);
            }
        }
        
        getCwrcWriter();
    });
    
    dialog.$el.on('beforeClose', function() {
        try {
            cwrcWriter.editor.remove();
            cwrcWriter.editor.destroy();
            iframe.src = 'about:blank';
        } catch (e) {
            // editor wasn't fully initialized
        }
    });
    
    dialog.$el.on('beforeSave', function() {
        tinymce.DOM.counter = iframe.contentWindow.tinymce.DOM.counter + 1;
        
        var content = cwrcWriter.converter.getDocumentContent();
        dialog.currentData.customValues.content = content;
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});