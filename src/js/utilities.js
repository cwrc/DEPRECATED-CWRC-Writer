function Utilities(config) {
	var w = config.writer;
	
	var useLocalStorage = supportsLocalStorage();
	
	var u = {};
	
	/**
	 * @memberOf u
	 * @param content
	 * @returns
	 */
	u.getTitleFromContent = function(content) {
		if (content.length <= 34) return content;
		var title = content.substring(0, 34) + '&#8230;';
		return title;
	};
	
	u.escapeHTMLString = function(value) {
		if (typeof value == 'string') {
			return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		} else {
			return value;
		}
	};
	
	u.unescapeHTMLString = function(value) {
		if (typeof value == 'string') {
			return value.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
		} else {
			return value;
		}
	};
	
	/**
	 * checks the user selection and potential entity markers
	 * @param isStructTag Is the tag a structure tag
	 * @param structAction How is the tag being inserted? (before/after/around/inside)
	 * @returns
	 */
	u.isSelectionValid = function(isStructTag, structAction) {
		var sel = w.editor.selection;
		
		// check for numerous overlap possibilities
		var range = sel.getRng(true);
		// next line commented out as it messes up the selection in IE
//		range.commonAncestorContainer.normalize(); // normalize/collapse separate text nodes
		
		// fix for select all and root node select
		if (range.commonAncestorContainer.nodeName.toLowerCase() == 'body') {
			var root = w.editor.$('body > *')[0];
			range.setStartBefore(root.firstChild);
			range.setEndAfter(root.lastChild);
		}
		
		function findTextNode(currNode, direction, reps) {
			if (reps > 20) return null; // prevent infinite recursion
			else {
				var newNode;
				if (direction == 'back') {
					newNode = currNode.lastChild || currNode.previousSibling || currNode.parentNode.previousSibling;
				} else {
					newNode = currNode.firstChild || currNode.nextSibling || currNode.parentNode.nextSibling;
				}
				if (newNode == null) return null;
				if (newNode.nodeType == Node.TEXT_NODE) return newNode;
				return findTextNode(newNode, direction, reps++);
			}
		}
		
		// fix for when start and/or end containers are element nodes (should always be text nodes for entities)
		if (!isStructTag) {
			if (range.startContainer.nodeType == Node.ELEMENT_NODE) {
				var end = range.endContainer;
				if (end.nodeType != Node.TEXT_NODE || range.endOffset == 0) {
					end = findTextNode(range.endContainer, 'back', 0);
					if (end == null) return w.NO_COMMON_PARENT;
					range.setEnd(end, end.length);
				}
				range.setStart(end, 0);
			}
			if (range.endContainer.nodeType == Node.ELEMENT_NODE) {
				// don't need to check nodeType here since we've already ensured startContainer is text
				range.setEnd(range.startContainer, range.startContainer.length);
			}
		}
		
		/**
		 * Removes whitespace surrounding the range.
		 * Also fixes cases where the range spans adjacent text nodes with different parents.
		 */
		function fixRange(range) {
			var content = range.toString();
			var match = content.match(/^\s+/);
			var leadingSpaces = 0, trailingSpaces = 0;
			if (match != null) {
				leadingSpaces = match[0].length;
			}
			match = content.match(/\s+$/);
			if (match != null) {
				trailingSpaces = match[0].length;
			}
			
			function shiftRangeForward(range, count, reps) {
				if (count > 0 && reps < 20) {
					if (range.startOffset < range.startContainer.length) {
						range.setStart(range.startContainer, range.startOffset+1);
						count--;
					}
					if (range.startOffset == range.startContainer.length) {
						var nextTextNode = findTextNode(range.startContainer, 'forward', 0);
						if (nextTextNode != null) {
							range.setStart(nextTextNode, 0);
						}
					}
					shiftRangeForward(range, count, reps++);
				}
			}
			
			function shiftRangeBackward(range, count, reps) {
				if (count > 0 && reps < 20) {
					if (range.endOffset > 0) {
						range.setEnd(range.endContainer, range.endOffset-1);
						count--;
					}
					if (range.endOffset == 0) {
						var prevTextNode = findTextNode(range.endContainer, 'back', 0);
						if (prevTextNode != null) {
							range.setEnd(prevTextNode, prevTextNode.length);
						}
					}
					shiftRangeBackward(range, count, reps++);
				}
			}
			
			shiftRangeForward(range, leadingSpaces, 0);
			shiftRangeBackward(range, trailingSpaces, 0);
			
			sel.setRng(range);
		}
		
		if (!structAction) {
			fixRange(range);
		}
		
		if (range.startContainer.parentNode != range.endContainer.parentNode) {
			if (range.endOffset == 0 && range.endContainer.previousSibling == range.startContainer.parentNode) {
				// fix for when the user double-clicks a word that's already been tagged
				range.setEnd(range.startContainer, range.startContainer.length);
			} else {
				return w.NO_COMMON_PARENT;
			}
		}
		
		// extra check to make sure we're not overlapping with an entity
		if (isStructTag || w.mode == w.XML) {
			var c;
			var currentNode = range.startContainer;
			var ents = {};
			while (currentNode != range.endContainer) {
				currentNode = currentNode.nextSibling;
				c = $(currentNode);
				if (c.hasClass('entity')) {
					if (c.hasClass('start')) {
						ents[c.attr('name')] = true;
					} else {
						if (ents[c.attr('name')]) {
							delete ents[c.attr('name')];
						} else {
							return w.NO_COMMON_PARENT;
						}
					}
				}
			}
			var count = 0;
			for (var id in ents) {
				count++;
			}
			if (count != 0) return w.NO_COMMON_PARENT;
		}
		
		return w.VALID;
	};

	function supportsLocalStorage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}

	/**
	 * @param currEl The element that's currently being processed
	 * @param defHits A list of define tags that have already been processed
	 * @param level The level of recursion
	 * @param type The type of child to search for (element or attribute)
	 * @param children The children to return
	 */
	function _getChildren(currEl, defHits, level, type, children) {
		// first get the direct types
		currEl.find(type).each(function(index, el) {
			var child = $(el);
			if (child.parents('element').length > 0 && level > 0) {
				return; // don't get elements/attributes from other elements
			}
			var childObj = {
				name: child.attr('name'),
				level: level+0,
				documentation: $('a\\:documentation, documentation', child).first().text()
			};
			if (type == 'attribute') {
				childObj.required = child.parent('optional').length == 0;
				childObj.defaultValue = $('a\\:defaultValue, defaultValue', child).first().text();
				var choice = $('choice', child).first();
				if (choice.length == 1) {
					var choices = [];
					$('value', choice).each(function(index, el) {
						choices.push($(el).text());
					});
					childObj.choices = choices;
				}
			}
			children.push(childObj);
		});
		// now process the references
		currEl.find('ref').each(function(index, el) {
			var name = $(el).attr('name');
			if ($(el).parents('element').length > 0 && level > 0) {
				return; // don't get attributes from other elements
			}
			if (!defHits[name]) {
				defHits[name] = true;
				var def = $('define[name="'+name+'"]', writer.schemaXML);
				_getChildren(def, defHits, level+1, type, children);
			}
		});
	};
	
	/**
	 * @param tag The element name to get children of
	 * @param type The type of children to get: "element" or "attribute"
	 * @param returnType Either: "array", "object", "names" (which is an array of just the element names)
	 */
	u.getChildrenForTag = function(config) {
		var type = config.type || 'element';
		var tag = config.tag;
		var children = [];
		
		if (useLocalStorage) {
			var localData = localStorage['cwrc.'+tag+'.'+type+'.children'];
			if (localData) {
				children = JSON.parse(localData);
			}
		}
		if (children.length == 0) {
			var element = $('element[name="'+tag+'"]', writer.schemaXML);
			var defHits = {};
			var level = 0;
			_getChildren(element, defHits, level, type, children);
			children.sort(function(a, b) {
				if (a.name > b.name) return 1;
				if (a.name < b.name) return -1;
				return 0;
			});
			
			if (useLocalStorage) {
				localStorage['cwrc.'+tag+'.'+type+'.children'] = JSON.stringify(children);
			}
		}
		
		if (config.returnType == 'object') {
			var childrenObj = {};
			for (var i = 0; i < children.length; i++) {
				var c = children[i];
				childrenObj[c.name] = c;
			}
			return childrenObj;
		} else if (config.returnType == 'names') {
			var names = [];
			for (var i = 0; i < children.length; i++) {
				names.push(children[i].name);
			}
			return names;
		} else {
			return children;
		}
	};
	
	function _getParentElementsFromDef(defName, defHits, level, parents) {
		$('define:has(ref[name="'+defName+'"])', writer.schemaXML).each(function(index, el) {
			var name = $(el).attr('name');
			if (!defHits[name]) {
				defHits[name] = true;
				var element = $(el).find('element').first();
				if (element.length == 1) {
					parents.push({name: element.attr('name'), level: level+0});
				} else {
					_getParentElementsFromDef(name, defHits, level+1, parents);
				}
			}
		});
	};
	
	/**
	 * @param tag The element name to get parents of
	 * @param returnType Either: "array", "object", "names" (which is an array of just the element names)
	 */
	u.getParentsForTag = function(config) {
		var tag = config.tag;
		var parents = [];
		
		if (useLocalStorage) {
			var localData = localStorage['cwrc.'+tag+'.parents'];
			if (localData) {
				parents = JSON.parse(localData);
			}
		}
		if (parents.length == 0) {
			var element = $('element[name="'+tag+'"]', writer.schemaXML);
			var defName = element.parents('define').attr('name');
			var defHits = {};
			var level = 0;
			_getParentElementsFromDef(defName, defHits, level, parents);
			parents.sort(function(a, b) {
				if (a.name > b.name) return 1;
				if (a.name < b.name) return -1;
				return 0;
			});
			
			if (useLocalStorage) {
				localStorage['cwrc.'+tag+'.parents'] = JSON.stringify(parents);
			}
		}
		
		if (config.returnType == 'object') {
			var parentsObj = {};
			for (var i = 0; i < parents.length; i++) {
				var c = parents[i];
				parentsObj[c.name] = c;
			}
			return parentsObj;
		} else if (config.returnType == 'names') {
			var names = [];
			for (var i = 0; i < parents.length; i++) {
				names.push(parents[i].name);
			}
			return names;
		} else {
			return parents;
		}
	};
	
	/**
	 * @param currEl The element that's currently being processed
	 * @param defHits A list of define tags that have already been processed
	 * @param level The level of recursion
	 * @param canContainText Whether the element can contain text
	 */
	function checkForText(currEl, defHits, level, canContainText) {
		if (canContainText.isTrue) {
			return false;
		}
		
		// check for the text element
		var textHits = currEl.find('text');
		if (textHits.length > 0) {
			canContainText.isTrue = true;
			return false;
		}
		
		// now process the references
		currEl.find('ref').each(function(index, el) {
			var name = $(el).attr('name');
			if ($(el).parents('element').length > 0 && level > 0) {
				return; // don't get attributes from other elements
			}
			if (!defHits[name]) {
				defHits[name] = true;
				var def = $('define[name="'+name+'"]', writer.schemaXML);
				return checkForText(def, defHits, level+1, canContainText);
			}
		});
	};
	
	/**
	 * Checks to see if the tag can contain text, as specified in the schema
	 * @param tag The tag to check
	 * @returns boolean
	 */
	u.canTagContainText = function(tag) {
		if (tag == writer.root) return false;
		
		if (useLocalStorage) {
			var localData = localStorage['cwrc.'+tag+'.text'];
			if (localData) return localData == 'true';
		}
		
		var element = $('element[name="'+tag+'"]', writer.schemaXML);
		var defHits = {};
		var level = 0;
		var canContainText = {isTrue: false}; // needs to be an object so change is visible outside of checkForText
		checkForText(element, defHits, level, canContainText);
		
		if (useLocalStorage) {
			localStorage['cwrc.'+tag+'.text'] = canContainText.isTrue;
		}
		
		return canContainText.isTrue;
	};
	
	return u;
};