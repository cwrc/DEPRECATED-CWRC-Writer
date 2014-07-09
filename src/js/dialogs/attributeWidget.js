define(['jquery'], function($) {

return function(config) {
	var w = config.writer;
	var parentId = config.parentId;
	
	var ADD = 0;
	var EDIT = 1;
	var mode = ADD;
	
	var disallowedAttributes = ['id', 'xml:id', 'annotationid', 'offsetid'];
	
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
				
				if (disallowedAttributes.indexOf(att.name.toLowerCase()) === -1) {
					var display = 'block';
					var requiredClass = att.required ? ' required' : '';
					if (isLevel1 || (mode == EDIT && previousVals[att.name])) {
						display = 'block';
						attributeSelector += '<li data-name="'+att.name+'" class="selected'+requiredClass+'">'+att.name+'</li>';
					} else {
						display = 'none';
						attributeSelector += '<li data-name="'+att.name+'">'+att.name+'</li>';
					}
					currAttString += '<div data-name="form_'+att.name+'" data-parent="'+att.parent+'" style="display:'+display+';"><label>'+att.name+'</label>';
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
		},
		reset: function() {
			$('.attributeSelector li', parent).each(function(el, index) {
				$(this).removeClass('selected');
				var name = $(this).data('name').replace(/:/g, '\\:');
				var div = $('[data-name="form_'+name+'"]', parent);
				div.hide();
			});
			$('.attsContainer input, .attsContainer select', parent).val('');
		},
		setData: function(data) {
			var wasDataSet = false;
			
			for (var key in data) {
				var entry = data[key];
				// assumes that each entry is a parent for the actual attribute values
				for (var subkey in entry) {
					wasDataSet = true;
					$('.attributeSelector li[data-name="'+subkey+'"]', parent).addClass('selected');
					var div = $('[data-name="form_'+subkey+'"]', parent);
					$('input, select', div).val(entry[subkey]);
					div.show();
				}
			}
			
			return wasDataSet;
		},
		getData: function() {
			// collect values then close dialog
			var attributes = {};
			$('.attsContainer > div > div:visible', parent).children('input[type!="hidden"], select').each(function(index, el) {
				var val = $(this).val();
				if (val != '') { // ignore blank values
					var parent = $(this).parent().data().parent;
					if (parent) {
						if (attributes[parent] == null) {
							attributes[parent] = {};
						}
						attributes[parent][$(this).attr('name')] = val;
					} else {
						attributes[$(this).attr('name')] = val;
					}
				}
			});
			
			// validation
			var invalid = [];
			$('.attsContainer span.required', parent).parent().children('label').each(function(index, el) {
				if (attributes[$(this).text()] == '') {
					invalid.push($(this).text());
				}
			});
			if (invalid.length > 0) {
				for (var i = 0; i < invalid.length; i++) {
					var name = invalid[i];
					$('.attsContainer *[name="'+name+'"]', parent).css({borderColor: 'red'}).keyup(function(event) {
						$(this).css({borderColor: '#ccc'});
					});
				}
				return;
			}
			
//			attributes._attsallowed = $('input[name="attsAllowed"]', parent).val() != 'false';
			
			return attributes;
		},
		destroy: function() {
			try {
				$('ins', parent).tooltip('destroy');
			} catch (e) {
				if (console) console.log('error destroying tooltip');
			}
		}
	};
};

});