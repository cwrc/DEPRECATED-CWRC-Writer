define(['jquery', 'jquery-ui', 'tinymce'], function($, jqueryUi, tinymce) {
	
return function(writer) {
	var w = writer;
	
	var cwrcWriter = null;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var currentData = null;
	
	$(document.body).append(''+
	'<div id="citationDialog" class="annotationDialog">'+
		'<div style="position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;">'+
			'<p>Selected source:</p>'+
			'<span class="tagAs"></span>'+
			'<p style="margin-top: 20px;">Text of citation:</p>'+
		'</div>'+
		'<div style="position: absolute; top: 85px; left: 5px; right: 5px; bottom: 5px; border: 1px solid #ccc;">'+
			'<iframe style="width: 100%; height: 100%; border: none;"/>'+ // set src dynamically
		'</div>'+
	'</div>');
	
	var citation = $('#citationDialog');
	citation.dialog({
		modal: true,
		resizable: true,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#citationDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 650,
		width: 850,
		autoOpen: false,
		buttons: {
			'Tag Citation': function() {
				citationResult();
			},
			'Cancel': function() {
				cwrcWriter.editor.remove();
				cwrcWriter.editor.destroy();
				currentData = null;
				citation.dialog('close');
			}
		}
	});
	
	function citationResult() {
		var content = cwrcWriter.converter.getDocumentContent();
		currentData.content = content;
		
		if (mode == EDIT && currentData != null) {
			w.tagger.editEntity(w.editor.currentEntity, currentData);
		} else {
			w.tagger.finalizeEntity('citation', currentData);
		}
		
		cwrcWriter.editor.remove();
		cwrcWriter.editor.destroy();
		currentData = null;
		citation.dialog('close');
	};
	
	return {
		show: function(config) {
			var iframe = citation.find('iframe')[0];
			if (iframe.src == '') {
				iframe.src = 'citation.htm';
			}
			
			currentData = {};
			
			if (config.cwrcInfo != null) {
				$('#citationDialog .tagAs').html(config.cwrcInfo.name);
				currentData.cwrcInfo = config.cwrcInfo;
			}
			var content = config.query || '';
			
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Add ';
			if (mode == EDIT) {
				prefix = 'Edit ';
			}
			
			var title = prefix+'Citation';
			citation.dialog('option', 'title', title);
			citation.dialog('option', 'position', 'center');
			
			var width = $(document).width() * 0.85;
			var height = $(document).height() * 0.85;
			citation.dialog('option', 'width', width);
			citation.dialog('option', 'height', height);
			
			citation.dialog('open');
			
			// hack to get the writer
			function getCwrcWriter() {
				var iframe = citation.find('iframe')[0];
				cwrcWriter = iframe.contentWindow.writer;
				if (cwrcWriter == null) {
					setTimeout(getCwrcWriter, 50);
				} else {
					cwrcWriter.event('writerInitialized').subscribe(postSetup);
				}
			}
			
			function postSetup() {
				if (w.schemaManager.schemaId == 'tei') {
					cwrcWriter.event('documentLoaded').subscribe(function() {
						cwrcWriter.editor.focus();
						if (mode == ADD) {
							$('[_tag="bibl"]', cwrcWriter.editor.getBody()).html(content);
						}
					});
					
					// in case document is loaded before tree
					cwrcWriter.event('structureTreeInitialized').subscribe(function(tree) {
						setTimeout(tree.update, 50); // need slight delay to get indents working for some reason
					});
					cwrcWriter.event('entitiesListInitialized').subscribe(function(el) {
						setTimeout(el.update, 50);
					});
					
					if (mode == ADD) {
						var citationUrl = w.cwrcRootUrl+'xml/citation_tei.xml';
						cwrcWriter.fileManager.loadDocumentFromUrl(citationUrl);
					} else {
						var data = config.entry.info;
						var xmlDoc = cwrcWriter.utilities.stringToXML(data.content);
						cwrcWriter.fileManager.loadDocumentFromXml(xmlDoc);
					}
				} else {
					alert('Current schema not supported yet!');
				}
			}
			
			getCwrcWriter();
		},
		hide: function() {
			// TODO destroy the CWRC-Writer
			cwrcWriter.editor.remove();
			cwrcWriter.editor.destroy();
			
			citation.dialog('close');
			w.editor.focus();
		}
	};
};

});