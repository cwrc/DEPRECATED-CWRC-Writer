function Writer(config) {
	config = config || {};
	
	var w = this;
	
	w.layout = null; // jquery ui layout object
	w.editor = null; // reference to the tinyMCE instance we're creating, set in setup
	w.entities = {}; // entities store
	w.structs = {}; // structs store
	w.triples = []; // triples store
	// store deleted tags in case of undo
	// TODO add garbage collection for this
	w.deletedEntities = {};
	w.deletedStructs = {};

	w.schemaXML = null; // a cached copy of the loaded schema
	w.schema = {elements: []}; // stores a list of all the elements of the loaded schema
	
	w.project = config.project; // the current project (cwrc or russell)
	
	w.baseUrl = window.location.protocol+'//'+window.location.host+'/';
	
	// editor mode
	w.mode = config.mode;
	
	// schema for validation (http://www.arts.ualberta.ca/~cwrc/schema/)
	w.validationSchema = 'cwrcbasic';
	
	// root block element, should come from schema
	w.root = '';
	// header element: hidden in editor view, can only edit from structure tree
	w.header = '';
	// id attribute name, based on schema
	w.idName = '';
	
	// possible editor modes
	w.XMLRDF = 0; // allows for overlapping elements, i.e. entities
	w.XML = 1; // standard xml, no overlapping elements
	
	// possible results when trying to add entity
	w.NO_SELECTION = 0;
	w.NO_COMMON_PARENT = 1;
	w.VALID = 2;
	
	w.fixEmptyTag = false; // whether to check for and remove a node inserted on empty struct add/select
	w.emptyTagId = null; // stores the id of the entities tag to be added
	
	w.u = null; // utilities
	w.fm = null; // filemanager
	w.entitiesList = null; // entities list
	w.tree = null; // structure tree
	w.relations = null; // relations list
	w.d = null; // dialog
	w.settings = null; // settings dialog
	w.delegator = null;
	
	var _findNewAndDeletedTags = function() {
		var updateRequired = false;
		
		// new tags
		var newTags = w.editor.dom.select('span[_tag]:not([id])');
		if (newTags.length > 0) updateRequired = true;
		
		// deleted tags
		for (var id in w.entities) {
			var nodes = w.editor.dom.select('span[name="'+id+'"]');
			switch (nodes.length) {
				case 0:
					updateRequired = true;
					w.entitiesList.remove(id);
					w.deletedEntities[id] = w.entities[id];
					delete w.entities[id];
					break;
				case 1:
					updateRequired = true;
					w.editor.dom.remove(nodes[0]);
					w.entitiesList.remove(id);
					w.deletedEntities[id] = w.entities[id];
					delete w.entities[id];
			}
		}
		for (var id in w.structs) {
			var nodes = w.editor.dom.select('#'+id);
			if (nodes.length == 0) {
				updateRequired = true;
				w.deletedStructs[id] = w.structs[id];
				delete w.structs[id];
			}
		}
		return updateRequired;
	};
	
	var _findDuplicateTags = function() {
		for (id in w.entities) {
			var match = $('span[class~="start"][name="'+id+'"]', w.editor.getBody());
			if (match.length > 1) {
				match.each(function(index, el) {
					if (index > 0) {
						var newId = tinymce.DOM.uniqueId('ent_');
						var newTagStart = $(el);
						var newTagEnd = $(w.getCorrespondingEntityTag(newTagStart));
						newTagStart.attr('name', newId);
						newTagEnd.attr('name', newId);

						var newEntity = jQuery.extend(true, {}, w.entities[id]);
						newEntity.props.id = newId;
						w.entities[newId] = newEntity;
					}
				});
			}
		}
		for (var id in w.structs) {
			var match = $('*[id='+id+']', w.editor.getBody());
			if (match.length == 2) {
				var newStruct = match.last();
				var newId = tinymce.DOM.uniqueId('struct_');
				newStruct.attr('id', newId);
				w.structs[newId] = {};
				for (var key in w.structs[id]) {
					w.structs[newId][key] = w.structs[id][key];
				}
				w.structs[newId].id = newId;
			}
		}
	};
	
	var _onKeyDownHandler = function(ed, evt) {
		// redo/undo listener
		if ((evt.which == 89 || evt.which == 90) && evt.ctrlKey) {
			var doUpdate = _findNewAndDeletedTags();
			if (doUpdate) {
				w.entitiesList.update();
				w.tree.update();
			}
		}
	};
	
	var _onKeyUpHandler = function(ed, evt) {	
		// nav keys check
		if (evt.which >= 33 || evt.which <= 40) {
			_doHighlightCheck(ed, evt);
		}
		
		// update current entity
		if (ed.currentEntity) {
			var content = $('#entityHighlight', ed.getBody()).text();
			var entity = w.entities[ed.currentEntity];
			entity.content = content;
			entity.title = w.u.getTitleFromContent(content);
			$('#entities li[name="'+ed.currentEntity+'"] > span[class="entityTitle"]').html(entity.title);
		}
		
		if (w.fixEmptyTag) {
			w.fixEmptyTag = false;
			$('[class="empty_tag_remove_me"]', ed.getBody()).remove();
		}
		
		if (w.emptyTagId) {
			// alphanumeric keys
			if (evt.which >= 48 || evt.which <= 90) {
				var range = ed.selection.getRng(true);
				range.setStart(range.commonAncestorContainer, range.startOffset-1);
				range.setEnd(range.commonAncestorContainer, range.startOffset+1);
				w.insertBoundaryTags(w.emptyTagId, w.entities[w.emptyTagId].props.type, range);
				
				// TODO get working in IE
				var tags = $('[name='+w.emptyTagId+']', ed.getBody());
				range = ed.selection.getRng(true);
				range.setStartAfter(tags[0]);
				range.setEndBefore(tags[1]);
				range.collapse(false);
				
				w.entitiesList.update();
			} else {
				delete w.entities[w.emptyTagId];
			}
			w.emptyTagId = null;
		}
		
		if (ed.currentNode) {
			// check if text is allowed in this node
			if (ed.currentNode.getAttribute('_textallowed') == 'false') {
				w.d.show('message', {
					title: 'No Text Allowed',
					msg: 'Text is not allowed in the current tag: '+ed.currentNode.getAttribute('_tag')+'.',
					type: 'error'
				});
				
				// remove all text
				$(ed.currentNode).contents().filter(function() {
					return this.nodeType == 3;
				}).remove();
			}
			
			// replace br's inserted on shift+enter
			if (evt.shiftKey && evt.which == 13) {
				var node = ed.currentNode;
				if ($(node).attr('_tag') == 'lb') node = node.parentNode;
				$(node).find('br').replaceWith('<span _tag="lb"></span>');
			}
		}
		
		// delete keys check
		// need to do this here instead of in onchangehandler because that one doesn't update often enough
		if (evt.which == 8 || evt.which == 46) {
			var doUpdate = _findNewAndDeletedTags();
			if (doUpdate) w.tree.update();
		}
	};
	
	var _onChangeHandler = function(ed, event) {
		if (ed.isDirty()) {
			$('br', ed.getBody()).remove();
			var doUpdate = _findNewAndDeletedTags();
			if (doUpdate) w.tree.update();
		}
	};
	
	var _onNodeChangeHandler = function(ed, cm, e) {
		if (e.nodeType != 1) {
			ed.currentNode = ed.dom.select(w.root)[0];
		} else {
			if (e.getAttribute('_tag') == null && e.nodeName != w.root) {
				e = e.parentNode;
				_onNodeChangeHandler(ed, cm, e);
			} else {
				ed.currentNode = e;
			}
		}
		if (ed.currentNode) {
			w.tree.selectNode(ed.currentNode.id);
		}
		if (w.emptyTagId) {
			delete w.entities[w.emptyTagId];
			w.emptyTagId = null;
		}
	};
	
	var _onCopyHandler = function(ed, event) {
		if (ed.copiedElement != null) {
			$(ed.copiedElement).remove();
		}
		if (ed.currentStruct != null) {
			ed.copiedElement = $('#'+ed.currentStruct, ed.getBody()).clone()[0];
		} else {
			ed.copiedElement = null;
		}
	};
	
	var _onPasteHandler = function(ed, event) {
		window.setTimeout(function() {
			_findDuplicateTags();
			w.entitiesList.update();
			w.tree.update();
		}, 0);
	};
	
	var _hideContextMenus = function(evt) {
		var target = $(evt.target);
		// hide structure tree menu
		if ($.vakata.context.vis && target.parents('#vakata-contextmenu').length == 0) {
			$.vakata.context.hide();
		}
		// hide editor menu
		if ($('#menu_editor_contextmenu:visible').length > 0 && target.parents('#menu_editor_contextmenu').length == 0) {
			w.editor.execCommand('hideContextMenu', w.editor, evt);
		}
	};
	
	var _doHighlightCheck = function(ed, evt) {
		var range = ed.selection.getRng(true);
		
		var entityStart = _findEntityBoundary('start', range.startContainer);
		var entityEnd = _findEntityBoundary('end', range.endContainer);
		
		if (entityEnd == null || entityStart == null) {
			w.highlightEntity();
			var parentNode = $(ed.selection.getNode());
			if (parentNode.attr('_tag')) {
				var id = parentNode.attr('id');
				w.editor.currentStruct = id;
			}
			return;
		}
		
		var id = entityStart.getAttribute('name');
		if (id == ed.currentEntity) return;
		
		w.highlightEntity(id, ed.selection.getBookmark());
	};
	
	/**
	 * Get the entity boundary tag that corresponds to the passed tag.
	 * @memberOf Writer
	 * @param tag
	 */
	w.getCorrespondingEntityTag = function(tag) {
		tag = $(tag);
		var corrTag;
		if (tag.hasClass('start')) {
			corrTag = _findEntityBoundary('end', tag[0].nextSibling);
		} else {
			corrTag = _findEntityBoundary('start', tag[0].previousSibling);
		}
		return corrTag;
	};
	
	/**
	 * Searches for an entity boundary containing the current node.
	 * @param boundaryType Either 'start' or 'end'.
	 * @param currentNode The node that is currently being examined.
	 */
	var _findEntityBoundary = function(boundaryType, currentNode) {
		
		/**
		 * @param entIds An array of entity ids that are encountered.  Used to prevent false positives.
		 * @param levels An array to track the levels of node depth in order to prevent endless recursion.
		 * @param structIds An object to track the node ids that we've already encountered.
		 */
		function doFind(boundaryType, currentNode, entIds, levels, structIds) {
			if (currentNode.id) {
				if (structIds[currentNode.id]) {
					return null;
				} else {
					structIds[currentNode.id] = true;
				}
			}
			
			if (w.editor.dom.hasClass(currentNode, 'entity')) {
				var nodeId = currentNode.getAttribute('name');
				if (w.editor.dom.hasClass(currentNode, boundaryType)) {
					if (entIds.indexOf(nodeId) == -1) {
						return currentNode;
					} else if (entIds[0] == nodeId) {
						entIds.shift();
					}
				} else {
					entIds.push(nodeId);
				}
			}
			
			if (boundaryType == 'start' && currentNode.lastChild) {
				levels.push(currentNode);
				return doFind(boundaryType, currentNode.lastChild, entIds, levels, structIds);
			} else if (boundaryType == 'end' && currentNode.firstChild) {
				levels.push(currentNode);
				return doFind(boundaryType, currentNode.firstChild, entIds, levels, structIds);
			}
			
			if (boundaryType == 'start' && currentNode.previousSibling) {
				return doFind(boundaryType, currentNode.previousSibling, entIds, levels, structIds);
			} else if (boundaryType == 'end' && currentNode.nextSibling) {
				return doFind(boundaryType, currentNode.nextSibling, entIds, levels, structIds);
			}
			
			if (currentNode.parentNode) {
				if (currentNode.parentNode == levels[levels.length-1]) {
					levels.pop();
					if (boundaryType == 'start' && currentNode.parentNode.previousSibling) {
						return doFind(boundaryType, currentNode.parentNode.previousSibling, entIds, levels, structIds);
					} else if (boundaryType == 'end' && currentNode.parentNode.nextSibling) {
						return doFind(boundaryType, currentNode.parentNode.nextSibling, entIds, levels, structIds);
					} else return null;
				} else {
					return doFind(boundaryType, currentNode.parentNode, entIds, levels, structIds);
				}
			}
			
			return null;
		};
		
		var match = doFind(boundaryType, currentNode, [], [currentNode.parentNode], {});
		return match;
	};
	
	w.highlightEntity = function(id, bm, doScroll) {
		w.editor.currentEntity = null;
		
		var prevHighlight = $('#entityHighlight', w.editor.getBody());
		if (prevHighlight.length == 1) {
			var parent = prevHighlight.parent()[0];
			prevHighlight.contents().unwrap();
			parent.normalize();
			
			$('#entities > ul > li').each(function(index, el) {
				$(this).removeClass('selected').css('background-color', '').find('div[class="info"]').hide();
			});
		}
		
		if (id) {
			w.editor.currentEntity = id;
			var type = w.entities[id].props.type;
			var markers = w.editor.dom.select('span[name="'+id+'"]');
			var start = markers[0];
			var end = markers[1];
			
			var nodes = [start];
			var currentNode = start;
			while (currentNode != end  && currentNode != null) {
				currentNode = currentNode.nextSibling;
				nodes.push(currentNode);
			}
			
			$(nodes).wrapAll('<span id="entityHighlight" class="'+type+'"/>');
			
			// maintain the original caret position
			if (bm) {
				w.editor.selection.moveToBookmark(bm);
			}
			
			if (doScroll) {
				var val = $(start).offset().top;
				$(w.editor.dom.doc.body).scrollTop(val);
			}
			
			$('#entities > ul > li[name="'+id+'"]').addClass('selected').find('div[class="info"]').show();
		}
	};
	
	w.showError = function(errorType) {
		switch(errorType) {
		case w.NO_SELECTION:
			w.d.show('message', {
				title: 'Error',
				msg: 'Please select some text before adding an entity or tag.',
				type: 'error'
			});
			break;
		case w.NO_COMMON_PARENT:
			w.d.show('message', {
				title: 'Error',
				msg: 'Please ensure that the beginning and end of your selection have a common parent.<br/>For example, your selection cannot begin in one paragraph and end in another, or begin in bolded text and end outside of that text.',
				type: 'error'
			});
		}
	};
	
	w.addEntity = function(type) {
		var result = w.u.isSelectionValid();
		if (result == w.VALID) {
			w.editor.currentBookmark = w.editor.selection.getBookmark(1);
			w.d.show(type, {type: type, title: w.em.getTitle(type), pos: w.editor.contextMenuPos});
		} else {
			w.showError(result);
		}
	};
	
	var _addEntityTag = function(type) {
		var sel = w.editor.selection;
		var content = sel.getContent();
		var range = sel.getRng(true);
		
		// strip tags
		content = content.replace(/<\/?[^>]+>/gi, '');
		
		// trim whitespace
		if (range.startContainer == range.endContainer) {
			var leftTrimAmount = content.match(/^\s{0,1}/)[0].length;
			var rightTrimAmount = content.match(/\s{0,1}$/)[0].length;
			range.setStart(range.startContainer, range.startOffset+leftTrimAmount);
			range.setEnd(range.endContainer, range.endOffset-rightTrimAmount);
			sel.setRng(range);
			content = content.replace(/^\s+|\s+$/g, '');
		}
		
		var title = w.u.getTitleFromContent(content);
		
		var id = tinymce.DOM.uniqueId('ent_');
		w.editor.currentEntity = id;
		
		w.entities[id] = {
			props: {
				id: id,
				type: type,
				title: title,
				content: content
			},
			info: {}
		};
		
		if (content != '') {
			w.insertBoundaryTags(id, type, range);
		} else {
			w.emptyTagId = id;
		}
		
		return id;
	};
	
	w.insertBoundaryTags = function(id, type, range) {
		var sel = w.editor.selection;
		var bm = sel.getBookmark();
		
		var start = w.editor.dom.create('span', {'_entity': true, '_type': type, 'class': 'entity '+type+' start', 'name': id});
		range.insertNode(start);
		w.editor.dom.bind(start, 'click', _doMarkerClick);
		
		w.editor.selection.moveToBookmark(bm);
		
		var end = w.editor.dom.create('span', {'_entity': true, '_type': type, 'class': 'entity '+type+' end', 'name': id});
		sel.collapse(false);
		range = sel.getRng(true);
		range.insertNode(end);
		w.editor.dom.bind(end, 'click', _doMarkerClick);
	};
	
	w.finalizeEntity = function(type, info) {
		w.editor.selection.moveToBookmark(w.editor.currentBookmark);
		if (info != null) {
//			var startTag = w.editor.$('[name='+id+'][class~=start]');
//			for (var key in info) {
//				startTag.attr(key, w.u.escapeHTMLString(info[key]));
//			}
			var id = _addEntityTag(type);
			w.entities[id].info = info;
			w.entitiesList.update();
			w.highlightEntity(id);
		}
		w.editor.currentBookmark = null;
		w.editor.focus();
	};
	
	var _getCurrentTag = function(id) {
		var tag = {entity: null, struct: null};
		if (id != null) {
			if (w.entities[id]) tag.entity = w.entities[id];
			else if (w.structs[id]) tag.struct = $('#'+id, w.editor.getBody());
		} else {
			if (w.editor.currentEntity != null) tag.entity = w.entities[w.editor.currentEntity];
			else if (w.editor.currentStruct != null) tag.struct = $('#'+w.editor.currentStruct, w.editor.getBody());
		}
		return tag;
	};
	
	// a general edit function for entities and structure tags
	w.editTag = function(id, pos) {
		var tag = _getCurrentTag(id);
		if (tag.struct) {
			if ($(tag.struct, w.editor.getBody()).attr('_tag')) {
				w.editor.execCommand('editSchemaTag', tag.struct, pos);
			} else {
				w.editor.execCommand('editCustomTag', tag.struct, pos);
			}
		} else if (tag.entity) {
			var type = tag.entity.props.type;
			w.d.show(type, {type: type, title: w.em.getTitle(type), pos: pos, entry: tag.entity});
		}
	};
	
	// a general change/replace function
	w.changeTag = function(params) {
		var tag = _getCurrentTag(params.id);
		if (tag.struct) {
			if ($(tag.struct, w.editor.getBody()).attr('_tag')) {
				w.editor.execCommand('changeSchemaTag', {tag: tag.struct, pos: params.pos, key: params.key});
			}
		} else if (tag.entity) {
		}
	};
	
	w.editEntity = function(id, info) {
		w.entities[id].info = info;
		w.entitiesList.update();
		w.highlightEntity(id);
	};
	
	w.copyEntity = function(id, pos) {
		var tag = _getCurrentTag(id);
		if (tag.entity) {
			w.editor.entityCopy = tag.entity;
		} else {
			w.d.show('message', {
				title: 'Error',
				msg: 'Cannot copy structural tags.',
				type: 'error'
			});
		}
	};
	
	w.pasteEntity = function(pos) {
		if (w.editor.entityCopy == null) {
			w.d.show('message', {
				title: 'Error',
				msg: 'No entity to copy!',
				type: 'error'
			});
		} else {
			var newEntity = jQuery.extend(true, {}, w.editor.entityCopy);
			newEntity.props.id = tinymce.DOM.uniqueId('ent_');
			
			w.editor.selection.moveToBookmark(w.editor.currentBookmark);
			var sel = w.editor.selection;
			sel.collapse();
			var rng = sel.getRng(true);
			
			var start = w.editor.dom.create('span', {'class': 'entity '+newEntity.props.type+' start', 'name': newEntity.props.id, '_entity': true});
			var text = w.editor.getDoc().createTextNode(newEntity.props.content);
			var end = w.editor.dom.create('span', {'class': 'entity '+newEntity.props.type+' end', 'name': newEntity.props.id, '_entity': true});
			var span = w.editor.dom.create('span', {id: 'entityHighlight'});
			w.editor.dom.add(span, start);
			w.editor.dom.add(span, text);
			w.editor.dom.add(span, end);

			rng.insertNode(span);
			
			w.editor.dom.bind(start, 'click', _doMarkerClick);
			w.editor.dom.bind(end, 'click', _doMarkerClick);
			
			w.entities[newEntity.props.id] = newEntity;
			
			w.entitiesList.update();
			w.highlightEntity(newEntity.props.id);
		}
	};
	
	// a general removal function for entities and structure tags
	w.removeTag = function(id) {
		if (id != null) {
			if (w.entities[id]) {
				w.removeEntity(id);
			} else if (w.structs[id]) {
				w.removeStructureTag(id);
			}
		} else {
			if (w.editor.currentEntity != null) {
				w.removeEntity(w.editor.currentEntity);
			} else if (w.editor.currentStruct != null) {
				w.removeStructureTag(w.editor.currentStruct);
			}
		}
	};
	
	w.removeEntity = function(id) {
		id = id || w.editor.currentEntity;
		
		delete w.entities[id];
		var node = $('span[name="'+id+'"]', w.editor.getBody());
		var parent = node[0].parentNode;
		node.remove();
		parent.normalize();
		w.highlightEntity();
		w.entitiesList.remove(id);
		w.editor.currentEntity = null;
	};
	
	// prevents the user from moving the caret inside a marker
	var _doMarkerClick = function(e) {
		var marker = w.editor.dom.get(e.target);
		var range = w.editor.selection.getRng(true);
		if (w.editor.dom.hasClass(marker, 'start')) {
			range.setStartAfter(marker);
			range.setEndAfter(marker);
		} else {
			range.setStartBefore(marker);
			range.setEndBefore(marker);
		}
		w.editor.selection.setRng(range);
		w.highlightEntity(marker.getAttribute('name'), w.editor.selection.getBookmark());
	};
	
	w.addStructureTag = function(params) {
		var bookmark = params.bookmark;
		var attributes = params.attributes;
		var action = params.action;
		
		var id = tinymce.DOM.uniqueId('struct_');
		attributes.id = id;
		attributes._textallowed = w.u.canTagContainText(attributes._tag);
		w.structs[id] = attributes;
		w.editor.currentStruct = id;
		
		var node;
		if (bookmark.tagId) {
			// this is used when adding tags through the structure tree
			node = $('#'+bookmark.tagId, w.editor.getBody())[0];
		} else {
			// this is meant for user text selections
			node = bookmark.rng.commonAncestorContainer;
			while (node.nodeType == 3 || (node.nodeType == 1 && !node.hasAttribute('_tag'))) {
				node = node.parentNode;
			}
		}
		
		var tag = 'span';
		var open_tag = '<'+tag;
		for (var key in attributes) {
			if (key == 'id' || key.match(/^_/) != null) {
				open_tag += ' '+key+'="'+attributes[key]+'"';
			}
		}
		open_tag += '>';
		var close_tag = '</'+tag+'>';
		
		var selection = '<span class="empty_tag_remove_me"></span>';
		var content = open_tag + selection + close_tag;
		if (action == 'before') {
			$(node).before(content);
		} else if (action == 'after') {
			$(node).after(content);
		} else if (action == 'around') {
			$(node).wrap(content);
		} else if (action == 'inside') {
			$(node).wrapInner(content);
		} else {
			w.editor.selection.moveToBookmark(bookmark);
			selection = w.editor.selection.getContent();
			if (selection == '') selection = '<span class="empty_tag_remove_me"></span>';

			content = open_tag + selection + close_tag;
			w.editor.execCommand('mceReplaceContent', false, content);
		}
		if (selection == '<span class="empty_tag_remove_me"></span>') {
			// TODO inserting empty struct isn't working
			w.fixEmptyTag = true;
			var nodeEl = $('span[class="empty_tag_remove_me"]', w.editor.getBody()).parent()[0];
			var range = w.editor.selection.getRng(true);
			range.setStart(nodeEl.firstChild, 0);
			range.setEnd(nodeEl.lastChild, nodeEl.lastChild.length);
			w.editor.getDoc().getSelection().addRange(range);
		}
		
		w.tree.update();
	};
	
	w.editStructureTag = function(tag, attributes) {
		var id = tag.attr('id');
		attributes.id = id;
		$.each($(tag[0].attributes), function(index, att) {
			if (att.name != 'id') {
				tag.removeAttr(att.name);
			}
		});
		for (var key in attributes) {
			if (key.match(/^_/) != null) {
				tag.attr(key, attributes[key]);
			}
		}
		w.structs[id] = attributes;
		w.tree.update();
	};
	
	w.removeStructureTag = function(id, removeContents) {
		id = id || w.editor.currentStruct;
		
		delete w.structs[id];
		var node = $('#'+id, w.editor.getBody());
		if (removeContents) {
			node.remove();
		} else {
			var parent = node.parent()[0];
			var contents = node.contents();
			if (contents.length > 0) {
				contents.unwrap();
			} else {
				node.remove();
			}
			parent.normalize();
		}
		w.tree.update();
		w.editor.currentStruct = null;
	};
	
	w.selectStructureTag = function(id) {
		w.editor.currentStruct = id;
		var node = $('#'+id, w.editor.getBody());
		w.fixEmptyTag = true;
		node.append('<span class="empty_tag_remove_me"></span>');
		
		var nodeEl = node[0];
		
		var display = node.css('display');
		// hack to fix selection of inline elements
		if (display == 'inline') {
			node.before('<span data-mce-bogus="1">\uFEFF</span>').after('<span data-mce-bogus="1">\uFEFF</span>');
			
			var rng = w.editor.dom.createRng();
			rng.setStart(nodeEl.previousSibling, 0);
			rng.setEnd(nodeEl.nextSibling, 0);
			w.editor.selection.setRng(rng);
		} else {
			w.editor.selection.select(nodeEl);
		}
		
		// select node contents only
//		if (tinymce.isWebKit) {
//			w.editor.getWin().getSelection().selectAllChildren(nodeEl);
//		} else {
//			var range = w.editor.selection.getRng(true);
//			range.setStart(nodeEl.firstChild, 0);
//			range.setEnd(nodeEl.lastChild, nodeEl.lastChild.length);
//			w.editor.getWin().getSelection().addRange(range);
//		}
		
		// fire the onNodeChange event
		w.editor.parents = [];
		w.editor.dom.getParent(nodeEl, function(n) {
			if (n.nodeName == 'BODY')
				return true;

			w.editor.parents.push(n);
		});
		w.editor.onNodeChange.dispatch(w.editor, w.editor.controlManager, nodeEl, false, w.editor);
		
		w.editor.focus();
	};
	
	w.removeHighlights = function() {
		w.highlightEntity();
	};
	
	w.getDocumentationForTag = function(tag) {
		var element = $('element[name="'+tag+'"]', writer.schemaXML);
		var doc = $('a\\:documentation, documentation', element).first().text();
		return doc;
	};
	
	/**
	 * Load a document into the editor
	 * @param docXml The XML content of the document
	 * @param schemaURI The URI for the corresponding schema
	 */
	w.loadDocument = function(docXml, schemaURI) {
		w.fm.loadDocumentFromXml(docXml);
	};
	
	/**
	 * Get the current document from the editor
	 * @returns Element The XML document serialized to a string
	 */
	w.getDocument = function() {
		var docString = w.fm.getDocumentContent(true);
		var doc = null;
		try {
			var parser = new DOMParser();
			doc = parser.parseFromString(docString, 'application/xml');
		} catch(e) {
			w.d.show('message', {
				title: 'Error',
				msg: 'There was an error getting the document:'+e,
				type: 'error'
			});
		}
		return doc;
	};
	
	/**
	 * Begin init functions
	 */
	w.init = function() {
		var cssFiles = ['smoothness/jquery-ui-1.9.0.custom.css', 'css/layout-default-latest.css', 'js/snippet/jquery.snippet.css'];
		for (var i = 0; i < cssFiles.length; i++) {
			var css = $('<link />');
			css.attr({
				rel: 'stylesheet',
				type: 'text/css',
				href: cssFiles[i]
			});
			$(document.head).append(css);
		}
		
		w.layout = $(document.body).layout({
			defaults: {
				maskIframesOnResize: true,
				resizable: true,
				slidable: false
			},
			north: {
				size: 35,
				resizable: false,
				spacing_open: 0,
				spacing_closed: 0
			},
			east: {
				size: 'auto',
				minSize: 300
			},
			south: {
				size: 34,
				resizable: false,
				spacing_open: 0,
				spacing_closed: 0
			},
			west: {
				size: 'auto',
				minSize: 375,
				onresize: function(region, pane, state, options) {
					var tabsHeight = $('#westTabs > ul').outerHeight();
					$('#westTabsContent').height(state.layoutHeight - tabsHeight);
//					$.layout.callbacks.resizeTabLayout(region, pane);
				}
			}
		});
		w.layout.panes.center.layout({
			defaults: {
				maskIframesOnResize: true,
				resizable: true,
				slidable: false
			},
			center: {
				onresize: function(region, pane, state, options) {
					var uiHeight = $('#'+w.editor.id+'_tbl tr.mceFirst').outerHeight() + 2;
					$('#'+w.editor.id+'_ifr').height(state.layoutHeight - uiHeight);
				}
			},
			south: {
				size: 250,
				initClosed: true,
				activate: function(event, ui) {
					$.layout.callbacks.resizeTabLayout(event, ui);
				},
				onopen_start: function(region, pane, state, options) {
					var southTabs = $('#southTabs');
					if (!southTabs.hasClass('ui-tabs')) {
						southTabs.tabs({
							create: function(event, ui) {
								southTabs.parent().find('div.ui-corner-all, ul.ui-corner-all').removeClass('ui-corner-all');
							}
						});
					}
				},
				onresize: function(region, pane, state, options) {
					var tabsHeight = $('#southTabs > ul').outerHeight();
					$('#southTabsContent').height(state.layoutHeight - tabsHeight);
				}
			}
		});
		
		$('#header h1').click(function() {
			window.location = 'index.htm';
		});
		
		if (w.mode != null && w.mode == 'xml') {
			w.mode = w.XML;
		} else {
			w.mode = w.XMLRDF;
		}
		
		w.d = new DialogManager({writer: w});
		w.u = new Utilities({writer: w});
		w.fm = new FileManager({writer: w});
		w.tree = new StructureTree({writer: w, parentId: '#westTabsContent'});
		w.entitiesList = new EntitiesList({writer: w, parentId: '#westTabsContent'});
		w.em = new EntitiesModel();
		w.relations = new Relations({writer: w, parentId: '#westTabsContent'});
		w.validation = new Validation({writer: w, parentId: '#southTabsContent'});
		w.settings = new SettingsDialog(w, {
			showEntityBrackets: true,
			showStructBrackets: false
		});
		if (config.delegator != null) {
			w.delegator = new config.delegator({writer: w});
		} else {
			alert('Error: you must specify a delegator in the Writer config for full functionality!');
		}
		
		$(document.body).click(_hideContextMenus);
		$('#westTabs').tabs({
			active: 1,
			activate: function(event, ui) {
				$.layout.callbacks.resizeTabLayout(event, ui);
			},
			create: function(event, ui) {
				$('#westTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
			}
		});
		
		/**
		 * Init tinymce
		 */
//		$('#editor').tinymce({
//			script_url : 'js/tinymce/jscripts/tiny_mce/tiny_mce.js',
		tinyMCE.init({
			mode: 'exact',
			elements: 'editor',
			theme: 'advanced',
			
			content_css: 'css/editor.css',
			
			width: '100%',
			
			contextmenu_never_use_native: true,
			
			doctype: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
			element_format: 'xhtml',
			
			forced_root_block: w.root,
			keep_styles: false, // false, otherwise tinymce interprets our spans as style elements
			
			paste_auto_cleanup_on_paste: true, // true, otherwise paste_postprocess isn't called
			paste_postprocess: function(pl, o) {
				function stripTags(index, node) {
					if (node.hasAttribute('_tag') || node.hasAttribute('_entity') ||
						node.nodeName.toLowerCase() == 'p' && node.nodeName.toLowerCase() == 'br') {
						$(node).children().each(stripTags);
					} else {
						if ($(node).contents().length == 0) {
							$(node).remove();
						} else {
							var contents = $(node).contents().unwrap();
							contents.not(':text').each(stripTags);
						}
					}
				}
				
				function replaceTags(index, node) {
					if (node.nodeName.toLowerCase() == 'p') {
						$(node).contents().unwrap().wrapAll('<span _tag="p"></span>').not(':text').each(replaceTags);
					} else if (node.nodeName.toLowerCase() == 'br') {
						$(node).replaceWith('<span _tag="lb"></span>');
					}
				}
				
				$(o.node).children().each(stripTags);
				$(o.node).children().each(replaceTags);
			},
			
			valid_elements: '*[*]', // allow everything
			
			plugins: 'paste,-entitycontextmenu,-schematags,-currenttag,-viewsource',
			theme_advanced_buttons1: 'schematags,|,addperson,addplace,adddate,addevent,addorg,addcitation,addnote,addtitle,addcorrection,addkeyword,addlink,|,editTag,removeTag,|,addtriple,|,viewsource,editsource,|,validate,savebutton',
			theme_advanced_buttons2: 'currenttag',
			theme_advanced_buttons3: '',
			theme_advanced_toolbar_location: 'top',
			theme_advanced_toolbar_align: 'left',
			theme_advanced_path: false,
			theme_advanced_statusbar_location: 'none',
			
			setup: function(ed) {
				// link the writer and editor
				w.editor = ed;
				ed.writer = w;
				
				// custom properties added to the editor
				ed.currentEntity = null; // the id of the currently highlighted entity
				ed.currentStruct = null; // the id of the currently selected structural tag
				ed.currentBookmark = null; // for storing a bookmark used when adding a tag
				ed.currentNode = null; // the node that the cursor is currently in
				ed.entityCopy = null; // store a copy of an entity for pasting
				ed.contextMenuPos = null; // the position of the context menu (used to position related dialog box)
				ed.copiedElement = null; // the element that was copied (when first selected through the structure tree)
				
				ed.onInit.add(function(ed) {
					// modify isBlock method to check _tag attributes
					ed.dom.isBlock = function(node) {
						var type = node.nodeType;

						// If it's a node then check the type and use the nodeName
						if (type) {
							if (type === 1) {
								var tag = node.getAttribute('_tag') || node.nodeName;
//								console.log(tag);
//								return !!(ed.schema.getBlockElements()[tag]);
								return true;
							}
						}

						return !!ed.schema.getBlockElements()[node];
					};
					
					var settings = w.settings.getSettings();
					var body = $(ed.getBody());
					if (settings.showEntityBrackets) body.addClass('showEntityBrackets');
					if (settings.showStructBrackets) body.addClass('showStructBrackets');
					
					ed.addCommand('isSelectionValid', w.u.isSelectionValid);
					ed.addCommand('showError', w.showError);
					ed.addCommand('addEntity', w.addEntity);
					ed.addCommand('editTag', w.editTag);
					ed.addCommand('changeTag', w.changeTag);
					ed.addCommand('removeTag', w.removeTag);
					ed.addCommand('copyEntity', w.copyEntity);
					ed.addCommand('pasteEntity', w.pasteEntity);
					ed.addCommand('removeEntity', w.removeEntity);
					ed.addCommand('addStructureTag', w.addStructureTag);
					ed.addCommand('editStructureTag', w.editStructureTag);
					ed.addCommand('changeStructureTag', w.changeStructureTag);
					ed.addCommand('updateStructureTree', w.tree.update);
					ed.addCommand('removeHighlights', w.removeHighlights);
					ed.addCommand('exportDocument', w.fm.exportDocument);
					ed.addCommand('loadDocument', w.fm.loadDocument);
					ed.addCommand('getChildrenForTag', w.u.getChildrenForTag);
					ed.addCommand('getParentsForTag', w.u.getParentsForTag);
					ed.addCommand('getDocumentationForTag', w.getDocumentationForTag);
					
					// used in conjunction with the paste plugin
					// needs to be false in order for paste postprocessing to function properly
					ed.pasteAsPlainText = false;
					
					// highlight tracking
					ed.onMouseUp.add(function(ed, evt) {
						_hideContextMenus(evt);
						_doHighlightCheck(ed, evt);
					});
					
					ed.onKeyDown.add(_onKeyDownHandler);
					ed.onKeyUp.add(_onKeyUpHandler);
					
					setTimeout(function() {
						w.layout.resizeAll(); // now that the editor is loaded, set proper sizing
					}, 250);
					
					// load a starting document
					w.fm.loadInitialDocument(window.location.hash);
				});
				ed.onChange.add(_onChangeHandler);
				ed.onNodeChange.add(_onNodeChangeHandler);
				ed.onCopy.add(_onCopyHandler);
				ed.onPaste.add(_onPasteHandler);
				
				// add schema file and method
				ed.addCommand('getSchema', function(){
					return w.schema;
				});
				
				// add custom plugins and buttons
				var plugins = ['schematags','currenttag','entitycontextmenu','viewsource','scrolling_dropmenu'];
				
				for (var i = 0; i < plugins.length; i++) {
					var name = plugins[i];
					tinymce.PluginManager.load(name, '../../../tinymce_plugins/'+name+'.js');
				}
				
				ed.addButton('addperson', {title: 'Tag Person', image: 'img/user.png', 'class': 'entityButton person',
					onclick : function() {
						ed.execCommand('addEntity', 'person');
					}
				});
				ed.addButton('addplace', {title: 'Tag Place', image: 'img/world.png', 'class': 'entityButton place',
					onclick : function() {
						ed.execCommand('addEntity', 'place');
					}
				});
				ed.addButton('adddate', {title: 'Tag Date', image: 'img/calendar.png', 'class': 'entityButton date',
					onclick : function() {
						ed.execCommand('addEntity', 'date');
					}
				});
				ed.addButton('addevent', {title: 'Tag Event', image: 'img/cake.png', 'class': 'entityButton event',
					onclick : function() {
						ed.execCommand('addEntity', 'event');
					}
				});
				ed.addButton('addorg', {title: 'Tag Organization', image: 'img/group.png', 'class': 'entityButton org',
					onclick : function() {
						ed.execCommand('addEntity', 'org');
					}
				});
				ed.addButton('addcitation', {title: 'Tag Citation', image: 'img/vcard.png', 'class': 'entityButton citation',
					onclick : function() {
						ed.execCommand('addEntity', 'citation');
					}
				});
				ed.addButton('addnote', {title: 'Tag Note', image: 'img/note.png', 'class': 'entityButton note',
					onclick : function() {
						ed.execCommand('addEntity', 'note');
					}
				});
				ed.addButton('addcorrection', {title: 'Tag Correction', image: 'img/error.png', 'class': 'entityButton correction',
					onclick : function() {
						ed.execCommand('addEntity', 'correction');
					}
				});
				ed.addButton('addkeyword', {title: 'Tag Keyword', image: 'img/page_key.png', 'class': 'entityButton keyword',
					onclick : function() {
						ed.execCommand('addEntity', 'keyword');
					}
				});
				ed.addButton('addlink', {title: 'Tag Link', image: 'img/link.png', 'class': 'entityButton link',
					onclick : function() {
						ed.execCommand('addEntity', 'link');
					}
				});
				ed.addButton('addtitle', {title: 'Tag Text/Title', image: 'img/book.png', 'class': 'entityButton textTitle',
					onclick : function() {
						ed.execCommand('addEntity', 'title');
					}
				});
				ed.addButton('editTag', {title: 'Edit Tag', image: 'img/tag_blue_edit.png', 'class': 'entityButton',
					onclick : function() {
						ed.execCommand('editTag');
					}
				});
				ed.addButton('removeTag', {title: 'Remove Tag', image: 'img/tag_blue_delete.png', 'class': 'entityButton',
					onclick : function() {
						ed.execCommand('removeTag');
					}
				});
				ed.addButton('newbutton', {title: 'New', image: 'img/page_white_text.png', 'class': 'entityButton',
					onclick: function() {
						w.fm.newDocument();
					}
				});
				ed.addButton('savebutton', {title: 'Save', image: 'img/save.png',
					onclick: function() {
						w.fm.saveDocument();
					}
				});
				ed.addButton('saveasbutton', {title: 'Save As', image: 'img/save_as.png',
					onclick: function() {
						w.fm.openSaver();
					}
				});
				ed.addButton('loadbutton', {title: 'Load', image: 'img/folder_page.png', 'class': 'entityButton',
					onclick: function() {
						w.fm.openLoader();
					}
				});
				ed.addButton('editsource', {title: 'Edit Source', image: 'img/editsource.gif', 'class': 'wideButton',
					onclick: function() {
						w.fm.editSource();
					}
				});
				ed.addButton('validate', {title: 'Validate', image: 'img/validate.png', 'class': 'entityButton',
					onclick: function() {
						w.delegator.validate();
					}
				});
				ed.addButton('addtriple', {title: 'Add Relation', image: 'img/chart_org.png', 'class': 'entityButton',
					onclick: function() {
						$('#westTabs').tabs('select', 2);
						w.d.show('triple');
					}
				});
				
//				ed.addButton('toggleeditor', {
//					title: 'Show Advanced Mode',
//					image: 'img/html.png',
//					'class': 'entityButton',
//					cmd: 'toggle_editor'
//				});
			}
		});
	};
};