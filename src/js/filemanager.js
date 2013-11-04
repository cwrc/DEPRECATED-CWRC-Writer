/**
 * Contains the load and save dialogs, as well as file related functions.
 */
function FileManager(config) {
	
	var w = config.writer;
	
	$(document.body).append(''+
		'<div id="entitiesConverter"></div>'+
		'<div id="editSourceDialog">'+
			'<textarea style="width: 100%; height: 98%;"></textarea>'+
		'</div>'
		//'<iframe id="editDocLoader" style="display: none;"></iframe>'
	);
	
	var edit = $('#editSourceDialog');
	edit.dialog({
		title: 'Edit Source',
		modal: true,
		resizable: true,
		closeOnEscape: true,
		height: 480,
		width: 640,
		autoOpen: false,
		buttons: {
			'Ok': function() {
				var newDocString = $('textarea', edit).val();
				var xmlDoc = w.u.stringToXML(newDocString);
				fm.loadDocumentFromXml(xmlDoc);
				edit.dialog('close');
			},
			'Cancel': function() {
				edit.dialog('close');
			}
		}
	});
	
	var fm = {};
	
	/**
	 * @memberOf fm
	 */
	fm.newDocument = function() {
		if (w.editor.isDirty()) {
			w.dialogs.filemanager.showUnsaved();
		} else {
			window.location = 'index.htm';
		}
	};
	
	fm.saveDocument = function() {
		if (w.currentDocId == null) {
			w.dialogs.filemanager.showSaver();
		} else {
			w.delegator.validate(function (valid) {
				if (valid) {
					w.delegator.saveDocument();
				} else {
					var doc = w.currentDocId;
					if (doc == null) doc = 'The current document';
					w.dialogs.confirm({
						title: 'Document Invalid',
						msg: doc+' is not valid. <b>Save anyways?</b>',
						callback: function(yes) {
							if (yes) {
								w.delegator.saveDocument();
							}
						}
					});
				}
			});
		}
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
					if (attName == 'id') attName = w.idName;
					openingTag += ' '+attName+'="'+structEntry[key]+'"';
				}
			}
			openingTag += '>';
			array.push(openingTag);
			array.push('</'+tag+'>');
		} else if (entityEntry) {
			array = w.em.getMappingTags(entityEntry, w.schemaId);
		} else {
			// not a valid tag so return empty strings
			array = ['', ''];
		}
		
		return array;
	}
	
	// converts the opening and closing entity tag pairs to a matched set of opening and closing tags
	function convertEntitiesToTags() {
		for (var id in w.entities) {
			var markers = w.editor.dom.select('[name="' + id + '"]');
			var start = markers[0];
			var end = markers[1];

			var nodes = [ start ];
			var currentNode = start;
			while (currentNode != end && currentNode != null) {
				currentNode = currentNode.nextSibling;
				nodes.push(currentNode);
			}
			
			var entString = '<entity id="'+id+'" _type="'+w.entities[id].props.type+'" />';
			w.editor.$(nodes).wrapAll(entString);			
			w.editor.$(markers).remove();
		}
	}
	
	/**
	 * Converts the editor node and its contents into an XML string suitable for export.
	 * @param node A jQuery node.
	 * @returns {String}
	 */
	fm.buildXMLString = function(node) {
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
	
	/**
	 * Gets the content of the document, converted from internal format to the schema format
	 * @param includeRDF True to include RDF in the header
	 * @returns {String}
	 */
	fm.getDocumentContent = function(includeRDF) {
		// remove highlights
		w.highlightEntity();
		
		var xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
		
		var body = $(w.editor.getBody());
		var clone = body.clone(false, true); // make a copy, don't clone body events, but clone child events
<<<<<<< HEAD
=======
		
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
		_entitiesToUnicode(body);
		
		// rdf
		var rdfString = '';
		if (w.mode == w.XMLRDF && includeRDF) {
			rdfString = '\n<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:w="http://cwrctc.artsrn.ualberta.ca/#">';
			
			// xml mode
			var uri = w.baseUrl+'editor/documents/'+w.currentDocId;
			rdfString += '\n<rdf:Description rdf:about="'+uri+'">\n\t<w:mode>'+w.mode+'</w:mode>\n</rdf:Description>';
			
			var offsets = _getNodeOffsetsFromRoot(body);
			var relationships = _determineOffsetRelationships(offsets);
			
			// entity and struct listings
			var includeStructRDF = false;
			for (var i = 0; i < offsets.length; i++) {
				var o = offsets[i];
				if (includeStructRDF || o.entity) {
					rdfString += '\n<rdf:Description rdf:ID="'+o.id+'">';
					var key;
					for (key in o) {
						rdfString += '\n\t<w:'+key+' type="offset">'+o[key]+'</w:'+key+'>';
					}
					if (o.entity) {
						var entry = w.entities[o.id];
						rdfString += '\n\t<w:type type="props">'+entry.props.type+'</w:type>';
						rdfString += '\n\t<w:content type="props">'+entry.props.content+'</w:content>';
						for (key in entry.info) {
							rdfString += '\n\t<w:'+key+' type="info">'+entry.info[key]+'</w:'+key+'>';
						}
						
						var r = relationships[o.id];
						for (var j = 0; j < r.contains.length; j++) {
							rdfString += '\n\t<w:contains>'+r.contains[j]+'</w:contains>';
						}
						for (var j = 0; j < r.overlaps.length; j++) {
							rdfString += '\n\t<w:overlaps>'+r.overlaps[j]+'</w:overlaps>';
						}
					}
					rdfString += '\n</rdf:Description>';
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
		}
		
		if (w.mode == w.XMLRDF) {
			// remove the entity tags since they'll be in the rdf
			body.find('[_entity]').remove();
		} else {
			convertEntitiesToTags();
		}
		
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
				bodyString += fm.buildXMLString($(el));
			} else if (el.nodeType == 3) {
				bodyString += el.data;
			}
		});
<<<<<<< HEAD
=======
		bodyString = bodyString.replace(/\uFEFF/g, ''); // remove characters inserted by node selecting
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
		
		xmlString += rdfString + bodyString;
		
		xmlString += tags[1];
<<<<<<< HEAD
=======
		
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
		body.replaceWith(clone);
		return xmlString;
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
	
<<<<<<< HEAD
=======
	/**
	 * For debug
	 */
	fm.getEntityOffsets = function() {
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
	
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
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
	
	fm.loadDocument = function(docName) {
		w.currentDocId = docName;
		w.delegator.loadDocument(fm.processDocument);
	};
	
	/**
	 * Loads a document into the editor
	 * @param docUrl An URL pointing to an XML document
	 */
	fm.loadDocumentFromUrl = function(docUrl) {
		w.currentDocId = docUrl;
		
		$.ajax({
			url: docUrl,
			type: 'GET',
<<<<<<< HEAD
			dataType: 'xml',
			success: function(doc, status, xhr) {
				window.location.hash = '';
				fm.loadDocumentFromXml(doc);
=======
			success: function(doc, status, xhr) {
				window.location.hash = '';
				fm.processDocument(doc);
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
			},
			error: function(xhr, status, error) {
				w.currentDocId = null;
				w.dialogs.show('message', {
					title: 'Error',
					msg: 'An error ('+status+') occurred and '+docUrl+' was not loaded.',
					type: 'error'
				});
			},
			dataType: 'xml'
		});
	};
	
	/**
	 * Loads a document into the editor.
	 * @param docXml An XML DOM
	 */
	fm.loadDocumentFromXml = function(docXml) {
		window.location.hash = '';
		fm.processDocument(docXml);
	};
	
	/**
	 * Takes a document node and returns a string representation of its
	 * contents, compatible with the editor. Additionally creates w.structs
	 * entries.
	 * 
	 * @param node
	 *            An (X)HTML element
	 * @returns {String}
	 */
	fm.buildEditorString = function(node) {
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
				tagName = w.u.getTagForEditor(tag);
			}
			
			editorString += '<'+tagName+' _tag="'+tag+'"';
			
			// create structs entries while we build the string
			var id = jQNode.attr(w.idName);
			if (id == null) {
				id = tinymce.DOM.uniqueId('struct_');
				editorString += ' id="'+id+'"';
			}
			var idNum = parseInt(id.split('_')[1]);
<<<<<<< HEAD
			if (idNum > tinymce.DOM.counter) tinymce.DOM.counter = idNum;
			
			var canContainText = w.u.canTagContainText(tag);
=======
			if (idNum >= tinymce.DOM.counter) tinymce.DOM.counter = idNum+1;
			
			var canContainText = w.u.canTagContainText(tag);
			// TODO find non-intensive way to check if tags can possess attributes
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
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
				if (attName == 'id' || attName.match(/^_/) != null) {
					editorString += ' '+attName+'="'+att.value+'"';
				}
			});
			editorString += '>';
			
			var isInline = forceInline || !w.u.isTagBlockLevel(tag);
			
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
	fm.processDocument = function(doc) {
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
				w.schemas.customSchema = {
					name: 'Custom Schema',
					url: schemaUrl
				};
			}
			fm.loadSchema(schemaId, false, doProcessing);
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
				fm.loadSchema(schemaId, false, doProcessing);
			} else {
				doProcessing();
			}
		}
		
		function doProcessing() {
			// reset the stores
			w.entities = {};
			w.structs = {};
			w.triples = [];
			w.deletedEntities = {};
			w.deletedStructs = {};
			
			var offsets = [];
			
			var docMode;
			var rdfs = $(doc).find('rdf\\:RDF, RDF');
<<<<<<< HEAD
=======
			
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
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
<<<<<<< HEAD
				
=======
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
				w.dialogs.show('message', {
					title: 'Editor Mode changed',
					msg: 'The Editor Mode ('+editorModeStr+') has been changed to match the Document Mode ('+docModeStr+').',
					type: 'info'
				});
				
<<<<<<< HEAD
				
=======
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
				w.mode = docMode;
			}
			
			if (docMode == w.XMLRDF) {
				rdfs.children().each(function(i1, el1) {
					var rdf = $(this);

					if (rdf.attr('rdf:ID')) {
						var id = rdf.find('w\\:id, id').text();
						
						var entity = rdf.find('w\\:entity, entity').text();
						// entity
						if (entity != '') {
							var idNum = parseInt(id.split('_')[1]);
<<<<<<< HEAD
							if (idNum > tinymce.DOM.counter) tinymce.DOM.counter = idNum;
=======
							if (idNum >= tinymce.DOM.counter) tinymce.DOM.counter = idNum+1;
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
							
							offsets.push({
								id: id,
								parent: rdf.find('w\\:parent, parent').text(),
								offset: parseInt(rdf.find('w\\:offset, offset').text()),
								length: parseInt(rdf.find('w\\:length, length').text())
							});
							w.entities[id] = {
								props: {
									id: id
								},
								info: {}
							};
							rdf.children('[type="props"]').each(function(i2, el2) {
								var key = $(this)[0].nodeName.split(':')[1].toLowerCase();
								var prop = $(this).text();
								if (key == 'content') {
									var title = w.u.getTitleFromContent(prop);
									w.entities[id]['props']['title'] = title;
								}
								w.entities[id]['props'][key] = prop;
							});
							rdf.children('[type="info"]').each(function(i2, el2) {
								var key = $(this)[0].nodeName.split(':')[1].toLowerCase();
								w.entities[id]['info'][key] = $(this).text();
							});
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
				$(doc).find('rdf\\:RDF, RDF').remove();
			} else {
				function processEntities(parent, offsets) {
					var currentOffset = 0;
					parent.contents().each(function(index, element) {
						if (this.nodeType == Node.TEXT_NODE) {
							currentOffset += this.length;
						} else if (w.em.isEntity(this.nodeName.toLowerCase())) {
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
									title: w.u.getTitleFromContent(content)
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
				processEntities($(doc.firstChild), offsets);
			}

			// FIXME temp fix until document format is correct
			var root = $(w.root+', '+w.root.toLowerCase(), doc)[0];
			
			var editorString = fm.buildEditorString(root);
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
				if (o.parent != '') {
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
				} else {
					parent = $(w.editor.getDoc().body);
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
					try {
						range.setStart(startNode, startOffset);
						range.setEnd(endNode, endOffset);
						w.tagger.insertBoundaryTags(id, w.entities[id].props.type, range);
					} catch (e) {
						
					}
				}
			}
			
			w.entitiesList.update();
			w.tree.update(true);
			w.relations.update();
<<<<<<< HEAD
=======
			w.validation.clearResult();
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
			
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
			
		} // end doProcessing
	};
	
	fm.editSource = function() {
		w.dialogs.confirm({
			title: 'Edit Source',
			msg: 'Editing the source directly is only recommended for advanced users who know what they\'re doing.<br/><br/>Are you sure you wish to continue?',
			callback: function(yes) {
				if (yes) {
					var docText = fm.getDocumentContent(true);
					$('textarea', edit).val(docText);
					edit.dialog('open');
				}
			}
		});
	};
	
	/**
	 * Load a new schema.
	 * @param {String} schemaId The ID of the schema to load (from the config)
	 * @param {Boolean} startText Whether to include the default starting text
	 * @param {Function} callback Callback for when the load is complete
	 */
	fm.loadSchema = function(schemaId, startText, callback) {
		var baseUrl = ''; //w.project == null ? '' : w.baseUrl; // handling difference between local and server urls
<<<<<<< HEAD
		w.schemaId = schemaId; 
		$.ajax({
			url: w.schemas[w.schemaId].url,
			dataType: 'xml',
			success: function(data, status, xhr) {
				w.schemaXML = data;
=======
		w.schemaId = schemaId;
		var schemaUrl = w.schemas[w.schemaId].url;
		
		$.ajax({
			url: schemaUrl,
			dataType: 'xml',
			success: function(data, status, xhr) {
				w.schemaXML = data;
				
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
				// get root element
				var startName = $('start ref:first', w.schemaXML).attr('name');
				var startEl = $('define[name="'+startName+'"] element', w.schemaXML).attr('name');
				w.root = startEl;
//				w.editor.settings.forced_root_block = w.root;
//				w.editor.schema.addCustomElements(w.root);
//			    w.editor.schema.addCustomElements(w.root.toLowerCase());
				
				var additionalBlockElements;
			    if (w.root == 'TEI') {
			    	additionalBlockElements = ['argument', 'back', 'bibl', 'biblFull', 'biblScope', 'body', 'byline', 'category', 'change', 'cit', 'classCode', 'elementSpec', 'macroSpec', 'classSpec', 'closer', 'creation', 'date', 'distributor', 'div', 'div1', 'div2', 'div3', 'div4', 'div5', 'div6', 'div7', 'docAuthor', 'edition', 'editionStmt', 'editor', 'eg', 'epigraph', 'extent', 'figure', 'front', 'funder', 'group', 'head', 'dateline', 'idno', 'item', 'keywords', 'l', 'label', 'langUsage', 'lb', 'lg', 'list', 'listBibl', 'note', 'noteStmt', 'opener', 'p', 'principal', 'publicationStmt', 'publisher', 'pubPlace', 'q', 'rendition', 'resp', 'respStmt', 'salute', 'samplingDecl', 'seriesStmt', 'signed', 'sp', 'sponsor', 'tagUsage', 'taxonomy', 'textClass', 'titlePage', 'titlePart', 'trailer', 'TEI', 'teiHeader', 'text', 'authority', 'availability', 'fileDesc', 'sourceDesc', 'revisionDesc', 'catDesc', 'encodingDesc', 'profileDesc', 'projectDesc', 'docDate', 'docEdition', 'docImprint', 'docTitle'];
			    	
			    	w.header = 'teiHeader';
			    	// FIXME temp fix for doc structure
			    	w.idName = 'xml:id';
			    } else {					
			    	additionalBlockElements = ['DIV0', 'DIV1', 'EVENTS', 'ORLANDOHEADER', 'DOCAUTHOR', 'DOCEDITOR', 'DOCEXTENT', 'PUBLICATIONSTMT', 'TITLESTMT', 'PUBPLACE', 'L', 'P', 'HEADING', 'CHRONEVENT', 'CHRONSTRUCT'];
					
					w.header = 'ORLANDOHEADER';
					w.idName = 'ID';
			    }
			    var blockElements = w.editor.schema.getBlockElements();
			    for (var i = 0; i < additionalBlockElements.length; i++) {
		    		blockElements[additionalBlockElements[i]] = {};
		    	}
				
				function processSchema() {
					// remove old schema elements
				    $('#schemaTags', w.editor.dom.doc).remove();
				    $('#schemaRules', w.editor.dom.doc).remove();
				    
				    var cssUrl = w.schemas[w.schemaId].cssUrl;
				    if (cssUrl) {
				    	fm.loadSchemaCSS(cssUrl);
				    }
				    
				    // create css to display schema tags
					$('head', w.editor.getDoc()).append('<style id="schemaTags" type="text/css" />');
					
					var schemaTags = '';
					var elements = [];
					$('element', w.schemaXML).each(function(index, el) {
						var tag = $(el).attr('name');
						if (tag != null && elements.indexOf(tag) == -1) {
							elements.push(tag);
							var tagName = w.u.getTagForEditor(tag);
							schemaTags += '.showStructBrackets '+tagName+'[_tag='+tag+']:before { color: #aaa; font-weight: normal; font-style: normal; font-family: monospace; content: "<'+tag+'>"; }';
							schemaTags += '.showStructBrackets '+tagName+'[_tag='+tag+']:after { color: #aaa; font-weight: normal; font-style: normal; font-family: monospace; content: "</'+tag+'>"; }';
						}
					});
					elements.sort();
					
					// hide the header
					var tagName = w.u.getTagForEditor(w.header);
					schemaTags += tagName+'[_tag='+w.header+'] { display: none !important; }';
					
					$('#schemaTags', w.editor.getDoc()).text(schemaTags);
				    
					w.schema.elements = elements;
					
					if (callback == null) {
						var text = '';
						if (startText) text = 'Paste or type your text here.';
						var tag = w.u.getTagForEditor(w.root);
						w.editor.setContent('<'+tag+' _tag="'+w.root+'">'+text+'</'+tag+'>');
					}
					
					w.entitiesList.update();
					w.tree.update(true);
					w.relations.update();
					
					w.schemaJSON = w.u.xmlToJSON($('grammar', w.schemaXML)[0]);
					
					// update the schema for schematags.js
					var stb = w.editor.controlManager.controls.editor_schemaTagsButton;
					if (stb.menu) {
						stb.parentControl.buildMenu(stb.menu, null, {disabled: false, mode: 'add'});
					}
					
					if (callback) callback();
				}
			    
				// handle includes
				var include = $('include:first', w.schemaXML); // TODO add handling for multiple includes
				if (include.length == 1) {
<<<<<<< HEAD
					var href = include.attr('href');
					$.ajax({
						url: baseUrl + 'schema/'+href,
=======
					var url = '';
					var includeHref = include.attr('href');
					var schemaFile;
					if (includeHref.indexOf('/') != -1) {
						schemaFile = includeHref.match(/(.*\/)(.*)/)[2]; // grab the filename
					} else {
						schemaFile = includeHref;
					}
					var schemaBase = schemaUrl.match(/(.*\/)(.*)/)[1];
					if (schemaBase != null) {
						url = schemaBase + schemaFile;
					} else {
						url = baseUrl + 'schema/'+schemaFile;
					}
					
					$.ajax({
						url: url,
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
						dataType: 'xml',
						success: function(data, status, xhr) {
							// handle redefinitions
							include.children().each(function(index, el) {
								if (el.nodeName == 'start') {
									$('start', data).replaceWith(el);
								} else if (el.nodeName == 'define') {
									var name = $(el).attr('name');
									var match = $('define[name="'+name+'"]', data);
									if (match.length == 1) {
										match.replaceWith(el);
									} else {
										$('grammar', data).append(el);
									}
								}
							});
							
							include.replaceWith($('grammar', data).children());
							
							processSchema();
						}
					});
				} else {
					processSchema();
				}
			},
			error: function(xhr, status, error) {
				w.dialogs.show('message', {title: 'Error', msg: 'Error loading schema: '+status, type: 'error'});
			}
		});
	};
	
	fm.loadSchemaCSS = function(url) {
		w.editor.dom.loadCSS(url);
		if (url.match('converted') != null) {
			// already converted so exit
			return;
		}
		var name = url.split('/');
		name = name[name.length-1];
		var numCss = w.editor.getDoc().styleSheets.length;
		var cssInt = null;
		function parseCss() {
			var stylesheet = null;
			var stylesheets = w.editor.getDoc().styleSheets;
			for (var i = 0; i < stylesheets.length; i++) {
				var s = stylesheets[i];
				if (s.href && s.href.indexOf(name) != -1) {
					stylesheet = s;
					break;
				}
			}
			if (stylesheet) {
				try {
					$('#schemaRules', w.editor.dom.doc).remove();
					
					var rules = stylesheet.cssRules;
					var newRules = '';
					// adapt the rules to our format, should only modify element names in selectors
					for (var i = 0; i < rules.length; i++) {
						// chrome won't get proper selector, see: https://code.google.com/p/chromium/issues/detail?id=67782
						var selector = rules[i].selectorText;
						var newSelector = selector.replace(/(^|,|\s)(\w+)/g, function(str, p1, p2, offset, s) {
							var tagName = w.u.getTagForEditor(p2);
							return p1+tagName+'[_tag="'+p2+'"]';
						});
						var css = rules[i].cssText;
						var newCss = css.replace(selector, newSelector);
						newRules += newCss+'\n';
					}
					$('head', w.editor.dom.doc).append('<style id="schemaRules" type="text/css" />');
					$('#schemaRules', w.editor.dom.doc).text(newRules);
					stylesheet.disabled = true;
				} catch (e) {
					setTimeout(parseCss, 25);
				}
			} else {
				setTimeout(parseCss, 25);
			}
		};
		if (numCss > 0) {
			parseCss();
		} else {
			cssInt = setInterval(function() {
				var len = w.editor.getDoc().styleSheets.length;
				if (len > numCss) {
					clearInterval(cssInt);
					parseCss();
				}
			}, 25);
		}
	};
	
	fm.loadInitialDocument = function(start) {
		if (start.match('load')) {
			w.dialogs.filemanager.showLoader();
		} else if (start.match('sample_') || start.match('template_')) {
			var name = start.substr(1);
			_loadTemplate('xml/'+name+'.xml', name);
		} else if (start != '') {
			w.fm.loadDocument(start.substr(1));
		}
<<<<<<< HEAD
    else if (w.currentDocId) {
      w.fm.loadDocument(w.currentDocId);
    }
=======
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
	};
	
	function _loadTemplate(url, hashName) {
		w.currentDocId = null;
		
		$.ajax({
<<<<<<< HEAD
			url: Drupal.settings.basePath +
			  Drupal.settings.islandora_critical_edition.module_base +
			  '/CWRC-Writer/src/' + url,
=======
			url: url,
>>>>>>> 4c8be3291883c3e1cf3bb67257deae4da66130ef
			dataType: 'xml',
			success: function(data, status, xhr) {
				if (hashName) {
					window.location.hash = '#'+hashName;
				}
				var rdf = data.createElement('rdf:RDF');
				var root;
				if (data.childNodes) {
					root = data.childNodes[data.childNodes.length-1];
				} else {
					root = data.firstChild;
				}
				$(root).prepend(rdf);
				fm.processDocument(data);
			},
			error: function(xhr, status, error) {
				if (console) console.log(status);
			}
		});
	};
	
	return fm;
};

//cross browser xml node finder
//http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
$.fn.filterNode = function(name) {
	return this.find('*').filter(function() {
		return this.nodeName === name;
	});
};