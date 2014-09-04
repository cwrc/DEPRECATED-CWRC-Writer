define(['jquery', 'jquery-ui', 'attributeWidget'], function($, jqueryUi, AttributeWidget) {
	
return function(writer) {
	var w = writer;
	
	var id = "title";

	var attWidgetInit = false;
	var attributeWidget;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var currentId = null;
	var currentData = null;
	
	$(document.body).append(''+
	'<div id="'+id+'Dialog" class="annotationDialog">'+
		'<div id="'+id+'_tagAs">'+
			'<p>Tag as:</p>'+
			'<span class="tagAs"></span>'+
		'</div>'+
		'<div id="'+id+'_level">'+
			'<p>This title is:</p>'+
			'<input type="radio" value="a" name="level" id="'+id+'_level_a"/>'+
			'<label for="'+id+'_level_a">Analytic <span>article, poem, or other item published as part of a larger item</span></label><br/>'+
			'<input type="radio" value="m" name="level" id="'+id+'_level_m" checked="checked"/>'+
			'<label for="'+id+'_level_m">Monographic <span>book, collection, single volume, or other item published as a distinct item</span></label><br/>'+
			'<input type="radio" value="j" name="level" id="'+id+'_level_j"/>'+
			'<label for="'+id+'_level_j">Journal <span>magazine, newspaper or other periodical publication</span></label><br/>'+
			'<input type="radio" value="s" name="level" id="'+id+'_level_s"/>'+
			'<label for="'+id+'_level_s">Series <span>book, radio, or other series</span></label><br/>'+
			'<input type="radio" value="u" name="level" id="'+id+'_level_u"/>'+
			'<label for="'+id+'_level_u">Unpublished <span>thesis, manuscript, letters or other unpublished material</span></label><br/>'+
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
	'</div>');
	
	var title = $('#'+id+'Dialog');
	title.dialog({
		title: 'Tag Title',
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#'+id+'Dialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 630,
		width: 435,
		autoOpen: false,
		buttons: {
			'Tag Text/Title': function() {
				titleResult();
			},
			'Cancel': function() {
				currentData = null;
				currentId = null;
				title.dialog('close');
			}
		}
	});
	
	$('#'+id+'_teiParent').parent().accordion({
		heightStyle: 'content',
		animate: false,
		collapsible: true,
		active: false
	});
	
	$('#'+id+'_certainty').buttonset();
	
	$('#titleDialog input').keyup(function(event) {
		if (event.keyCode == '13') {
			event.preventDefault();
			titleResult();
		}
	});
	
	var titleResult = function() {
		currentData.level = $('#'+id+'_level input[name="level"]:checked').val();
		currentData.certainty = $('#'+id+'_certainty input:checked').val();
		currentData.attributes = attributeWidget.getData();
		
		if (mode == EDIT && currentData != null) {
			w.tagger.editEntity(currentId, currentData);
		} else {
			w.tagger.finalizeEntity('title', currentData);
		}
		currentId = null;
		currentData = null;
		
		title.dialog('close');
	};
	
	var initAttributeWidget = function() {
		var titleAtts = w.utilities.getChildrenForTag({tag: 'title', type: 'attribute', returnType: 'array'});
		for (var i = 0; i < titleAtts.length; i++) {
			titleAtts[i].parent = 'title';
		}
		attributeWidget.buildWidget(titleAtts);
		attWidgetInit = true;
	};
	
	attributeWidget = new AttributeWidget({writer: w, parentId: id+'_teiParent'});
	
	return {
		show: function(config) {
			if (attWidgetInit == false) {
				initAttributeWidget();
			}
			
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Tag ';
			
			attributeWidget.reset();
			$('#'+id+'_tagAs span').empty();
			$('#'+id+'_certainty input:checked').prop('checked', false).button('refresh');
			$('#'+id+'_teiParent').parent().accordion('option', 'active', false);
			
			currentData = {};
			
			if (config.cwrcInfo != null) {
				$('#'+id+'_tagAs span').html(config.cwrcInfo.name);
				currentData.cwrcInfo = config.cwrcInfo;
			}
			
			if (mode == ADD) {
				$('input[value="m"]', title).prop('checked', true);
			} else {
				prefix = 'Edit ';
				
				var data = config.entry.info;
				currentData.cwrcInfo = data.cwrcInfo;
				currentId = config.entry.props.id;
				
				$('#'+id+'_tagAs span').html(data.cwrcInfo.name);
				$('#'+id+'_level input[value="'+data.level+'"]').prop('checked', true);
				$('#'+id+'_certainty input[value="'+data.certainty+'"]').prop('checked', true).button('refresh');
				
				var showWidget = attributeWidget.setData(data.attributes);
				if (showWidget) {
					$('#'+id+'_teiParent').parent().accordion('option', 'active', 0);
				}
			}
			
			var t = prefix+'Title';
			title.dialog('option', 'title', t);
			if (config.pos) {
				title.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				title.dialog('option', 'position', 'center');
			}
			title.dialog('open');
		},
		hide: function() {
			title.dialog('close');
		}
	};
};

});