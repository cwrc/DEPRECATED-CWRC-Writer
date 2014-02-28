/**
 * Contains the load and save dialogs, as well as file related functions.
 */
define(['jquery', 'jquery-ui'], function($, jqueryUi) {

//cross browser xml node finder
//http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
$.fn.filterNode = function(name) {
	return this.find('*').filter(function() {
		return this.nodeName === name;
	});
};
	
return function(writer) {
	
	var w = writer;
	
	$(document.body).append(''+
		'<div id="entitiesConverter"></div>'+
		'<div id="editSourceDialog">'+
			'<textarea></textarea>'+
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
				var xmlDoc = w.utilities.stringToXML(newDocString);
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
			w.dialogManager.filemanager.showUnsaved();
		} else {
			window.location = 'index.htm';
		}
	};
	
	fm.saveDocument = function() {
		if (w.currentDocId == null) {
			w.dialogManager.filemanager.showSaver();
		} else {
			w.delegator.validate(function (valid) {
				if (valid) {
					w.delegator.saveDocument();
				} else {
					var doc = w.currentDocId;
					if (doc == null) doc = 'The current document';
					w.dialogManager.confirm({
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

		var nodes = [ start ];
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
					rdfString += '\n<rdf:Description>';
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
		bodyString = bodyString.replace(/\uFEFF/g, ''); // remove characters inserted by node selecting
		
		xmlString += rdfString + bodyString;
		
		xmlString += tags[1];
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
			success: function(doc, status, xhr) {
				window.location.hash = '';
				fm.processDocument(doc);
			},
			error: function(xhr, status, error) {
				w.currentDocId = null;
				w.dialogManager.show('message', {
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
				w.schemaManager.schemas.customSchema = {
					name: 'Custom Schema',
					url: schemaUrl
				};
			}
			w.schemaManager.loadSchema(schemaId, false, doProcessing);
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
				w.schemaManager.loadSchema(schemaId, false, doProcessing);
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
			
			if (docMode == w.XMLRDF) {
				rdfs.children().each(function(i1, el1) {
					var rdf = $(this);

					if (rdf.attr('rdf:ID')) {
						var id = rdf.find('w\\:id, id').text();
						
						var entity = rdf.find('w\\:entity, entity').text();
						// entity
						if (entity != '') {
							var idNum = parseInt(id.split('_')[1]);
							if (idNum >= tinymce.DOM.counter) tinymce.DOM.counter = idNum+1;
							
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
									var title = w.utilities.getTitleFromContent(prop);
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
			
		} // end doProcessing
	};
	
	fm.editSource = function() {
		w.dialogManager.confirm({
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
	
	fm.loadInitialDocument = function(start) {
		if (start.match('load')) {
			w.dialogManager.filemanager.showLoader();
		} else if (start.match('sample_') || start.match('template_')) {
			var name = start.substr(1);
			_loadTemplate(w.cwrcRootUrl+'xml/'+name+'.xml', name);
		} else if (start != '') {
			fm.loadDocument(start.substr(1));
		}
	};
	
	function _loadTemplate(url, hashName) {
		w.currentDocId = null;
		
		$.ajax({
			url: url,
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

});