var AttributeWidget = function(config) {
	var w = config.writer;
	var parentId = config.parentId;
	
	var ADD = 0;
	var EDIT = 1;
	var mode = ADD;
	
	var isDirty = false;
	
	var parent = $('#'+parentId);
	parent.addClass('attributeWidget');
	parent.append(''+
	'<div class="attributeSelector">'+
		'<h2>Attributes</h2>'+
		'<ul></ul>'+
	'</div>'+
	'<div class="attsContainer">'+
		'<div class="level1Atts"></div>'+
		'<div class="highLevelAtts"></div>'+
//		'<div class="schemaHelp"></div>'+
	'</div>');
	
	return {
		buildWidget: function(atts, previousVals) {
			previousVals = previousVals || {};
			
			$('.attributeSelector ul, .level1Atts, .highLevelAtts, .schemaHelp', parent).empty();
			isDirty = false;
			
//			var helpText = w.editor.execCommand('getDocumentationForTag', key);
//			if (helpText != '') {
//				$('.schemaHelp', parent).html('<h3>'+key+' Documentation</h3><p>'+helpText+'</p>');
//			}
			
			// build atts
			var level1Atts = '';
			var highLevelAtts = '';
			var attributeSelector = '';
			var att, currAttString;
			var isLevel1 = false;
			for (var i = 0; i < atts.length; i++) {
				att = atts[i];
				currAttString = '';
				if (att.level == 0 || att.required) {
					isLevel1 = true; // required attributes should be displayed by default
				} else {
					isLevel1 = false;
				}
				
				if (att.name.toLowerCase() != 'id' && att.name.toLowerCase() != 'xml:id') {
					var display = 'block';
					var requiredClass = att.required ? ' required' : '';
					if (isLevel1 || (mode == EDIT && previousVals[att.name])) {
						display = 'block';
						attributeSelector += '<li data-name="'+att.name+'" class="selected'+requiredClass+'">'+att.name+'</li>';
					} else {
						display = 'none';
						attributeSelector += '<li data-name="'+att.name+'">'+att.name+'</li>';
					}
					currAttString += '<div data-name="form_'+att.name+'" style="display:'+display+';"><label>'+att.name+'</label>';
					if (att.documentation != '') {
						currAttString += '<ins class="ui-icon ui-icon-help" title="'+att.documentation+'">&nbsp;</ins>';
					}
					currAttString += '<br/>';
					if (mode == EDIT) att.defaultValue = previousVals[att.name] || '';
					// TODO add list support
//					if ($('list', attDef).length > 0) {
//						currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
//					} else if ($('choice', attDef).length > 0) {
					if (att.choices) {
						currAttString += '<select name="'+att.name+'">';
						var attVal, selected;
						for (var j = 0; j < att.choices.length; j++) {
							attVal = att.choices[j];
							selected = att.defaultValue == attVal ? ' selected="selected"' : '';
							currAttString += '<option value="'+attVal+'"'+selected+'>'+attVal+'</option>';
						}
						currAttString += '</select>';
//					} else if ($('ref', attDef).length > 0) {
//						currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
					} else {
						currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
					}
					if (att.required) currAttString += ' <span class="required">*</span>';
					currAttString += '</div>';
					
					if (isLevel1) {
						level1Atts += currAttString;
					} else {
						highLevelAtts += currAttString;
					}
				}
			}
			
			$('.attributeSelector ul', parent).html(attributeSelector);
			$('.level1Atts', parent).html(level1Atts);
			$('.highLevelAtts', parent).html(highLevelAtts);
			
			$('.attributeSelector li', parent).click(function() {
				if ($(this).hasClass('required')) return;
				
				var name = $(this).data('name').replace(/:/g, '\\:');
				var div = $('[data-name="form_'+name+'"]', parent);
				$(this).toggleClass('selected');
				if ($(this).hasClass('selected')) {
					div.show();
				} else {
					div.hide();
				}
			});
			
			$('ins', parent).tooltip({
				tooltipClass: 'cwrc-tooltip'
			});
			
			$('input, select, option', parent).change(function(event) {
				isDirty = true;
			});
//			.keyup(function(event) {
//				if (event.keyCode == '13') {
//					event.preventDefault();
//					if (isDirty) t.result();
//					else t.cancel(); 
//				}
//			});
			
			$('select, option', parent).click(function(event) {
				isDirty = true;
			});
		}
	};
};