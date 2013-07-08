function StructureTree(config) {
	
	var w = config.writer;
	
	var tree = {
		currentlySelectedNode: null, // id of the currently selected node
		selectionType: null, // is the node or the just the contents of the node selected?
		NODE_SELECTED: 0,
		CONTENTS_SELECTED: 1
	};
	
	var ignoreSelect = false; // used when we want to highlight a node without selecting it's counterpart in the editor
	
	var $tree; // tree reference
	
	/**
	 * @memberOf tree
	 */
	tree.update = function() {
		var treeRef = $.jstree._reference('#tree');
		
		var openNodes = [];
		$('#tree #root').find('li.jstree-open').each(function () {
			var id = $(this).attr('name');
			openNodes.push(id);
		});
		
		$tree.jstree('delete_node', '#root');
		
		var root = {
			data: 'Tags',
			attr: {id: 'root'},
			state: 'open',
			children: []
		};
		_doUpdate($(w.editor.getBody()).children(), root, 0);
		
		var settings = treeRef._get_settings();
		settings.json_data.data = root;
		treeRef._set_settings(settings);
		treeRef.load_node_json(-1, false, false);
		treeRef._themeroller();
		_onNodeLoad($('#tree #root li').first());
		
		$.each(openNodes, function (i, val) {
			treeRef.open_node($('li[name='+val+']', $tree), false, true); 
		});
	};
	
	tree.selectNode = function(node) {
		var id = node.id;
		if (id) {
			ignoreSelect = true;
			var treeNode = $('#tree [name="'+id+'"]');
			if (treeNode.length == 0) {
				var parents = [];
				$(node).parentsUntil('#tinymce').each(function(index, el) {
					parents.push(el.id);
				});
				parents.reverse();
				for (var i = 0; i < parents.length; i++) {
					var parentId = parents[i];
					var parentNode = $('#tree [name="'+parentId+'"]');
					var isOpen = $tree.jstree('is_open', parentNode);
					if (!isOpen) {
						$tree.jstree('open_node', parentNode, false, true);
					}
				}
				treeNode = $('#tree [name="'+id+'"]');
			}
			var result = $tree.jstree('select_node', treeNode, true);
			if (result.attr('id') == 'tree') ignoreSelect = false;
		}
	};
	
	
	
	function _doUpdate(children, nodeParent, level) {
		children.each(function(index, el) {
			var node = $(this);
			var newNodeParent = nodeParent;
			if (node.attr('_tag')) {
				var id = node.attr('id');
				var tag = node.attr('_tag');

//				var isLeaf = node.find('[_tag]').length > 0 ? 'open' : null;
//				if (tag == w.header) isLeaf = false;
				
				// new struct check
				if (id == '' || id == null) {
					id = tinymce.DOM.uniqueId('struct_');
					if (w.schema.elements.indexOf(tag) != -1) {
						node.attr('id', id).attr('_tag', tag);
						w.structs[id] = {
							id: id,
							_tag: tag
						};
					}					
				// duplicate struct check
				} else {
					var match = $('[id='+id+']', w.editor.getBody());
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
				if (info == undefined) {
					// redo/undo re-added a struct check
					info = w.deletedStructs[id];
					if (info != undefined) {
						w.structs[id] = info;
						delete w.deletedStructs[id];
					}
				}
				if (info) {
					if (nodeParent.children == null) {
						nodeParent.children = [];
					}
					nodeParent.children.push({
						data: info._tag,
						attr: {name: id, 'class': node.attr('class')}
						,state: level < 2 ? 'open' : null
					});
					
					newNodeParent = nodeParent.children[nodeParent.children.length-1];
				}
			}
			if (node.attr('_tag') != w.header) {
				_doUpdate(node.children(), newNodeParent, level+1);
			}
		});
	}
	
	function _onNodeLoad(context) {
		$('li', context).each(function(index, el) {
			var li = $(this);
			var indent = (li.parents('ul').length - 2) * 16;
			li.prepend("<span class='jstree-indent' style='width: "+indent+"px;'/>");
		});
	}
	
	function _onNodeSelect(event, data) {
		if (!ignoreSelect) {
			var node = data.rslt.obj;
			var id = node.attr('name');
			var selectContents = node.children('a').hasClass('contentsSelected');
			_removeCustomClasses();
			if (id && w.structs[id]) {
				// already selected node, toggle selection type
				if (id == tree.currentlySelectedNode) {
					selectContents = !selectContents;
				}
				
				if (selectContents) {
					node.children('a').addClass('contentsSelected');
					node.children('a').removeClass('nodeSelected');
				} else {
					node.children('a').addClass('nodeSelected');
					node.children('a').removeClass('contentsSelected');
				}
				
				tree.currentlySelectedNode = id;
				tree.selectionType = selectContents ? tree.CONTENTS_SELECTED : tree.NODE_SELECTED;
				
				if (w.structs[id]._tag == w.header) {
					w.d.show('header');
				} else {
					w.selectStructureTag(id, selectContents);
				}
			}
		}
		
		ignoreSelect = false;
	}
	
	function _onNodeDeselect() {
		_removeCustomClasses();
		tree.currentlySelectedNode = null;
		tree.selectionType = null;
	}
	
	function _onDragDrop(event, data) {
		var params = data.rslt.obj;
		var dropNode = $('#'+params.dropNode.attr('name'), w.editor.getBody());
		var dragNode = $('#'+params.dragNode.attr('name'), w.editor.getBody());
		if (params.isCopy) {
			dragNode = dragNode.clone();
		}
		switch (params.dropType) {
			case 'before':
				dropNode.before(dragNode);
				break;
			case 'after':
				dropNode.after(dragNode);
				break;
			case 'inside':
				dropNode.append(dragNode);
		}
		tree.update();
		if (params.isCopy) {
			w.tagger.findDuplicateTags();
			w.entitiesList.update();
		}
	}
	
	function _removeCustomClasses() {
		var nodes = $('a[class*=Selected]', '#tree');
		nodes.removeClass('nodeSelected contentsSelected');
	}
	
	function _showPopup(content) {
		$('#tree_popup').html(content).show();
	}
	
	function _hidePopup() {
		$('#tree_popup').hide();
	}
	
	function _getSubmenu(tags, info) {
		var tagInfo = info;
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
					var offset = $('#vakata-contextmenu').offset();
					var pos = {
						x: offset.left,
						y: offset.top
					};
					if (actionType == 'change') {
						var id = $('#tree a.ui-state-active').closest('li').attr('name');
						w.editor.execCommand('changeTag', {key: key, pos: pos, id: id});
					} else {
						w.editor.currentBookmark = w.editor.selection.getBookmark(1);
						w.editor.currentBookmark.tagId = tagInfo.id;
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
	
	$(config.parentId).append('<div id="structure" class="tabWithLayout">'+
			'<div id="tree" class="ui-layout-center"></div>'+
			'<div id="structureTreeActions" class="ui-layout-south tabButtons">'+
			'<button>Edit Tag</button><button>Remove Tag</button><button>Remove Tag and All Content</button>'+
			'</div>'+
	'</div>');
//	$(document.body).append('<div id="tree_popup"></div>');
	
	$tree = $('#tree');
	
	$tree.bind('loaded.jstree', function(event, data) {
		tree.layout = $('#structure').layout({
			defaults: {
				resizable: false,
				slidable: false,
				closable: false
			},
			south: {
				size: 'auto',
				spacing_open: 0
			}
		});
	});
	
	$.vakata.dnd.helper_left = 15;
	$.vakata.dnd.helper_top = 20;
	
	$tree.jstree({
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
			},
			progressive_render: true
		},
		dnd: {
			drag_target: false
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
				
				var validKeys = w.u.getChildrenForTag({tag: info._tag, type: 'element', returnType: 'array'});
//				var parentKeys = w.u.getParentsForTag({tag: info._tag, returnType: 'array'});
				var siblingKeys = {};
				if (parentInfo) {
					siblingKeys = w.u.getChildrenForTag({tag: parentInfo._tag, type: 'element', returnType: 'array'});
				}
				
				var submenu = _getSubmenu(validKeys, info);
//				var parentSubmenu = _getSubmenu(parentKeys, info);
				var siblingSubmenu = _getSubmenu(siblingKeys, info);
				

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
//					'around': {
//						label: 'Insert Tag Around',
//						icon: 'img/tag_blue_add.png',
//						_class: 'submenu',
//						submenu: parentSubmenu
//					},
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
							var offset = $('#vakata-contextmenu').offset();
							var pos = {
								x: offset.left,
								y: offset.top
							};
							w.editor.execCommand('editTag', obj.attr('name'), pos);
						}
					}
//					'delete': {
//						label: 'Remove Tag Only',
//						icon: 'img/tag_blue_delete.png',
//						action: function(obj) {
//							w.tagger.removeStructureTag(obj.attr('name'));
//						}
//					},
//					'delete_all': {
//						label: 'Remove Tag and All Content',
//						icon: 'img/tag_blue_delete.png',
//						action: function(obj) {
//							w.tagger.removeStructureTag(obj.attr('name'), true);
//						}
//					}
				};

				return items;
			}
		},
		hotkeys: {
			del: function(e) {
				if (this.is_selected()) {
					var node = this.get_selected();
					var id = node.attr('name');
					if (id) {
						w.tagger.removeStructureTag(id);
					}
				}
			},
			f2: false
		},
		plugins: ['json_data', 'ui', 'contextmenu', 'hotkeys', 'dnd', 'themeroller']
	});
	$tree.bind('select_node.jstree', _onNodeSelect);
	$tree.bind('deselect_node.jstree', _onNodeDeselect);
	$tree.bind('dnd_finish.jstree', _onDragDrop);
	$tree.bind('load_node.jstree', function(event, data) {
		_onNodeLoad(data.rslt.obj);
	});
//	$tree.mousemove(function(e) {
//		$('#tree_popup').offset({left: e.pageX+15, top: e.pageY+5});
//	});
//	$tree.bind('hover_node.jstree', function(event, data) {
//		if ($('#vakata-contextmenu').css('visibility') == 'visible') return;
//		
//		var node = data.rslt.obj;
//		
//		if (node.attr('id') == 'root') return;
//		
//		var id = node.attr('name');
//		var info = w.structs[id];
//		var content = '<ul>';
//		for (var key in info) {
//			if (key.indexOf('_') != 0) {
//				content += '<li>'+key+': '+info[key]+'</li>';
//			}
//		}
//		content += '</ul>';
//		_showPopup(content);
//	});
//	$tree.bind('dehover_node.jstree', function(event, data) {
//		_hidePopup();
//	});
	
	$('#structureTreeActions button:eq(0)').button().click(function() {
		if (tree.currentlySelectedNode != null) {
			w.editor.execCommand('editTag', tree.currentlySelectedNode);
		} else {
			w.d.show('message', {
				title: 'No Tag Selected',
				msg: 'You must first select a tag to edit.',
				type: 'error'
			});
		}
	});
	$('#structureTreeActions button:eq(1)').button().click(function() {
		if (tree.currentlySelectedNode != null) {
			w.tagger.removeStructureTag(tree.currentlySelectedNode, false);
			tree.currentlySelectedNode = null;
			tree.selectionType = null;
		} else {
			w.d.show('message', {
				title: 'No Tag Selected',
				msg: 'You must first select a tag to remove.',
				type: 'error'
			});
		}
	});
	$('#structureTreeActions button:eq(2)').button().click(function() {
		if (tree.currentlySelectedNode != null) {
			w.tagger.removeStructureTag(tree.currentlySelectedNode, true);
			tree.currentlySelectedNode = null;
			tree.selectionType = null;
		} else {
			w.d.show('message', {
				title: 'No Tag Selected',
				msg: 'You must first select a tag to remove.',
				type: 'error'
			});
		}
	});
	
	return tree;
};