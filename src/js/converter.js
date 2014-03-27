/**
 * Converts between CWRCWriter format and XML format.
 */
define(['jquery','tinymce'], function($, tinymce) {

return function(writer) {
	var w = writer;
	
	var converter = {};
	
	
	
	/////////////////////////////////////////////////////////////////////
	// CWRCWriter -> XML Methods
	/////////////////////////////////////////////////////////////////////
	
	
	
	/**
	 * Gets the content of the document, converted from internal format to the schema format
	 * @param includeRDF True to include RDF in the header
	 * @returns {String}
	 */
	converter.getDocumentContent = function(includeRDF) {
		// remove highlights
		w.highlightEntity();
		
		var xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
		
		var body = $(w.editor.getBody());
		var clone = body.clone(false, true); // make a copy, don't clone body events, but clone child events
		_entitiesToUnicode(body);
		
		// rdf
		var rdfString = '';
		if (w.mode == w.XMLRDF && includeRDF) {
			rdfString = converter.buildAnnotations();
		}
		
//		if (w.mode == w.XMLRDF) {
			// remove the entity tags since they'll be in the rdf
//			body.find('[_entity]').remove();
//		} else {
		
			// always convert to tags, for now
			convertEntitiesToTags();
			
//		}
		
		var root = body.children('[_tag='+w.root+']');
		// make sure TEI has the right namespace for validation purposes
		if (w.root == 'TEI') {
			root.attr('xmlns','http://www.tei-c.org/ns/1.0');
		}
		var tags = _nodeToStringArray(root);
		xmlString += tags[0];
		
		var bodyString = '';
		root.contents().each(function(index, el) {
			if (el.nodeType == 1) {
				bodyString += converter.buildXMLString($(el));
			} else if (el.nodeType == 3) {
				bodyString += el.data;
			}
		});
		bodyString = bodyString.replace(/\uFEFF/g, ''); // remove characters inserted by node selecting
		
		xmlString += rdfString + bodyString;
		
		xmlString += tags[1];
		body.replaceWith(clone);
		return xmlString;
	};
	
	// gets any metadata info for the node and adds as attributes
	// returns an array of 2 strings: opening and closing tags
	function _nodeToStringArray(node) {
		var array = [];
		var id = node.attr('id');
		var tag = node.attr('_tag') || node.attr('_type');
		
		var structEntry = w.structs[id];
		var entityEntry = w.entities[id];
		if (structEntry) {
			var openingTag = '<'+tag;
			for (var key in structEntry) {
				if (key.indexOf('_') != 0) {
					var attName = key;
					if (attName == 'id') {
						// leave out IDs
//						attName = w.idName;
					} else {
						openingTag += ' '+attName+'="'+structEntry[key]+'"';
					}
				}
			}
			openingTag += '>';
			array.push(openingTag);
			array.push('</'+tag+'>');
		} else if (entityEntry) {
			array = w.entitiesModel.getMappingTags(entityEntry, w.schemaManager.schemaId);
		} else {
			// not a valid tag so return empty strings
			array = ['', ''];
		}
		
		return array;
	}
	
	/**
	 * Converts the opening and closing entity tag pairs to a matched set of opening and closing tags.
	 * @param id The entity id.
	 * @param [el] The element within which to look for the entity. Defaults to the editor dom. 
	 */
	function convertEntityToTag(id, el) {
		el = el || w.editor.getBody();
		var markers = $('[name="' + id + '"]', el);
		var start = markers[0];
		var end = markers[1];

		var nodes = [start];
		var currentNode = start;
		while (currentNode != end && currentNode != null) {
			currentNode = currentNode.nextSibling;
			nodes.push(currentNode);
		}
		
		var entString = '<entity id="'+id+'" _type="'+w.entities[id].props.type+'" />';
		$(nodes, el).wrapAll(entString);			
		$(markers, el).remove();
	}
	
	// converts the opening and closing entity tag pairs to a matched set of opening and closing tags
	function convertEntitiesToTags() {
		var body = w.editor.getBody();
		for (var id in w.entities) {
			convertEntityToTag(id, body);
		}
	}
	
	/**
	 * Converts the editor node and its contents into an XML string suitable for export.
	 * @param node A jQuery node.
	 * @returns {String}
	 */
	converter.buildXMLString = function(node) {
		var xmlString = '';
		
		function doBuild(currentNode) {
			var tags = _nodeToStringArray(currentNode);
			xmlString += tags[0];
			currentNode.contents().each(function(index, el) {
				if (el.nodeType == 1) {
					doBuild($(el));
				} else if (el.nodeType == 3) {
					xmlString += el.data;
				}
			});
			xmlString += tags[1];
		}
		
		doBuild(node);
		return xmlString;
	};
	
	converter.buildAnnotations = function() {
		var rdfString = '\n<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:w="http://cwrctc.artsrn.ualberta.ca/#">';
		
		// xml mode
		var uri = w.baseUrl+'editor/documents/'+w.currentDocId;
		rdfString += '\n<rdf:Description rdf:about="'+uri+'">\n\t<w:mode>'+w.mode+'</w:mode>\n</rdf:Description>';
		
		var offsets = _getNodeOffsetsFromRoot($(w.editor.getBody()));
		var relationships = _determineOffsetRelationships(offsets);
		
		var includeStructRDF = false;
		for (var i = 0; i < offsets.length; i++) {
			var o = offsets[i];
			if (o.entity) {
				rdfString += '\n<rdf:Description rdf:datatype="http://www.w3.org/TR/json-ld/"><![CDATA[\n';
				
				var entry = w.entities[o.id];
				
				entry.annotation.start = o.offset;
				entry.annotation.end = o.offset + o.length; 
				
				var annotation = w.entitiesModel.getAnnotation(entry.props.type, entry.annotation);
				
				// add tag attributes to annotation
				annotation.cwrcAttributes = entry.info;
				
				rdfString += JSON.stringify(annotation);
				
//				var r = relationships[o.id];
//				for (var j = 0; j < r.contains.length; j++) {
//					rdfString += '\n\t<w:contains>'+r.contains[j]+'</w:contains>';
//				}
//				for (var j = 0; j < r.overlaps.length; j++) {
//					rdfString += '\n\t<w:overlaps>'+r.overlaps[j]+'</w:overlaps>';
//				}
				
				rdfString += '\n]]></rdf:Description>';
			}
		}
		
		// triples
		for (var i = 0; i < w.triples.length; i++) {
			var t = w.triples[i];
			rdfString += '\n<rdf:Description rdf:about="'+t.subject.uri+'" w:external="'+t.subject.external+'">'+
			'\n\t<w:'+t.predicate.name+' w:text="'+t.predicate.text+'" w:external="'+t.predicate.external+'">'+
			'\n\t\t<rdf:Description rdf:about="'+t.object.uri+'" w:external="'+t.object.external+'" />'+
			'\n\t</w:'+t.predicate.name+'>'+
			'\n</rdf:Description>';
		}
		
		rdfString += '\n</rdf:RDF>\n';
		
		return rdfString;
	};
	
	/**
	 * Converts entities to unicode, while preserving those that must be escaped as entities.
	 */
	function _entitiesToUnicode(parentNode) {
		var contents = $(parentNode).contents();
		contents.each(function(index, el) {
			if (el.nodeType == Node.TEXT_NODE) {
				var nodeValue = el.nodeValue;
				if (el.nodeValue.match(/&.+?;/gim)) {
					$('#entitiesConverter')[0].innerHTML = el.nodeValue;
					nodeValue = $('#entitiesConverter')[0].innerText || $('#entitiesConverter')[0].firstChild.nodeValue;
				}
				// the following characters must be escaped
				el.nodeValue = nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			} else if (el.nodeType == Node.ELEMENT_NODE) {
				_entitiesToUnicode(el);
			}
		});
	};
	
	/**
	 * For debug
	 */
	converter.getEntityOffsets = function() {
		var body = $(w.editor.getBody());
		var offsets = _getNodeOffsetsFromRoot(body);
		var ents = [];
		for (var i = 0; i < offsets.length; i++) {
			var o = offsets[i];
			if (o.entity) {
				ents.push(o);
			}
		}
		return ents;
	};
	
	function _getNodeOffsetsFromRoot(root) {
		var currentOffset = 0;
		var offsets = [];
		function getOffsets(parent) {
			parent.contents().each(function(index, element) {
				var el = $(this);
				if (this.nodeType == Node.TEXT_NODE && this.data != ' ') {
					currentOffset += this.length;
				} else if (el.attr('_tag')) {
					var id = el.attr('id');
					offsets.push({
						id: id,
						offset: currentOffset,
						length: el.text().length
					});
					getOffsets(el);
				} else if (el.attr('_entity') && el.hasClass('start')) {
					var id = el.attr('name');
					offsets.push({
						id: id,
						offset: currentOffset,
						length: w.entities[id].props.content.length,
						entity: true
					});
				}
			});
		}
		
		getOffsets(root);
		return offsets;
	};
	
	function _determineOffsetRelationships(offsets) {
		var relationships = {};
		var entityOffsets = [];
		for (var i = 0; i < offsets.length; i++) {
			var o = offsets[i];
			if (o.entity) {
				entityOffsets.push(o);
				relationships[o.id] = {
					contains: [],
					overlaps: []
				};
			}
		}
		
		var ol = entityOffsets.length;
		for (var i = 0; i < ol; i++) {
			var o1 = entityOffsets[i];
			var span1 = o1.offset + o1.length;
			var r = relationships[o1.id];
			for (var j = 0; j < ol; j++) {
				var o2 = entityOffsets[j];
				var span2 = o2.offset + o2.length;
				if (o1.offset < o2.offset && span1 > span2) {
					r.contains.push(o2.id);
				} else if (o1.offset < o2.offset && span1 > o2.offset && span1 < span2) {
					r.overlaps.push(o2.id);
				} else if (o1.offset > o2.offset && span1 > span2 && span2 > o1.offset) {
					r.overlaps.push(o2.id);
				} else if (o1.offset < o2.offset && span1 < span2 && span1 > o2.offset) {
					r.overlaps.push(o2.id);
				}
			}
		}
		
		return relationships;
	};
	
	
	
	/////////////////////////////////////////////////////////////////////
	// XML -> CWRCWriter Methods
	/////////////////////////////////////////////////////////////////////
	
	
	
	/**
	 * Takes a document node and returns a string representation of its
	 * contents, compatible with the editor. Additionally creates w.structs
	 * entries.
	 * 
	 * @param node
	 *            An (X)HTML element
	 * @returns {String}
	 */
	converter.buildEditorString = function(node) {
		var editorString = '';
		
		function doBuild(currentNode, forceInline) {
			var tag = currentNode.nodeName;
			var jQNode = $(currentNode);
			
			// TODO ensure that block level elements aren't inside inline level elements, the inline parent will be removed by the browser
			// temp fix: force inline level for children if parent is inline
			var tagName;
			if (forceInline) {
				tagName = 'span';
			} else {
				tagName = w.utilities.getTagForEditor(tag);
			}
			
			editorString += '<'+tagName+' _tag="'+tag+'"';
			
			// create structs entries while we build the string
			var id = jQNode.attr(w.idName);
			if (id == null) {
				id = tinymce.DOM.uniqueId('struct_');
				editorString += ' id="'+id+'"';
			}
			var idNum = parseInt(id.split('_')[1]);
			if (idNum >= tinymce.DOM.counter) tinymce.DOM.counter = idNum+1;
			
			var canContainText = w.utilities.canTagContainText(tag);
			// TODO find non-intensive way to check if tags can possess attributes
			editorString += ' _textallowed="'+canContainText+'"';
			
			w.structs[id] = {
				id: id,
				_tag: tag,
				_textallowed: canContainText
			};
			$(currentNode.attributes).each(function(index, att) {
				var attName = att.name;
				if (attName == w.idName) attName = 'id';
				w.structs[id][attName] = att.value;
				
				// TODO consider adding in all attributes here to expand CSS options
				
				if (attName == 'id' || attName.match(/^_/) != null) {
					editorString += ' '+attName+'="'+att.value+'"';
				}
			});
			editorString += '>';
			
			var isInline = forceInline || !w.utilities.isTagBlockLevel(tag);
			
			jQNode.contents().each(function(index, el) {
				if (el.nodeType == 1) {
					doBuild(el, isInline);
				} else if (el.nodeType == 3) {
					editorString += el.data;
				}
			});
			
			editorString += '</'+tagName+'>';
		}
		
		doBuild(node, false);
		return editorString;
	};
	
	/**
	 * Processes a document and loads it into the editor.
	 * @param doc An XML DOM
	 */
	converter.processDocument = function(doc) {
		var rootName = doc.firstChild.nodeName;
		// TODO need a better way of tying this to the schemas config
		// grab the schema from xml-model
		if (rootName == 'xml-model') {
			var xmlModelData = doc.firstChild.data;
			var schemaUrl = xmlModelData.match(/href="([^"]*)"/)[1];
			var urlParts = schemaUrl.match(/^(.*):\/\/([a-z\-.]+)(?=:[0-9]+)?\/(.*)/);
			var fileName = urlParts[3];
			var schemaId = '';
			if (fileName.indexOf('events') != -1) {
				schemaId = 'events';
			} else if (fileName.toLowerCase().indexOf('biography') != -1) {
				schemaId = 'biography';
			} else if (fileName.toLowerCase().indexOf('writing') != -1) {
				schemaId = 'writing';
			} else if (fileName.toLowerCase().indexOf('tei') != -1) {
				schemaId = 'tei';
			} else {
				schemaId = 'customSchema';
				w.schemaManager.schemas.customSchema = {
					name: 'Custom Schema',
					url: schemaUrl
				};
			}
			w.schemaManager.loadSchema(schemaId, false, function() {
				doProcessing(doc);
			});
		// determine the schema based on the root element
		} else {
			rootName = rootName.toLowerCase();
			if (rootName != w.root.toLowerCase()) {
				// roots don't match so load the appropriate schema
				var schemaId = 'tei';
				if (rootName == 'events') {
					schemaId = 'events';
				} else if (rootName == 'biography') {
					schemaId = 'biography';
				} else if (rootName == 'writing') {
					schemaId = 'writing';
				}
				w.schemaManager.loadSchema(schemaId, false, function() {
					doProcessing(doc);
				});
			} else {
				doProcessing(doc);
			}
		}
	};
	
	function processRdf(rdfs, offsets) {
		rdfs.children().each(function() {
			var rdf = $(this);

			if (rdf.attr('rdf:datatype') == 'http://www.w3.org/TR/json-ld/') {
				var entity = JSON.parse(rdf.text());
				if (entity != null) {
					
					var id = tinymce.DOM.uniqueId('ent_');
					var offset = entity.hasTarget.hasSelector.start;
					var length = entity.hasTarget.hasSelector.end - offset;
					
					offsets.push({
						id: id,
						offset: offset,
						length: length
					});
					
					// determine the entity type
					// TODO will need better way of doing this
					var type;
					var typeArray = entity.hasBody['@type'];
					for (var i = 0; i < typeArray.length; i++) {
						var t = typeArray[i];
						if (t.indexOf('SemanticTag') == -1) {
							t = t.split(':')[1];
							type = t.toLowerCase();
						}
					}
					
					w.entities[id] = {
						props: {
							id: id,
							type: type
						},
						info: entity.cwrcAttributes
					};
//					rdf.children('[type="props"]').each(function(i2, el2) {
//						var key = $(this)[0].nodeName.split(':')[1].toLowerCase();
//						var prop = $(this).text();
//						if (key == 'content') {
//							var title = w.utilities.getTitleFromContent(prop);
//							w.entities[id]['props']['title'] = title;
//						}
//						w.entities[id]['props'][key] = prop;
//					});
				} else {
					// struct
				}
				
			// triple
			} else if (rdf.attr('rdf:about')){
				var subject = $(this);
				var subjectUri = subject.attr('rdf:about');
				var predicate = rdf.children().first();
				var object = rdf.find('rdf\\:Description, Description');
				var objectUri = object.attr('rdf:about');
				
				if (w.entities[subjectUri] != null && w.entities[objectUri] != null) {
					var triple = {
						subject: {
							uri: subjectUri,
							text: subject.attr('w:external') == 'false' ? w.entities[subjectUri].props.title : subjectUri,
							external: subject.attr('w:external, external')
						},
						predicate: {
							text: predicate.attr('w:text'),
							name: predicate[0].nodeName.split(':')[1].toLowerCase(),
							external: predicate.attr('w:external')
						},
						object: {
							uri: objectUri,
							text: object.attr('w:external') == 'false' ? w.entities[objectUri].props.title : objectUri,
							external: object.attr('w:external')
						}
					};
					w.triples.push(triple);
				}
			}
		});
	}
	
	/**
	 * Recursively builds offset info from entity tags.
	 */
	function processEntities(parent, offsets) {
		var currentOffset = 0;
		parent.contents().each(function(index, element) {
			if (this.nodeType == Node.TEXT_NODE) {
				currentOffset += this.length;
			} else if (w.entitiesModel.isEntity(this.nodeName.toLowerCase())) {
				var ent = $(this);
				var id = ent.attr(w.idName);
				if (id == null) {
					id = tinymce.DOM.uniqueId('ent_');
				}
				offsets.push({
					id: id,
					parent: $(parent).attr(w.idName),
					offset: currentOffset,
					length: ent.text().length
				});
				
				var content = ent.text();
				w.entities[id] = {
					props: {
						id: id,
						type: this.nodeName.toLowerCase(),
						content: content,
						title: w.utilities.getTitleFromContent(content)
					},
					info: {}
				};
				$(this.attributes).each(function(index, att) {
					w.entities[id].info[att.name] = att.value;
				});
				
				ent.contents().unwrap();
				
				currentOffset += content.length;
			} else {
				processEntities($(this), offsets);
			}
		});
	}
	
	function doProcessing(doc) {
		// reset the stores
		w.entities = {};
		w.structs = {};
		w.triples = [];
		w.deletedEntities = {};
		w.deletedStructs = {};
		
		var offsets = [];
		
		var docMode;
		var rdfs = $(doc).find('rdf\\:RDF, RDF');

		if (rdfs.length) {
			var mode = parseInt(rdfs.find('w\\:mode, mode').first().text());
			if (mode == w.XML) {
				docMode = w.XML;
			} else {
				docMode = w.XMLRDF;
			}
		} else {
			docMode = w.XML;
		}
		
		if (w.mode != docMode) {
			var editorModeStr = w.mode == w.XML ? 'XML only' : 'XML & RDF';
			var docModeStr = docMode == w.XML ? 'XML only' : 'XML & RDF';

			w.dialogManager.show('message', {
				title: 'Editor Mode changed',
				msg: 'The Editor Mode ('+editorModeStr+') has been changed to match the Document Mode ('+docModeStr+').',
				type: 'info'
			});
			
			w.mode = docMode;
		}
		
		// process RDF and/or entities
		if (docMode == w.XMLRDF) {
			processRdf(rdfs, offsets);
			$(doc).find('rdf\\:RDF, RDF').remove();
		} else {
			processEntities($(doc.firstChild), offsets);
		}

		// FIXME temp fix until document format is correct
		var root = $(w.root+', '+w.root.toLowerCase(), doc)[0];
		
		var editorString = converter.buildEditorString(root);
		w.editor.setContent(editorString);
		
		// editor needs focus in order for entities to be properly inserted
		w.editor.focus();
		
		// insert entities
		var id, o, parent, contents, lengthCount, match, startOffset, endOffset, startNode, endNode;
		for (var i = 0; i < offsets.length; i++) {
			startNode = null;
			endNode = null;
			startOffset = 0;
			endOffset = 0;
			
			o = offsets[i];
			id = o.id;
			
			// method #1: have parent id and offset is relative to that
			if (o.parent && o.parent != '') {
				parent = w.editor.$('#'+o.parent);
				
				// get all text nodes
				contents = parent.contents().filter(function() {
					return this.nodeType == Node.TEXT_NODE;
				});
				
				startOffset = o.offset;
				lengthCount = 0;
				match = false;
				startNode = contents.filter(function() {
					if (!match) {
						lengthCount += this.length;
						if (lengthCount > o.offset) {
							match = true;
							return true;
						} else {
							startOffset -= this.length;
						}
					}
					return false;
				})[0];
				
				endOffset = o.offset+o.length;
				lengthCount = 0;
				match = false;
				endNode = contents.filter(function() {
					if (!match) {
						lengthCount += this.length;
						if (lengthCount >= o.offset+o.length) {
							match = true;
							return true;
						} else {
							endOffset -= this.length;
						}
					}
					return false;
				})[0];
			
			// method #2: offset is relative to the document root
			} else {
				parent = $(w.editor.getBody());
				var currentOffset = 0;
				function getNodes(parent) {
					parent.contents().each(function(index, element) {
						if (this.nodeType == Node.TEXT_NODE && this.data != ' ') {
							currentOffset += this.length;
							if (currentOffset > o.offset && startNode == null) {
								startNode = this;
								startOffset = o.offset - (currentOffset - this.length);
							}
							
							if (currentOffset >= o.offset + o.length && endNode == null) {
								endNode = this;
								endOffset = startOffset + o.length;
							}
						} else if ($(this).attr('_tag')) {
							getNodes($(this));
						}
						if (startNode != null && endNode != null) {
							return false;
						}
					});
				}
				
				getNodes(parent);
			}
			
			if (startNode != null && endNode != null) {
				var range = w.editor.selection.getRng(true);
				var entry = w.entities[id];
				try {
					range.setStart(startNode, startOffset);
					range.setEnd(endNode, endOffset);
					w.tagger.insertBoundaryTags(id, entry.props.type, range);
					if (entry.props.content == null) {
						// get and set the text content
						w.highlightEntity(id);
						var content = $('#entityHighlight', w.editor.getBody()).text();
						w.highlightEntity();
						entry.props.content = content;
						entry.props.title = w.utilities.getTitleFromContent(content);
					}
				} catch (e) {
				}
			}
		}
		
		w.event('documentLoaded').publish();
		
		// try putting the cursor in the body
		window.setTimeout(function() {
			var bodyTag = $('[_tag='+w.header+']', w.editor.getBody()).next()[0];
			if (bodyTag != null) {
				w.editor.selection.select(bodyTag);
				w.editor.selection.collapse(true);
				w._fireNodeChange(bodyTag);
			}
		}, 50);
		
		// reset the undo manager
		w.editor.undoManager.clear();
	}
	
	return converter;
};

});