(function(tinymce) {
	
	tinymce.create('tinymce.plugins.SchemaTags', {
		init: function(ed, url) {
			var t = this;
			t.url = url;
			//TODO: this needs to be more configurable.
			t.imageUrl = ed.writer.cwrcRootUrl+'img/';
			t.editor = ed;
			t.currentKey = null;
			t.action = null;
			
			t.ADD = 0;
			t.EDIT = 1;
			t.mode = null;
			
			t.isDirty = false;
			
			t.schemaDialog = null;
			t.dialogOpenTimestamp = null; // tracks when the dialog was opened
			
			t.tag = null;
			
			t.editor.addCommand('createSchemaTagsControl', function(config) {
				var menu = config.menu;
				var mode = config.mode || 'add';
				var node;
				
				menu.beforeShowMenu.add(function(m) {
					var parentContainer = $(m.element.getParent());
					if (parentContainer.parent('.cwrc').length == 0) {
						parentContainer.wrap('<div class="cwrc" />');
					}
					
					var filterKey;
					// get the node from currentBookmark if available, otherwise use currentNode
					if (t.editor.currentBookmark != null) {
						node = t.editor.currentBookmark.rng.commonAncestorContainer;
						while (node.nodeType == 3 || (node.nodeType == 1 && !node.hasAttribute('_tag'))) {
							node = node.parentNode;
						}
					} else {
						node = t.editor.currentNode;
					}
					if (node.nodeType == 9) {
						node = $('body > [_tag]', node)[0]; // we're at the document level so select the root instead
					}
					
					filterKey = node.getAttribute('_tag');
					
					if (mode == 'change') {
						filterKey = $(node).parent().attr('_tag');
					}
					
					var validKeys = [];
					if (filterKey != t.editor.writer.header) {
						validKeys = t.editor.writer.utilities.getChildrenForTag({tag: filterKey, returnType: 'names'});
					}
					var item;
					var count = 0, disCount = 0;
					for (var itemId in m.items) {
						count++;
						item = m.items[itemId];
						if (validKeys.indexOf(item.settings.key) != -1) {
							item.settings.initialFilterState = false;
							item.setDisabled(false);
						} else {
							item.settings.initialFilterState = true;
							item.setDisabled(true);
							disCount++;
						}
					}
					if (count == disCount) {
						m.items['no_tags_'+m.id].setDisabled(false);
					}
				});
				
//				menu.onHideMenu.add(function(m) {
//				});
				
				t.buildMenu(menu, node, config);
				
				return menu;
			});
			
			t.editor.addCommand('addSchemaTag', function(params) {
				var key = params.key;
				var pos = params.pos;
				t.action = params.action;
				if (key == t.editor.writer.header) {
					t.editor.execCommand('addStructureTag', {bookmark: t.editor.currentBookmark, attributes: {_tag: key}, action: t.action});
					t.editor.writer.d.show('header');
					return;
				}
				
				var tagId = t.editor.currentBookmark.tagId;
				t.editor.selection.moveToBookmark(t.editor.currentBookmark);
				
				var valid = t.editor.execCommand('isSelectionValid', true, t.action);
				if (valid != 2) {
					t.editor.writer.dialogManager.show('message', {
						title: 'Error',
						msg: 'Please ensure that the beginning and end of your selection have a common parent.<br/>For example, your selection cannot begin in one paragraph and end in another, or begin in bolded text and end outside of that text.',
						type: 'error'
					});
					return;
				}
				
				// reset bookmark after possible modification by isSelectionValid
				t.editor.currentBookmark = t.editor.selection.getBookmark(1);
				if (tagId != null) {
					t.editor.currentBookmark.tagId = tagId;
				}
				
				// isSelectionValid should perform this function
//				var sel = t.editor.selection;
//				var content = sel.getContent();
//				var range = sel.getRng(true);
//				if (range.startContainer == range.endContainer) {
//					var leftTrimAmount = content.match(/^\s{0,1}/)[0].length;
//					var rightTrimAmount = content.match(/\s{0,1}$/)[0].length;
//					range.setStart(range.startContainer, range.startOffset+leftTrimAmount);
//					range.setEnd(range.endContainer, range.endOffset-rightTrimAmount);
//					sel.setRng(range);
//				}				
				
				t.mode = t.ADD;
				t.showDialog(key, pos);
			});
			
			t.editor.addCommand('editSchemaTag', function(tag, pos) {
				var key = tag.attr('_tag');
				if (key == t.editor.writer.header) {
					t.editor.writer.d.show('header');
					return;
				}
				t.currentKey = key;
				t.tag = tag;
				t.mode = t.EDIT;
				t.showDialog(key, pos);
			});
			
			t.editor.addCommand('changeSchemaTag', function(params) {
				t.currentKey = params.key;
				t.tag = params.tag;
				t.mode = t.EDIT;
				t.showDialog(params.key, params.pos);
			});
			
			$(document.body).append(''+
				'<div id="schemaDialog" class="attributeWidget">'+
					'<div class="attributeSelector"><h2>Attributes</h2><ul></ul></div>'+
					'<div class="attsContainer">'+
						'<div class="level1Atts"></div>'+
						'<div class="highLevelAtts"></div>'+
					'</div>'+
					'<input type="hidden" name="attsAllowed" value="" />'+
					'<div class="schemaHelp"></div>'+
				'</div>'
			);
			
			t.schemaDialog = $('#schemaDialog').dialog({
				modal: true,
				resizable: true,
				dialogClass: 'splitButtons',
				closeOnEscape: false,
				height: 460,
				width: 550,
				minWidth: 510,
				autoOpen: false,
				open: function(event, ui) {
					t.dialogOpenTimestamp = event.timeStamp;
					t.schemaDialog.parent().find('.ui-dialog-titlebar-close').hide();
				},
				beforeClose: function(event, ui) {
					if (event.timeStamp - t.dialogOpenTimestamp < 150) {
						// if the dialog was opened then closed immediately it was unintentional
						return false;
					}
				},
				buttons: [{
					text: 'Cancel',
					click: function() {
						t.cancel();
					}
				},{
					id: 'schemaOkButton',
					text: 'Ok',
					click: function() {
						t.result();
					}
				}]
			});
		},
		
		buildMenu: function(menu, node, config) {
			var t = this;
			var disabled = config.disabled;
			var pos = config.pos;
			var mode = config.mode;
			
			// remove old menu items
			for (var key in menu.items) {
				var item = menu.items[key];
				item.destroy();
				$('#'+item.id).remove();
				delete menu.items[key];
			}
			
			var schema = t.editor.execCommand('getSchema');
			for (var i = 0; i < schema.elements.length; i++) {
				var key = schema.elements[i];
				var menuitem = menu.add({
					title: key,
					key: key,
					initialFilterState: null,
					icon_src: t.imageUrl + 'tag_blue.png',
					onclick : function() {
						if (mode == 'change') {
							t.editor.execCommand('changeTag', {key: this.key, pos: pos, id: $(node).attr('id')});
						} else {
							t.editor.execCommand('addSchemaTag', {key: this.key, pos: pos});
						}
					}
				});
				menuitem.setDisabled(disabled);
			}
			var menuitem = menu.add({
				title: 'No tags available for current parent tag.',
				id: 'no_tags_'+menu.id,
				icon_src: t.imageUrl + 'cross.png',
				onclick : function() {}
			});
			menuitem.setDisabled(true);
		},
		
		showDialog: function(key, pos) {
			var t = this;
			var w = t.editor.writer;
			
			t.editor.getBody().blur(); // lose keyboard focus in editor
			
			var structsEntry = null;
			if (t.mode == t.EDIT) {
				structsEntry = w.structs[$(t.tag).attr('id')];
			}
			
			t.currentKey = key;
			
			t.isDirty = false;
			
			var parent = $('#schemaDialog');
			
			$('.attributeSelector ul, .level1Atts, .highLevelAtts, .schemaHelp', parent).empty();
			
			var helpText = this.editor.execCommand('getDocumentationForTag', key);
			if (helpText != '') {
				$('.schemaHelp', parent).html('<h3>'+key+' Documentation</h3><p>'+helpText+'</p>');
			}
			
			var atts = t.editor.writer.utilities.getChildrenForTag({tag: key, type: 'attribute', returnType: 'array'});
			
			var canTagContainAttributes = atts.length != 0;
			
			$('input[name="attsAllowed"]', parent).val(canTagContainAttributes);
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
					if (isLevel1 || (t.mode == t.EDIT && structsEntry[att.name])) {
						display = 'block';
						attributeSelector += '<li id="select_'+att.name+'" class="selected'+requiredClass+'">'+att.name+'</li>';
					} else {
						display = 'none';
						attributeSelector += '<li id="select_'+att.name+'">'+att.name+'</li>';
					}
					currAttString += '<div id="form_'+att.name+'" style="display:'+display+';"><label>'+att.name+'</label>';
					if (att.documentation != '') {
						currAttString += '<ins class="ui-icon ui-icon-help" title="'+att.documentation+'">&nbsp;</ins>';
					}
					currAttString += '<br/>';
					if (t.mode == t.EDIT) att.defaultValue = structsEntry[att.name] || '';
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
				
				var name = $(this).attr('id').split('select_')[1].replace(/:/g, '\\:');
				var div = $('#form_'+name);
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
				t.isDirty = true;
			}).keyup(function(event) {
				if (event.keyCode == '13') {
					event.preventDefault();
					if (t.isDirty) t.result();
					else t.cancel(); 
				}
			});
			
			$('select, option', parent).click(function(event) {
				t.isDirty = true;
			});
			
			t.schemaDialog.dialog('option', 'title', key);
			if (pos) {
				t.schemaDialog.dialog('option', 'position', [pos.x, pos.y]);
			} else {
				t.schemaDialog.dialog('option', 'position', 'center');
			}
			t.schemaDialog.dialog('open');
			
			$('#schemaOkButton').focus();
			$('input, select', parent).first().focus();
		},
		
		result: function() {
			var t = this;
			var parent = $('#schemaDialog');
			
			// collect values then close dialog
			var attributes = {};
			$('.attsContainer > div > div:visible', parent).children('input[type!="hidden"], select').each(function(index, el) {
				var val = $(this).val();
				if (val != '') { // ignore blank values
					attributes[$(this).attr('name')] = val;
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
			
			
			attributes._attsallowed = $('input[name="attsAllowed"]', parent).val() != 'false';
			attributes._tag = t.currentKey;
			
			t.schemaDialog.dialog('close');
			// check if beforeClose cancelled or not
			if (t.schemaDialog.is(':hidden')) {
				try {
					$('ins', parent).tooltip('destroy');
				} catch (e) {
					if (console) console.log('error destroying tooltip');
				}
				
				switch (t.mode) {
					case t.ADD:
						t.editor.execCommand('addStructureTag', {bookmark: t.editor.currentBookmark, attributes: attributes, action: t.action});
						break;
					case t.EDIT:
						t.editor.execCommand('editStructureTag', t.tag, attributes);
						t.tag = null;
				}
			}
		},
		
		cancel: function() {
			var t = this;
			t.schemaDialog.dialog('close');
			// check if beforeClose cancelled or not
			if (t.schemaDialog.is(':hidden')) {
				t.editor.selection.moveToBookmark(t.editor.currentBookmark);
				t.editor.currentBookmark = null;
				try {
					$('#schemaDialog ins').tooltip('destroy');
				} catch (e) {
					if (console) console.log('error destroying tooltip');
				}
			}
		},
		
		createControl: function(n, cm) {
			if (n == 'schematags') {
				var t = this;
				
				t.menuButton = cm.createMenuButton('schemaTagsButton', {
					title: 'Tags',
					image: t.imageUrl+'tag_text.png',
					'class': 'wideButton',
					menuType: 'filterMenu'
				}, tinymce.ui.ScrollingMenuButton);
				t.menuButton.beforeShowMenu.add(function(c) {
					t.editor.currentBookmark = t.editor.selection.getBookmark(1);
				});
				t.menuButton.onRenderMenu.add(function(c, m) {
					t.editor.execCommand('createSchemaTagsControl', {menu: m, disabled: false});
					// link menu to the button
					t.menuButton.menu = m;
				});
				
				// link schemaTags to the button
				t.menuButton.parentControl = t;
				
				// FIXME both the above links are made so that filemanager can remotely call buildMenu with the appropriate params
				
				return t.menuButton;
			}
	
			return null;
		}
	});
	
	tinymce.PluginManager.add('schematags', tinymce.plugins.SchemaTags);
})(tinymce);