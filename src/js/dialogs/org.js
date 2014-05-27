define([
    'jquery',
    'jquery-ui',
    'attributeWidget'
], function($, jqueryUi, AttributeWidget) {
	
return function(writer) {
	var w = writer;
	
	var attWidgetInit = false;
	
	var id = 'org';
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var currentId = null;
	var currentData = null;
	
	var processData = function() {
		currentData.certainty = $('#'+id+'_certainty input:checked').val();
		currentData.attributes = attributeWidget.getData();
		
		for (var key in currentData) {
			if (currentData[key] == undefined || currentData[key] == '') {
				delete currentData[key];
			}
		}
	};
	
	var onSaveClick = function() {
		processData();
		dialog.dialog('close');
		
		if (mode == EDIT && currentData != null) {
			w.tagger.editEntity(currentId, currentData);
		} else {
			w.tagger.finalizeEntity('org', currentData);
		}
		currentId = null;
		currentData = null;
	};
	
	var initAttributeWidget = function() {
		var orgAtts = w.utilities.getChildrenForTag({tag: 'orgName', type: 'attribute', returnType: 'array'});
		for (var i = 0; i < orgAtts.length; i++) {
			orgAtts[i].parent = 'orgName';
		}
		
		attributeWidget.buildWidget(orgAtts);
		attWidgetInit = true;
	};
	
	$(document.body).append(''+
	'<div id="'+id+'Dialog" class="annotationDialog">'+
		'<div id="'+id+'_tagAs">'+
			'<p>Tag as:</p>'+
			'<span class="tagAs"></span>'+
		'</div>'+
		'<div id="'+id+'_certainty">'+
	    	'<p>This identification is:</p>'+
			'<input type="radio" id="'+id+'_definite" name="'+id+'_id_certainty" value="definite" /><label for="'+id+'_definite">Definite</label>'+
			'<input type="radio" id="'+id+'_reasonable" name="'+id+'_id_certainty" value="reasonably certain" /><label for="'+id+'_reasonable">Reasonably Certain</label>'+
			'<input type="radio" id="'+id+'_probable" name="'+id+'_id_certainty" value="probable" /><label for="'+id+'_probable">Probable</label>'+
			'<input type="radio" id="'+id+'_speculative" name="'+id+'_id_certainty" value="speculative" /><label for="'+id+'_speculative">Speculative</label>'+
	    '</div>'+
	    '<div>'+
		    '<h3>Markup options</h3>'+
		    '<div id="'+id+'_teiParent" style="position: relative; height: 200px;">'+
		    '</div>'+
		'</div>'+
	'</div>'+
	'');
	
	$('#'+id+'_teiParent').parent().accordion({
		heightStyle: 'content',
		animate: false,
		collapsible: true,
		active: false
	});
	
	var dialog = $('#'+id+'Dialog');
	dialog.dialog({
		title: 'Tag Organization',
		modal: true,
		resizable: true,
		dialogClass: 'splitButtons',
		closeOnEscape: false,
		open: function(event, ui) {
			dialog.parent().find('.ui-dialog-titlebar-close').hide();
//			var doc = $(document);
//			dialog.dialog('option', 'width', doc.width() - 100);
//			dialog.dialog('option', 'height', doc.height() - 100);
//			dialog.dialog('option', 'position', { my: "center", at: "center", of: window });
		},
		height: 650,
		width: 400,
		autoOpen: false,
		buttons: [{
			text: 'Cancel',
			click: function() {
				currentData = null;
				currentId = null;
				dialog.dialog('close');
			}
		},{
			text: 'Save',
			id: id+'SaveButton',
			click: onSaveClick
		}]
	});
	
	$('#'+id+'_certainty').buttonset();
	
	var attributeWidget = new AttributeWidget({writer: w, parentId: id+'_teiParent'});
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			
			if (attWidgetInit == false) {
				initAttributeWidget();
			}
			
			// reset the form
			attributeWidget.reset();
			$('#'+id+'_certainty input:checked').prop('checked', false).button('refresh');
			$('#'+id+'_teiParent').parent().accordion('option', 'active', false);
			$('#'+id+'_tagAs span').empty();
			
			// TODO how to handle ADD/EDIT with cwrcInfo
			
			currentData = {};
			
			if (config.cwrcInfo != null) {
				$('#'+id+'_tagAs span').html(config.cwrcInfo.name);
				currentData.cwrcInfo = config.cwrcInfo;
			}
			
			if (mode == EDIT) {
				var data = config.entry.info;
				
				currentData.cwrcInfo = data.cwrcInfo;
				$('#'+id+'_tagAs span').html(data.cwrcInfo.name);
				
				currentId = config.entry.props.id;
				
				var showWidget = attributeWidget.setData(data.attributes);
				if (showWidget) {
					$('#'+id+'_teiParent').parent().accordion('option', 'active', 0);
				}
				
				$('#'+id+'_certainty input[value="'+data.certainty+'"]').prop('checked', true).button('refresh');
			}
			
			dialog.dialog('open');
		}
	};
};

});