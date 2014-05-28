/**
 * Converts between CWRCWriter format and XML format.
 */
define(['jquery','tinymce'], function($, tinymce) {

return function(writer) {
	var w = writer;
	
	$(document.body).append(''+
		'<div id="entitiesConverter"></div>' // used by _htmlEntitiesToUnicode
	);
	
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
		
		_htmlEntitiesToUnicode(body);
		
		// rdf
//		var rdfString = '';
//		if (w.mode == w.XMLRDF && includeRDF) {
//			rdfString = buildAnnotations();
//		}
		
//		if (w.mode == w.XMLRDF) {
			// remove the entity tags since they'll be in the rdf
//			body.find('[_entity]').remove();
//		} else {
		
		
		// always convert to tags, for now
		
		// get the entity IDs, in order that they appear in the document
		// have to be order so that conversion and overlapping is done properly
		var entNodes = $('[_entity]', writer.editor.getBody()).filter(function() {
			return $(this).hasClass('start');
		});
		var entIds = $.map(entNodes, function(val, index) {
			return $(val).attr('name');
		});
		
		var overlappingEntities = [];
		$.each(entIds, function(index, id) {
			var success = convertEntityToTag(id, body[0]);
			if (!success) {
				overlappingEntities.push(id);
			}
		});
			
//		}
		
		var rdfString = '';
		if (includeRDF) {
			rdfString = buildAnnotations();
		}
		
		
		var root = body.children('[_tag='+w.root+']');
		// make sure TEI has the right namespace for validation purposes
		if (w.root == 'TEI') {
			var struct = w.structs[root.attr('id')];
			// add them to the structs entry and they'll get added to the markup later
			struct['xmlns'] = 'http://www.tei-c.org/ns/1.0';
			struct['xmlns:rdf'] = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
			struct['xmlns:w'] = 'http://cwrctc.artsrn.ualberta.ca/#';
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
	
	/**
	 * Converts the opening and closing entity tag pairs to a matched set of opening and closing tags.
	 * @param id The entity id.
	 * @param [el] The element within which to look for the entity. Defaults to the editor dom.
	 * @returns {Boolean} true if successful, false if overlapping
	 */
	function convertEntityToTag(id, el) {
		el = el || w.editor.getBody();
		var markers = $('[name="' + id + '"]', el);
		var start = markers[0];
		var end = markers[1];

		var overlap = true;
		var nodes = [start];
		var currentNode = start;
		while (currentNode != end && currentNode != null) {
			currentNode = currentNode.nextSibling;
			nodes.push(currentNode);
			if (currentNode == end) {
				overlap = false; // we've used nextSibling to reach the end so there's no overlap
			}
		}
		
		if (overlap) {
			return false;
		} else {
			var type = w.entities[id].props.type;
			var tag = w.entitiesModel.getParentTag(type, w.schemaManager.schemaId);
			var entString = '<entity id="'+id+'" _type="'+type+'" _tag="'+tag+'"/>';
			$(nodes, el).wrapAll(entString);			
			$(markers, el).remove();
			
			return true;
		}
	}
	
	// gets any metadata info for the node and adds as attributes
	// returns an array of 2 strings: opening and closing tags
	function _nodeToStringArray(node) {
		var array = [];
		var id = node.attr('id');
		var tag = node.attr('_tag');
		
		var structEntry = w.structs[id];
		var entityEntry = w.entities[id];
		if (structEntry) {
			var openingTag = '<'+tag;
			var cwrcAnnotationId = node[0].getAttribute('annotationId');
			if (cwrcAnnotationId != null) {
				openingTag += ' annotationId="'+cwrcAnnotationId+'"';
			}
			var cwrcOffsetId = node[0].getAttribute('offsetId');
			if (cwrcOffsetId != null) {
				openingTag += ' offsetId="'+cwrcOffsetId+'"';
			}
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
		} else if (entityEntry && tag) {
			array = w.entitiesModel.getMappingTags(entityEntry, w.schemaManager.schemaId);
		} else {
			// not a valid tag so return empty strings
			array = ['', ''];
		}
		
		return array;
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
	
	function buildAnnotations() {
		var rdfString = '\n<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:w="http://cwrctc.artsrn.ualberta.ca/#">';
		
		// xml mode
		var uri = w.baseUrl+'editor/documents/'+w.currentDocId;
		rdfString += '\n<rdf:Description rdf:about="'+uri+'">\n\t<w:mode>'+w.mode+'</w:mode>\n</rdf:Description>';
		
		var body = w.editor.getBody();
		for (var key in w.entities) {
			var entry = w.entities[key];
			
			rdfString += '\n<rdf:Description rdf:datatype="http://www.w3.org/TR/json-ld/"><![CDATA[\n';
			
			var annotation = getAnnotationForEntity(key);
			
			// add tag attributes to annotation
			annotation.cwrcAttributes = entry.info;
			// TODO save type differently
			annotation.cwrcType = entry.props.type;
			
			rdfString += JSON.stringify(annotation, null, '\t');
			
			rdfString += '\n]]></rdf:Description>';
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
	}
	
	// sets annotation info in the entity entry, and returns a string representation of it
	// must call after convertEntityToTag
	function getAnnotationForEntity(entityId) {
		var body = w.editor.getBody();
		var entry = w.entities[entityId];
		
		var range = {};
		
		var entity = $('#'+entityId, body);
		if (entity.length === 0) {
			// overlap, get xpaths for start and end
			var entitySpans = $('[name="'+entityId+'"]', body);
			var entityStart = entitySpans[0];
			var entityEnd = entitySpans[1];
			
			var startId = entityStart.parentNode.getAttribute('id');
			if (startId == null) {
				startId = tinymce.DOM.uniqueId('struct_');
			} else if (w.entities[startId] != null) {
				w.entities[startId].annotation.range.cwrcOffsetId = startId;
			}
			entityStart.parentNode.setAttribute('offsetId', startId);
			range.start = '//'+entityStart.parentNode.getAttribute('_tag')+'[@offsetId="'+startId+'"]';
			range.startOffset = _getOffsetFromParentForEntity(entityId, $(entityStart.parentNode));
			
			var endId = entityEnd.parentNode.getAttribute('id');
			if (endId == null) {
				endId = tinymce.DOM.uniqueId('struct_');
			} else if (w.entities[endId] != null) {
				w.entities[endId].annotation.range.cwrcOffsetId = endId;
			}
			entityEnd.parentNode.setAttribute('offsetId', endId);
			range.end = '//'+entityEnd.parentNode.getAttribute('_tag')+'[@offsetId="'+endId+'"]';
			range.endOffset = _getOffsetFromParentForEntity(entityId, $(entityEnd.parentNode));
		} else {
			// get the xpath for the entity's tag
			entity[0].setAttribute('annotationId', entityId);
			range.start = '//'+entity[0].getAttribute('_tag')+'[@annotationId="'+entityId+'"]';
			range.cwrcAnnotationId = entityId;
		}
		
		$.extend(entry.annotation.range, range);
		
		var annotation = w.entitiesModel.getAnnotation(entry.props.type, entry);
		return annotation;
	}
	
	/**
	 * Converts HTML entities to unicode, while preserving those that must be escaped as entities.
	 */
	function _htmlEntitiesToUnicode(parentNode) {
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
				_htmlEntitiesToUnicode(el);
			}
		});
	};
	
	/**
	 * For debug
	 */
	converter.getEntityOffsets = function() {
		var body = $(w.editor.getBody());
		var offsets = _getNodeOffsetsFromParent(body);
		var ents = [];
		for (var i = 0; i < offsets.length; i++) {
			var o = offsets[i];
			if (o.entity) {
				ents.push(o);
			}
		}
		return ents;
	};
	
	/**
	 * Get character offsets for a node.
	 * @param {Node} parent The node to start calculating offsets from.
	 * @returns Array
	 */
	function _getNodeOffsetsFromParent(parent) {
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
		
		getOffsets(parent);
		return offsets;
	};
	
	/**
	 * Gets the character offset for an entity boundary marker, starting from the parent.
	 * @param {String} id The entity ID
	 * @param {jQuery} [parent] The node to start calculating the offset from
	 * @returns {Integer}
	 */
	function _getOffsetFromParentForEntity(id, parent) {
		var currentOffset = 0;
		var offset = 0;
		function getOffset(parent) {
			parent.contents().each(function(index, element) {
				var el = $(this);
				if (this.nodeType == Node.TEXT_NODE && this.data != ' ') {
					currentOffset += this.length;
				} else if (el.attr('name') == id) {
					offset = currentOffset;
					return false;
				}
			});
		}
		
		getOffset(parent);
		return offset;
	}
	
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
	
	function doProcessing(doc) {
		// reset the stores
		w.entities = {};
		w.structs = {};
		w.triples = [];
		w.deletedEntities = {};
		w.deletedStructs = {};
		
		var rdfs = $(doc).find('rdf\\:RDF, RDF');

		if (rdfs.length) {
			var mode = parseInt(rdfs.find('w\\:mode, mode').first().text());
			if (mode == w.XML) {
				w.mode = w.XML;
			} else {
				w.mode = w.XMLRDF;
			}
			processRdf(rdfs);
		} else {
			w.mode = w.XML;
		}
		
		// process RDF and/or entities
		// TODO add processEntities back in
		//if (w.mode == w.XMLRDF) {
		//	processRdf(rdfs);
		//} else {
		//	processEntities($(doc.firstChild));
		//}
		$(doc).find('rdf\\:RDF, RDF').remove();

		// FIXME temp fix until document format is correct
		var root = $(w.root+', '+w.root.toLowerCase(), doc)[0];
		
		var editorString = converter.buildEditorString(root);
		w.editor.setContent(editorString);
		
		insertEntities();
		
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
		
//		var msg;
//		if (w.mode == w.XML) {
//			msg = 'This document is set to edit in XML (no overlap) mode: XML and RDF will be created with no overlapping annotations.';
//		} else {
//			msg = 'This document is set to edit in XML and RDF (overlapping entities) mode; XML and RDF will be kept in sync where possible, but where overlap occurs RDF will be created without corresponding XML.';
//		}
//		
//		w.dialogManager.show('message', {
//			title: 'CWRC-Writer Mode',
//			msg: msg,
//			type: 'info'
//		});
	}
	
	function processRdf(rdfs) {
		var doc = rdfs.parents().last()[0].parentNode;
		
		var nsr = doc.createNSResolver(doc.documentElement);
		var defaultNamespace = doc.documentElement.getAttribute('xmlns');
		
		function nsResolver(prefix) {
			return nsr.lookupNamespaceURI(prefix) || defaultNamespace;
		}
		
		rdfs.children().each(function() {
			var rdf = $(this);

			if (rdf.attr('rdf:datatype') == 'http://www.w3.org/TR/json-ld/') {
				var entity = JSON.parse(rdf.text());
				if (entity != null) {
					
					var id = tinymce.DOM.uniqueId('ent_');
					w.entities[id] = {
						props: {
							id: id,
							type: entity.cwrcType
						},
						info: entity.cwrcAttributes,
						annotation: {}
					};
					
					// parse the xpointer, get the el associated with the xpath, assign a temp. ID for later usage
					// expected format: xpointer(string-range(XPATH,"",OFFSET))
					// regex assumes no parentheses in xpath
					function parseXpointer(xpointer, doc) {
						var regex = new RegExp(/xpointer\((?:string-range\()?([^\)]*)\)+/); // regex for isolating xpath and offset
						var content = regex.exec(xpointer)[1];
						var parts = content.split(',');
						
						var xpath = parts[0];
						var foopath = xpath.replace(/\/\//g, '//foo:'); // default namespace hack (http://stackoverflow.com/questions/9621679/javascript-xpath-and-default-namespaces)
//						foopath = foopath.replace(/\//g, '/foo:');
						var result = doc.evaluate(foopath, doc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
						if (result.singleNodeValue != null) {
							var xpathEl = $(result.singleNodeValue);
							
							var parentId = xpathEl.attr('cwrcStructId');
							if (parentId == null) {
								// assign a struct ID now, to associate with the entity
								// later we'll insert it as the real struct ID value
								parentId = tinymce.DOM.uniqueId('struct_');
								xpathEl.attr('cwrcStructId', parentId);
							}
							
							var offset = null;
							if (parts[2]) {
								offset = parseInt(parts[2]);
							}
							
							return {
								xpath: xpath,
								el: xpathEl,
								parentId: parentId,
								offset: offset
							};
						} else {
							if (window.console) {
								console.warn('Could not find node for: '+xpath);
							}
							return null;
						}
					}
					
					var selector = entity.hasTarget.hasSelector;
					if (selector['@type'] == 'oa:TextPositionSelector') {
						var xpointerStart = selector['oa:start'];
						var xpointerEnd = selector['oa:end'];
						var xpathStart = parseXpointer(xpointerStart, doc);
						var xpathEnd = parseXpointer(xpointerEnd, doc);
						
						if (xpathStart != null && xpathEnd != null) {
							w.entities[id].annotation = {
								range: {
									id: id,
									parentStart: xpathStart.parentId,
									start: xpathStart.xpath,
									startOffset: xpathStart.offset,
									parentEnd: xpathEnd.parentId,
									end: xpathEnd.xpath,
									endOffset: xpathEnd.offset
								}
							};
						}
					} else if (selector['@type'] == 'oa:FragmentSelector') {
						var xpointer = selector['rdf:value'];
						var xpathObj = parseXpointer(xpointer, doc);
						
						if (xpathObj != null) {
							w.entities[id].annotation = {
								range: {
									id: id,
									parentStart: xpathObj.parentId,
									start: xpathObj.xpath
								}
							};
						}
					}
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
	function processEntities(parent) {
		// TODO update this function
		var currentOffset = 0;
		parent.contents().each(function(index, element) {
			if (this.nodeType == Node.TEXT_NODE) {
				currentOffset += this.length;
			} else {
				var entityType = w.entitiesModel.getEntityTypeForTag(this.nodeName.toLowerCase(), w.schemaManager.schemaId);
				if (entityType != null) {
					var ent = $(this);
					var id = ent.attr(w.idName);
					if (id == null) {
						id = tinymce.DOM.uniqueId('ent_');
					}
					
					var content = ent.text();
					w.entities[id] = {
						props: {
							id: id,
							type: entityType,
							content: content,
							title: w.utilities.getTitleFromContent(content)
						},
						info: {},
						annotation: {
							range: {
								id: id,
								parentStart: $(parent).attr(w.idName),
								startOffset: currentOffset,
								length: ent.text().length
							}
						}
					};
					$(this.attributes).each(function(index, att) {
						w.entities[id].info[att.name] = att.value;
					});
					
//					ent.contents().unwrap();
					
//					processEntities(ent);
					
					currentOffset += content.length;
				} else {
					processEntities($(this));
				}
			}
		});
	}
	
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
			
			var isEntity = jQNode.attr('annotationId') != null; // temp entity tag needs to be inline, otherwise spaces around entity text will disappear
			var tagName;
			if (forceInline || isEntity) {
				tagName = 'span';
			} else {
				tagName = w.utilities.getTagForEditor(tag);
			}
			
			editorString += '<'+tagName+' _tag="'+tag+'"';
			
			// create structs entries while we build the string
			
			// determine the ID
			// first check the ID attribute, then our special cwrcStructId attribute, finally generate a new one
			var id = jQNode.attr(w.idName);
			if (id == null) {
				id = jQNode.attr('cwrcStructId');
				jQNode.removeAttr('cwrcStructId');
				if (id == null) {
					id = tinymce.DOM.uniqueId('struct_');
				}
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
				if (attName === 'annotationId') {
					editorString += ' annotationId="'+att.value+'"';
				} else if (attName === 'offsetId') {
					editorString += ' offsetId="'+att.value+'"';
				} else {
					w.structs[id][attName] = att.value;
				}
				
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
	
	function insertEntities() {
		// editor needs focus in order for entities to be properly inserted
		w.editor.focus();
		
		var entityNodes = []; // keep track of the nodes so we can remove them afterwards
		
		var body = w.editor.getBody();
		// insert entities
		var entry, range, parent, contents, lengthCount, match, matchingNode, startOffset, endOffset, startNode, endNode;
		for (var id in w.entities) {
			matchingNode = null;
			startNode = null;
			endNode = null;
			startOffset = 0;
			endOffset = 0;
			
			entry = w.entities[id];
			range = entry.annotation.range;
			
			if (range != null) {
				// just rdf, no markup
				if (range.parentEnd) {
					var parent = $('#'+range.parentStart, body);
					var result = _getTextNodeFromParentAndOffset(parent, range.startOffset);
					startNode = result.textNode;
					startOffset = result.offset;
					parent = $('#'+range.parentEnd, body);
					result = _getTextNodeFromParentAndOffset(parent, range.endOffset);
					endNode = result.textNode;
					endOffset = result.offset;
				// markup
				} else if (range.parentStart) {
					var entityNode = $('#'+range.parentStart, body);
					startNode = entityNode[0].previousSibling;
					if (startNode != null) {
						if (startNode.nodeType === Node.TEXT_NODE) {
							startOffset = startNode.length;
						} else if (startNode.nodeType === Node.ELEMENT_NODE) {
							startOffset = 0;
						}
					} else {
						startNode = entityNode[0];
						startOffset = 0;
					}
					endNode = entityNode[0].nextSibling;
					if (endNode != null) {
						endOffset = 0;
					} else {
						endNode = entityNode[0];
						endOffset = endNode.childNodes.length;
					}
					
					entityNodes.push(entityNode);
				}
			}
			
			if (startNode != null && endNode != null) {
				var range = w.editor.selection.getRng(true);
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
					if (window.console) {
						console.log(e);
					}
				}
			}
		}
		
		// TODO figure out how to not remove all correction entity markup
		// remove all the entity markup
		$.each(entityNodes, function(index, node) {
			var id = $(node).attr('annotationId');
			
			var tag = $(node).attr('_tag');
			var type = w.entitiesModel.getEntityTypeForTag(tag, w.schemaManager.schemaId);
			var textTag = w.entitiesModel.getTextTag(type, w.schemaManager.schemaId);
			if (textTag != '') {
				$('[_tag="'+textTag+'"]', node).contents().unwrap(); // keep the text inside the textTag
			}
			
			$('[annotationId="'+id+'"]', node).remove(); // remove all child elements with matching ID
			$(node).contents().unwrap();
		});
	}
	
	function _getTextNodeFromParentAndOffset(parent, offset) {
		var currentOffset = 0;
		var textNode = null;
		function getTextNode(parent) {
			parent.contents().each(function(index, element) {
				if (this.nodeType == Node.TEXT_NODE && this.data != ' ') {
					currentOffset += this.length;
					if (currentOffset >= offset) {
						currentOffset = offset - (currentOffset - this.length);
						textNode = this;
						return false;
					}
				}
			});
		}
		
		getTextNode(parent);
		
		return {
			textNode: textNode,
			offset: currentOffset
		};
	}
	
	return converter;
};

});