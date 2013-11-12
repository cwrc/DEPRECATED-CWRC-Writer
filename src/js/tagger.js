function Tagger(config) {
	var w = config.writer;
	
	var tagger = {};
	
	/**
	 * Inserts entity boundary tags around the supplied DOM range.
	 * @memberOf tagger
	 * @param {string} id The id of then entity 
	 * @param {string} type The entity type
	 * @param {range} range The DOM range to insert the tags around
	 */
	tagger.insertBoundaryTags = function(id, type, range) {
		var sel = w.editor.selection;
		var bm = sel.getBookmark();
		
		var start = w.editor.dom.create('span', {'_entity': true, '_type': type, 'class': 'entity '+type+' start', 'name': id}, '');
		range.insertNode(start);
		w.editor.dom.bind(start, 'click', _doMarkerClick);
		
		w.editor.selection.moveToBookmark(bm);
		
		var end = w.editor.dom.create('span', {'_entity': true, '_type': type, 'class': 'entity '+type+' end', 'name': id}, '');
		sel.collapse(false);
		range = sel.getRng(true);
		range.insertNode(end);
		w.editor.dom.bind(end, 'click', _doMarkerClick);
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
	
	/**
	 * Get the entity boundary tag that corresponds to the passed tag.
	 * @param {element} tag
	 */
	tagger.getCorrespondingEntityTag = function(tag) {
		tag = $(tag);
		var corrTag;
		if (tag.hasClass('start')) {
			corrTag = tagger.findEntityBoundary('end', tag[0].nextSibling);
		} else {
			corrTag = tagger.findEntityBoundary('start', tag[0].previousSibling);
		}
		return corrTag;
	};
	
	/**
	 * Searches for an entity boundary containing the current node.
	 * @param {string} boundaryType Either 'start' or 'end'.
	 * @param {element} currentNode The node that is currently being examined.
	 */
	tagger.findEntityBoundary = function(boundaryType, currentNode) {
		
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
	
	/**
	 * Looks for tags that have been added or deleted and updates the entity and struct lists.
	 * Returns true if a new tag is found.
	 * @returns {Boolean}
	 */
	tagger.findNewAndDeletedTags = function() {
		var updateRequired = false;
		
		// new tags
		var newTags = w.editor.dom.select('[_tag]:not([id])');
		if (newTags.length > 0) updateRequired = true;
		
		// deleted tags
		for (var id in w.entities) {
			var nodes = w.editor.dom.select('[name="'+id+'"]');
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
	
	/**
	 * Looks for duplicate tags (from copy paste operations) and creates new entity/struct entries.
	 */
	tagger.findDuplicateTags = function() {
		for (var id in w.entities) {
			var match = $('span[class~="start"][name="'+id+'"]', w.editor.getBody());
			if (match.length > 1) {
				match.each(function(index, el) {
					if (index > 0) {
						var newId = tinymce.DOM.uniqueId('ent_');
						var newTagStart = $(el);
						var newTagEnd = $(tagger.getCorrespondingEntityTag(newTagStart));
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
	
	tagger.getCurrentTag = function(id) {
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
	tagger.editTag = function(id, pos) {
		var tag = tagger.getCurrentTag(id);
		if (tag.struct) {
			if ($(tag.struct, w.editor.getBody()).attr('_tag')) {
				w.editor.execCommand('editSchemaTag', tag.struct, pos);
			} else {
				w.editor.execCommand('editCustomTag', tag.struct, pos);
			}
		} else if (tag.entity) {
			var type = tag.entity.props.type;
			w.dialogs.show(type, {type: type, title: w.em.getTitle(type), pos: pos, entry: tag.entity});
		}
	};
	
	// a general change/replace function
	tagger.changeTag = function(params) {
		var tag = tagger.getCurrentTag(params.id);
		if (tag.struct) {
			if ($(tag.struct, w.editor.getBody()).attr('_tag')) {
				w.editor.execCommand('changeSchemaTag', {tag: tag.struct, pos: params.pos, key: params.key});
			}
		} else if (tag.entity) {
		}
	};
	
	// a general removal function for entities and structure tags
	tagger.removeTag = function(id) {
		if (id != null) {
			if (w.entities[id]) {
				w.removeEntity(id);
			} else if (w.structs[id]) {
				tagger.removeStructureTag(id);
			}
		} else {
			if (w.editor.currentEntity != null) {
				w.removeEntity(w.editor.currentEntity);
			} else if (w.editor.currentStruct != null) {
				tagger.removeStructureTag(w.editor.currentStruct);
			}
		}
	};
	
	
	/**
	 * Add our own undo level, then erase the next one that gets added by tinymce
	 */
	function _doCustomTaggerUndo() {
		w.editor.undoManager.add();
		w.editor.undoManager.onAdd.addToTop(function() {
			this.data.splice(this.data.length-1, 1); // remove last undo level
			this.onAdd.listeners.splice(0, 1); // remove this listener
		}, w.editor.undoManager);
	}
	
	tagger.addEntityTag = function(type) {
		_doCustomTaggerUndo();
		
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
			tagger.insertBoundaryTags(id, type, range);
		} else {
			w.emptyTagId = id;
		}
		
		return id;
	};
	
	/**
	 * Adds a structure tag to the document, based on the params.
	 * @param params An object with the following properties:
	 * @param params.bookmark A tinymce bookmark object, with an optional custom tagId property
	 * @param params.attributes Various properties related to the tag
	 * @param params.action Where to insert the tag, relative to the bookmark (before, after, around, inside); can also be null
	 */
	tagger.addStructureTag = function(params) {
		_doCustomTaggerUndo();
		
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
		
		var tagName = w.u.getTagForEditor(attributes._tag);
		var open_tag = '<'+tagName;
		for (var key in attributes) {
			if (key == 'id' || key.match(/^_/) != null) {
				open_tag += ' '+key+'="'+attributes[key]+'"';
			} 
		}
		// TODO find a better way of handling this
		if (attributes._tag == 'title') {
			if (attributes.level != null) {
				open_tag += ' level="'+attributes.level+'"';
			}
			if (attributes.type != null) {
				open_tag += ' type="'+attributes.type+'"';
			}
		}
		
		open_tag += '>';
		var close_tag = '</'+tagName+'>';
		
		var selection = '\uFEFF';
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
			if (selection == '') selection = '\uFEFF';
			content = open_tag + selection + close_tag;

			var range = w.editor.selection.getRng(true);
			var tempNode = $('<span data-mce-bogus="1">', w.editor.getDoc());
			range.surroundContents(tempNode[0]);
			tempNode.replaceWith(content);
		}
		
		w.tree.update();
		
		if (selection == '\uFEFF') {
			w.selectStructureTag(id, true);
		} else if (action == undefined) {
			// place the cursor at the end of the tag's contents
			var rng = w.editor.selection.getRng(true);
			rng.selectNodeContents($('#'+id, w.editor.getBody())[0]);
			rng.collapse(false);
			w.editor.selection.setRng(rng);
		}
	};
	
	tagger.editStructureTag = function(tag, attributes) {
		// TODO add support for span/div changing, add undo support
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
		if (attributes._tag == 'title') {
			if (attributes.level != null) {
				tag.attr('level', attributes.level);
			}
			if (attributes.type != null) {
				tag.attr('type', attributes.type);
			}
		}
		w.structs[id] = attributes;
		w.tree.update();
	};
	
	tagger.removeStructureTag = function(id, removeContents) {
		_doCustomTaggerUndo();
		
		id = id || w.editor.currentStruct;
		
		if (removeContents == undefined) {
			if (w.tree.currentlySelectedNode != null && w.tree.selectionType != null) {
				removeContents = true;
			}
		}
		
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
		
		w.tagger.findNewAndDeletedTags();
		w.tree.update();
		w.editor.currentStruct = null;
	};
	
	tagger.removeStructureTagContents = function(id) {
		_doCustomTaggerUndo();
		
		var node = $('#'+id, w.editor.getBody());
		node.contents().remove();
		w.tagger.findNewAndDeletedTags();
		w.tree.update();
	};
	
	return tagger;
}