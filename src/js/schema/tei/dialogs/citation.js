define(['jquery', 'jquery-ui', 'tinymce', 'dialogForm'], function($, jqueryUi, tinymce, DialogForm) {

return function(id, writer) {
    var w = writer;

    var iframe = null;
    var cwrcWriter = null;

    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div style="position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;">'+
            '<p>Selected source:</p>'+
            '<span class="tagAs" data-type="tagAs"></span>'+
            '<p style="margin-top: 20px;">Text of citation:</p>'+
        '</div>'+
        '<div style="position: absolute; top: 85px; left: 5px; right: 5px; bottom: 5px; border: 1px solid #ccc;">'+
            '<iframe style="width: 100%; height: 100%; border: none;"/>'+ // set src dynamically
        '</div>'+
        '<input type="hidden" id="'+id+'_ref" data-type="hidden" data-mapping="ref"/>'+
    '</div>';

    var dialog = new DialogForm({
        writer: w,
        id: id,
        width: 850,
        height: 650,
        type: 'citation',
        title: 'Tag Citation',
        html: html
    });

    dialog.$el.on('beforeShow', function(e, config) {
        var cwrcInfo = dialog.currentData.cwrcInfo;
        if (cwrcInfo !== undefined) {
            $('#'+id+'_ref').val(cwrcInfo.id);
        }

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
            var schemaId = w.schemaManager.schemaId;
            var schema = w.schemaManager.schemas[schemaId];
            var schemaMappingsId = schema.schemaMappingsId;
            if (schemaMappingsId == 'tei') {
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
                    var noteUrl = w.cwrcRootUrl+'js/schema/tei/xml/citation_tei.xml';
                    cwrcWriter.fileManager.loadDocumentFromUrl(noteUrl);
                } else {
                    var xmlDoc = $.parseXML(config.entry.getCustomValue('content'));
                    if (xmlDoc.firstChild.nodeName === 'note') {
                        // remove the annotationId attribute
                        xmlDoc.firstChild.removeAttribute('annotationId');
                        // insert the appropriate wrapper tags
                        var xml = $.parseXML('<TEI><text><body/></text></TEI>');
                        xmlDoc = $(xml).find('body').append(xmlDoc.firstChild).end()[0];
                    }
                    cwrcWriter.fileManager.loadDocumentFromXml(xmlDoc);
                }
            } else {
                alert('Current schema not supported yet!');
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
