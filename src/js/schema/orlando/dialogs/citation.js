var $ = require('jquery');
var tinymce = require('tinymce');
var DialogForm = require('../../../dialogs/dialogForm.js');

module.exports = function(id, writer) {
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
        var noteUrl = 'html/note.htm';
        if (w.isReadOnly) {
            noteUrl += '?readonly=true';
            dialog.$el.dialog('option', 'buttons', [{
                text: 'Close',
                click: function() {
                    dialog.$el.trigger('beforeCancel');
                    dialog.$el.trigger('beforeClose');
                    dialog.$el.dialog('close');
                }
            }]);
        }
        iframe.src = noteUrl;
        
        // hack to get the writer
        function getCwrcWriter() {
            cwrcWriter = iframe.contentWindow.writer;
            if (cwrcWriter == null) {
                setTimeout(getCwrcWriter, 50);
            } else {
                if (cwrcWriter.isInitialized) {
                    postSetup();
                } else {
                    cwrcWriter.event('writerInitialized').subscribe(postSetup);
                }
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
            
            var noteUrl = writer.cwrcRootUrl + writer.schemaManager.getCurrentSchema().entityTemplates.citation;
            if (dialog.mode === DialogForm.ADD) {
                cwrcWriter.fileManager.loadDocumentFromUrl(noteUrl);
            } else {
                $.ajax({
                    url: noteUrl,
                    type: 'GET',
                    dataType: 'xml',
                    success: function(doc, status, xhr) {
                        var parent = config.entry.getTag();
                        var noteDoc = $.parseXML(config.entry.getNoteContent());
                        var annotation = $(parent, noteDoc).first();
                        annotation.removeAttr('annotationId');
                        var xmlDoc = $(doc).find(parent).replaceWith(annotation).end()[0];
                        cwrcWriter.fileManager.loadDocumentFromXml(xmlDoc);
                    }
                });
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
        dialog.currentData.noteContent = content;
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};
