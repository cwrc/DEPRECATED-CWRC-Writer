(function(tinymce) {
	
	tinymce.create('tinymce.plugins.SchemaTags', {
		init: function(ed, url) {
			var t = this;
			t.url = url;
			t.editor = ed;
			t.currentKey = null;
			t.action = null;
			
			t.ADD = 0;
			t.EDIT = 1;
			t.mode = null;
			
			t.isDirty = false;
			
			t.tag = null;
			
			t.editor.addCommand('createSchemaTagsControl', function(config) {
				var url = t.url+'/../../img/';
				var menu = config.menu;
				var mode = config.mode || 'add';
				var node;
				
				menu.beforeShowMenu.add(function(m) {
					var filterKey;
					// get the node from currentBookmark if available, otherwise use currentNode
					if (t.editor.currentBookmark != null) {
						node = t.editor.currentBookmark.rng.commonAncestorContainer;
						while (node.nodeType == 3) {
							node = node.parentNode;
						}
					} else {
						node = t.editor.currentNode;
					}
					filterKey = node.getAttribute('_tag');
					
					if (mode == 'change') {
						filterKey = $(node).parent().attr('_tag');
					}
					
					var validKeys = {};
					if (filterKey != t.editor.writer.header) {
						validKeys = t.editor.execCommand('getChildrenForTag', {tag: filterKey, returnType: 'object'});
					}
					var item;
					var count = 0, disCount = 0;
					for (var itemId in m.items) {
						count++;
						item = m.items[itemId];
						if (validKeys[item.settings.key]) {
							item.setDisabled(false);
						} else {
							item.setDisabled(true);
							disCount++;
						}
					}
					if (count == disCount) {
						m.items['no_tags_'+m.id].setDisabled(false);
					}
				});
				
				var schema = t.editor.execCommand('getSchema');
				for (var i = 0; i < schema.elements.length; i++) {
					var key = schema.elements[i];
					var menuitem = menu.add({
						title: key,
						key: key,
						icon_src: url + 'tag_blue.png',
						onclick : function() {
							if (mode == 'change') {
								t.editor.execCommand('changeTag', {key: this.key, pos: config.pos, id: $(node).attr('id')});
							} else {
								t.editor.execCommand('addSchemaTag', {key: this.key, pos: config.pos});
							}
						}
					});
					menuitem.setDisabled(config.disabled);
				}
				var menuitem = menu.add({
					title: 'No tags available for current parent tag.',
					id: 'no_tags_'+menu.id,
					icon_src: url + 'cross.png',
					onclick : function() {}
				});
				menuitem.setDisabled(true);
				
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
				
				t.editor.selection.moveToBookmark(t.editor.currentBookmark);
				
				var valid = t.editor.execCommand('isSelectionValid', true, t.action);
				if (valid != 2) {
					t.editor.execCommand('showError', valid);
					return;
				}
				
				var sel = t.editor.selection;
				var content = sel.getContent();
				var range = sel.getRng(true);
				if (range.startContainer == range.endContainer) {
					var leftTrimAmount = content.match(/^\s{0,1}/)[0].length;
					var rightTrimAmount = content.match(/\s{0,1}$/)[0].length;
					range.setStart(range.startContainer, range.startOffset+leftTrimAmount);
					range.setEnd(range.endContainer, range.endOffset-rightTrimAmount);
					sel.setRng(range);
				}				
				
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
				'<div id="schemaDialog"><div class="content"></div></div>'+
				'<div id="schemaHelpDialog"></div>'
			);
			
			$('#schemaDialog').dialog({
				modal: true,
				resizable: true,
				dialogClass: 'splitButtons',
				closeOnEscape: false,
				open: function(event, ui) {
					$('#schemaDialog').parent().find('.ui-dialog-titlebar-close').hide();
				},
				height: 460,
				width: 500,
				autoOpen: false,
				buttons: [
					{
						text: 'Help',
						'class': 'left',
						click: function() {
							t.showHelpDialog();
						}
					},{
						id: 'schemaOkButton',
						text: 'Ok',
						click: function() {
							t.result();
						}
					},{
						text: 'Cancel',
						click: function() {
							t.cancel();
						}
					}
				]
			});
			
			$('#schemaHelpDialog').dialog({
				modal: false,
				resizable: false,
				autoOpen: false,
				height: 300,
				width: 300
			});
		},
		showDialog: function(key, pos) {
			var t = this;
			var w = t.editor.writer;
			
			var structsEntry = null;
			if (t.mode == t.EDIT) {
				structsEntry = w.structs[$(t.tag).attr('id')];
			}
			
			t.currentKey = key;
			
			t.isDirty = false;
			
			$('#schemaDialog div.content').empty();
			
			var atts = t.editor.execCommand('getChildrenForTag', {tag: key, type: 'attribute', returnType: 'array'});
			
			// build atts
			var level1Atts = '<div id="level1Atts">';
			var highLevelAtts = '<div id="highLevelAtts">';
			var attributeSelector = '<div id="attributeSelector"><h2>Attributes</h2><ul>';
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
			
			level1Atts += '</div>';
			highLevelAtts += '</div>';
			attributeSelector += '</ul></div>';
			
			$('#schemaDialog div.content').append(attributeSelector + '<div id="attsContainer">'+level1Atts + highLevelAtts+'</div>');
			
			$('#attributeSelector li').click(function() {
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
			
			$('#schemaDialog ins').tooltip();
			
			$('#schemaDialog input, #schemaDialog select, #schemaDialog option').change(function(event) {
				t.isDirty = true;
			});
			$('#schemaDialog select, #schemaDialog option').click(function(event) {
				t.isDirty = true;
			});
			
			$('#schemaDialog input, #schemaDialog select, #schemaDialog option').keyup(function(event) {
				if (event.keyCode == '13') {
					event.preventDefault();
					if (t.isDirty) t.result();
					else t.cancel(); 
				}
			});
			
			$('#schemaDialog').dialog('option', 'title', key);
			if (pos) $('#schemaDialog').dialog('option', 'position', [pos.x, pos.y]);
			$('#schemaDialog').dialog('open');
			
			// focus on the ok button if there are no inputs
			$('#schemaOkButton').focus();
			$('#schemaDialog input, #schemaDialog select').first().focus();
		},
		showHelpDialog: function(key, helpText) {
			$('#schemaHelpDialog').empty();
			key = key || this.currentKey;
			if (!helpText) helpText = this.editor.execCommand('getDocumentationForTag', key);
			if (helpText != '') {
				$('#schemaHelpDialog').dialog('option', 'title', key+' Help');
				
				$('#schemaHelpDialog').append(helpText);
				
				var dialogOffset = $('#schemaDialog').offset();
				var x = dialogOffset.left + $('#schemaDialog').width() + 30;
				if (x > $(document).width()) {
					x = dialogOffset.left - 315;
				}
				var pos = [];
				pos[0] = x;
				pos[1] = dialogOffset.top - 31;
				$('#schemaHelpDialog').dialog('option', 'position', pos);
				$('#schemaHelpDialog').dialog('open');
			} else {
				$('#schemaHelpDialog').dialog('option', 'title', 'Help Error');
				$('#schemaHelpDialog').append('<p>There\'s no help available for '+key+'.</p>');
				$('#schemaHelpDialog').dialog('open');
			}
		},
		result: function() {
			var t = this;
			var attributes = {};
			$('#attsContainer > div > div:visible').children('input[type!="hidden"], select').each(function(index, el) {
				attributes[$(this).attr('name')] = $(this).val();
			});
			
			// validation
			var invalid = [];
			$('#attsContainer span.required').parent().children('label').each(function(index, el) {
				if (attributes[$(this).text()] == '') {
					invalid.push($(this).text());
				}
			});
			if (invalid.length > 0) {
				for (var i = 0; i < invalid.length; i++) {
					var name = invalid[i];
					$('#attsContainer *[name="'+name+'"]').css({borderColor: 'red'}).keyup(function(event) {
						$(this).css({borderColor: '#ccc'});
					});
				}
				return;
			}
			
			attributes._tag = t.currentKey;
			
			switch (t.mode) {
				case t.ADD:
					t.editor.execCommand('addStructureTag', {bookmark: t.editor.currentBookmark, attributes: attributes, action: t.action});
					break;
				case t.EDIT:
					t.editor.execCommand('editStructureTag', t.tag, attributes);
					t.tag = null;
			}
			
			$('#schemaDialog ins').tooltip('destroy');
			$('#schemaDialog').dialog('close');
		},
		cancel: function() {
			var t = this;
			t.editor.selection.moveToBookmark(t.editor.currentBookmark);
			t.editor.currentBookmark = null;
			$('#schemaDialog ins').tooltip('destroy');
			$('#schemaDialog').dialog('close');
			$('#schemaHelpDialog').dialog('close');
		},
		createControl: function(n, cm) {
			if (n == 'schematags') {
				var t = this;
				
				var url = t.url+'/../../img/';
				t.menuButton = cm.createMenuButton('schemaTagsButton', {
					title: 'Tags',
					image: url+'tag_text.png',
					'class': 'wideButton'
				}, tinymce.ui.ScrollingMenuButton);
				t.menuButton.beforeShowMenu.add(function(c) {
					t.editor.currentBookmark = t.editor.selection.getBookmark(1);
				});
				t.menuButton.onRenderMenu.add(function(c, m) {
					t.editor.execCommand('createSchemaTagsControl', {menu: m, disabled: false});
				});
				
				return t.menuButton;
			}
	
			return null;
		}
	});
	
	tinymce.PluginManager.add('schematags', tinymce.plugins.SchemaTags);
})(tinymce);