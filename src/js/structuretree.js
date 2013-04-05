function StructureTree(config) {
	
	var w = config.writer;
	
	var tree = {};
	
	var ignoreSelect = false; // used when we want to highlight a node without selecting it's counterpart in the editor

	$(config.parentId).append('<div id="structure"><div id="tree"></div></div>');
	$(document.body).append('<div id="tree_popup"></div>');
	
	$('#tree').jstree({
		core: {},
		themeroller: {},
		ui: {
			select_limit: 1
		},
		json_data: {
			data: {
				data: 'Tags',
				attr: {id: 'root'},
				state: 'open'
			}
		},
		contextmenu: {
			select_node: true,
			show_at_node: false,
			items: function(node) {
				_hidePopup();
				if (node.attr('id') == 'root') return {};
				
				var parentNode = node.parents('li:first');
				
				var info = w.structs[node.attr('name')];

				if (info._tag == w.root || info._tag == w.header) return {};
				
				var parentInfo = w.structs[parentNode.attr('name')];
				
				var validKeys = w.editor.execCommand('getChildrenForTag', {tag: info._tag, type: 'element', returnType: 'array'});
				var parentKeys = w.editor.execCommand('getParentsForTag', {tag: info._tag, returnType: 'array'});
				var siblingKeys = {};
				if (parentInfo) {
					siblingKeys = w.editor.execCommand('getChildrenForTag', {tag: parentInfo._tag, type: 'element', returnType: 'array'});
				}
				
				function getSubmenu(tags) {
					var inserts = {};
					var inserted = false;
					var i, tag, key;
					for (i = 0; i < tags.length; i++) {
						tag = tags[i];
						key = tag.name;
						inserted = true;
						var doc = tag.documentation;
						if (doc == '') {
							doc = key;
						}
						inserts[key] = {
							label: '<span title="'+doc+'">'+key+'</span>',
							icon: 'img/tag_blue.png',
							action: function(obj) {
								var actionType = obj.parents('li.submenu').children('a').attr('rel');
								var key = obj.text();
								var pos = {
									x: parseInt($('#tree_popup').css('left')),
									y: parseInt($('#tree_popup').css('top'))
								};
								if (actionType == 'change') {
									var id = $('#tree a.ui-state-active').closest('li').attr('name');
									w.editor.execCommand('changeTag', {key: key, pos: pos, id: id});
								} else {
									w.editor.currentBookmark = w.editor.selection.getBookmark(1);
									w.editor.execCommand('addSchemaTag', {key: key, pos: pos, action: actionType});
								}
							}
						};
					}
					if (!inserted) {
						inserts['no_tags'] = {
							label: 'No tags available.',
							icon: 'img/cross.png',
							action: function(obj) {}
						};
					}
					return inserts;
				}
				
				var submenu = getSubmenu(validKeys);
				var parentSubmenu = getSubmenu(parentKeys);
				var siblingSubmenu = getSubmenu(siblingKeys);
				

				var items = {
					'before': {
						label: 'Insert Tag Before',
						icon: 'img/tag_blue_add.png',
						_class: 'submenu',
						submenu: siblingSubmenu
					},
					'after': {
						label: 'Insert Tag After',
						icon: 'img/tag_blue_add.png',
						_class: 'submenu',
						submenu: siblingSubmenu
					},
					'around': {
						label: 'Insert Tag Around',
						icon: 'img/tag_blue_add.png',
						_class: 'submenu',
						submenu: parentSubmenu
					},
					'inside': {
						label: 'Insert Tag Inside',
						icon: 'img/tag_blue_add.png',
						_class: 'submenu',
						separator_after: true,
						submenu: submenu
					},
					'change': {
						label: 'Change Tag',
						icon: 'img/tag_blue_edit.png',
						_class: 'submenu',
						submenu: siblingSubmenu
					},
					'edit': {
						label: 'Edit Tag',
						icon: 'img/tag_blue_edit.png',
						action: function(obj) {
							var pos = {
								x: parseInt($('#tree_popup').css('left')),
								y: parseInt($('#tree_popup').css('top'))
							};
							w.editor.execCommand('editTag', obj.attr('name'), pos);
						}
					},
					'delete': {
						label: 'Remove Tag Only',
						icon: 'img/tag_blue_delete.png',
						action: function(obj) {
							w.removeStructureTag(obj.attr('name'));
						}
					},
					'delete_all': {
						label: 'Remove Tag and All Content',
						icon: 'img/tag_blue_delete.png',
						action: function(obj) {
							w.removeStructureTag(obj.attr('name'), true);
						}
					}
				};
				if (info._tag == w.root) {
					delete items['delete'];
					delete items['before'];
					delete items['after'];
					delete items['around'];
				}
				return items;
			}
		},
		hotkeys: {
			del: function(e) {
				if (this.is_selected()) {
					var node = this.get_selected();
					var id = node.attr('name');
					if (id) {
						w.removeStructureTag(id);
					}
				}
			},
			f2: false
		},
		plugins: ['json_data', 'ui', 'themeroller', 'contextmenu', 'hotkeys']
	});
	$('#tree').mousemove(function(e) {
		$('#tree_popup').offset({left: e.pageX+15, top: e.pageY+5});
	});
	$('#tree').bind('select_node.jstree', function(event, data) {
		if (!ignoreSelect) {
			var node = data.rslt.obj;
			var id = node.attr('name');
			if (id) {
				if (w.structs[id]._tag == w.header) {
					w.d.show('header');
				} else {
					w.selectStructureTag(id);
				}
			}
		}
		ignoreSelect = false;
	});
	$('#tree').bind('hover_node.jstree', function(event, data) {
		if ($('#vakata-contextmenu').css('visibility') == 'visible') return;
		
		var node = data.rslt.obj;
		
		if (node.attr('id') == 'root') return;
		
		var id = node.attr('name');
		var info = w.structs[id];
		var content = '<ul>';
		for (var key in info) {
			if (key.indexOf('_') != 0) {
				content += '<li>'+key+': '+info[key]+'</li>';
			}
		}
		content += '</ul>';
		_showPopup(content);
	});
	$('#tree').bind('dehover_node.jstree', function(event, data) {
		_hidePopup();
	});

	/**
	 * @memberOf tree
	 */
	tree.update = function() {
		var body = w.editor.dom.select('body');
	//	$('#tree').jstree('_get_children').each(function(index, element) {
	//		$('#tree').jstree('delete_node', $(this));
	//	});
		$('#tree').jstree('delete_node', '#root');
		var root = $('#tree').jstree('create_node', $('#tree'), 'first', {
			data: 'Tags',
			attr: {id: 'root'},
			state: 'open'
		});
		_doUpdate($(body).children(), root);
	};

	var _doUpdate = function(children, nodeParent) {
		children.each(function(index, el) {
			var newChildren = $(this).children();
			var newNodeParent = nodeParent;
			if ($(this).attr('_tag') || $(this).is(w.root)) {
				var id = $(this).attr('id');
				var isLeaf = $(this).find('[_tag]').length > 0 ? 'open' : null;
				if ($(this).attr('_tag') == w.header) isLeaf = false;
				
				// new struct check
				if (id == '' || id == null) {
					id = tinymce.DOM.uniqueId('struct_');
					var tag = $(this).attr('_tag');
					if (tag == null && $(this).is(w.root)) tag = w.root;
					if (w.schema.elements.indexOf(tag) != -1) {
						$(this).attr('id', id).attr('_tag', tag);
						w.structs[id] = {
							id: id,
							_tag: tag
						};
					}
				// redo/undo re-added a struct check
				} else if (w.structs[id] == null) {
					var deleted = w.deletedStructs[id];
					if (deleted != null) {
						w.structs[id] = deleted;
						delete w.deletedStructs[id];
					}
				// duplicate struct check
				} else {
					var match = w.editor.$('[id='+id+']');
					if (match.length > 1) {
						match.each(function(index, el) {
							if (index > 0) {
								var newStruct = $(el);
								var newId = tinymce.DOM.uniqueId('struct_');
								newStruct.attr('id', newId);
								w.structs[newId] = {};
								for (var key in w.structs[id]) {
									w.structs[newId][key] = w.structs[id][key];
								}
								w.structs[newId].id = newId;
							}
						});
					}
				}
				
				var info = w.structs[id];
				if (info) {
					var title = info._tag;
					newNodeParent = $('#tree').jstree('create_node', nodeParent, 'last', {
						data: title,
						attr: {name: id, 'class': $(this).attr('class')},
						state: isLeaf
					});
				}
			}
			if ($(this).attr('_tag') != w.header) {
				_doUpdate(newChildren, newNodeParent);
			}
		});
	};
	
	tree.selectNode = function(id) {
		if (id) {
			ignoreSelect = true;
			var result = $('#tree').jstree('select_node', $('#tree [name="'+id+'"]'), true);
			if (result.attr('id') == 'tree') ignoreSelect = false;
		}
	};
	
	var _showPopup = function(content) {
		$('#tree_popup').html(content).show();
	};
	
	var _hidePopup = function() {
		$('#tree_popup').hide();
	};
	
	return tree;
};