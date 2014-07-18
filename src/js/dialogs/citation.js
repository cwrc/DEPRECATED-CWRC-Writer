define(['jquery', 'jquery-ui', 'tinymce'], function($, jqueryUi, tinymce) {
	
return function(writer) {
	var w = writer;
	
	var iframe = null;
	var cwrcWriter = null;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var currentData = null;
	var entityId = null;
	
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
				try {
					cwrcWriter.editor.remove();
					cwrcWriter.editor.destroy();
				} catch (e) {
					// editor wasn't fully initialized
				}
				currentData = null;
				entityId = null;
				citation.dialog('close');
			}
		}
	});
	
	function citationResult() {
		tinymce.DOM.counter = iframe.contentWindow.tinymce.DOM.counter + 1;
		
		var content = cwrcWriter.converter.getDocumentContent();
		currentData.content = content;
		
		if (mode == EDIT) {
			w.tagger.editEntity(entityId, currentData);
		} else {
			w.tagger.finalizeEntity('citation', currentData);
		}
		
		cwrcWriter.editor.remove();
		cwrcWriter.editor.destroy();
		currentData = null;
		entityId = null;
		citation.dialog('close');
	};
	
	return {
		show: function(config) {
			iframe = citation.find('iframe')[0];
			if (iframe.src == '') {
				iframe.src = 'citation.htm';
			}
			
			currentData = {};
			
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Add ';
			if (mode == EDIT) {
				prefix = 'Edit ';
				currentData = config.entry.info;
				entityId = config.entry.props.id;
			}
			
			// cwrcInfo means we're coming from the cwrcDialog
			if (config.cwrcInfo != null) {
				$('#citationDialog .tagAs').html(config.cwrcInfo.name);
				currentData.cwrcInfo = config.cwrcInfo;
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
				cwrcWriter = iframe.contentWindow.writer;
				if (cwrcWriter == null) {
					setTimeout(getCwrcWriter, 50);
				} else {
					cwrcWriter.event('writerInitialized').subscribe(postSetup);
				}
			}
			
			function postSetup() {
				if (w.schemaManager.schemaId == 'tei') {
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
					
					if (mode == ADD) {
						var citationUrl = w.cwrcRootUrl+'xml/citation_tei.xml';
						cwrcWriter.fileManager.loadDocumentFromUrl(citationUrl);
					} else {
						var data = config.entry.info;
						var xmlDoc = cwrcWriter.utilities.stringToXML(data.content);
						if (xmlDoc.firstChild.nodeName === 'bibl') {
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