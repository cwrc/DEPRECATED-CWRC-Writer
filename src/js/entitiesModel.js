// TODO add IDs
define(['jquery', 'jquery.tmpl'], function($) {
	
return function(writer) {
	var w = writer;
	
	var TEXT_SELECTION = '[[[editorText]]]'; // constant represents the user's text selection when adding an entity
	
	// returns a common annotation object
	function commonAnnotation(data, type) {
		var date = new Date().toISOString();
		var contextUri = 'http://www.w3.org/ns/oa/oa.ttl';
		var annotationId = data.annotationId;
		var body = '';
		var annotatedById = data.userId;
		var userName = '';
		var userMbox = '';
		var entityId = data.entityId;
		var docId = data.docId;
		var selectorId = data.selectorId;
		
		var annotation = {
			'@context': contextUri,
			'@id': annotationId,
			'@type': 'oa:Annotation',
			'motivation': ['oa:identifying', 'oa:tagging'],
			'annotatedAt': date,
			'annotatedBy': {
				'@id': annotatedById,
				'@type': 'foaf:Person',
				'mbox': {
					'@id': userMbox
				},
				'name': userName
			},
			'hasBody': {
				'@id': entityId,
				'@type': ['oa:SemanticTag', type]
			},
			'hasTarget': {
				'@id': docId,
				'@type': 'oa:SpecificResource',
				'hasSource': {
					'@id': docId,
					'@type': 'dctypes:Text',
			  		'format': 'text/xml'
				}
			}
		};
		
		if (data.range.end) {
			annotation.hasTarget.hasSelector = {
				'@id': selectorId,
				'@type': 'oa:TextPositionSelector',
				'dcterms:conformsTo': 'http://tools.ietf.org/rfc/rfc3023',
				'oa:start': 'xpointer(string-range('+data.range.start+',"",'+data.range.startOffset+'))',
				'oa:end': 'xpointer(string-range('+data.range.end+',"",'+data.range.endOffset+'))',
			};
		} else {
			annotation.hasTarget.hasSelector = {
				'@id': selectorId,
				'@type': 'oa:FragmentSelector',
				'dcterms:conformsTo': 'http://tools.ietf.org/rfc/rfc3023',
				'rdf:value': 'xpointer('+data.range.start+')'
			};
		}
		
		return annotation;
	}
	
	// converts a key/value obj into a markup string
	function getAttributeString(attObj) {
		var str = '';
		for (var key in attObj) {
			str += ' '+key+'="'+attObj[key]+'"';
		}
		return str;
	}
	
	var entities = {
		person: {
			title: 'Person',
			parentTag: {
				tei: 'persName',
				events: 'name'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<persName';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.role) xml += ' role="'+info.role+'"';
					
					var atts = info.attributes.persName;
					xml += getAttributeString(atts);
					
					xml += '>'+TEXT_SELECTION+'</persName>';
					return xml;
				},
				events: function(entity) {
					return '<NAME>'+TEXT_SELECTION+'</NAME>';
				}
			},
			annotation: function(entity) {
				var data = entity.annotation;
				return commonAnnotation(data, 'foaf:Person');
			}
		},
		date: {
			title: 'Date',
			parentTag: {
				tei: 'date',
				events: 'DATE'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<date';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.date) {
						xml += ' when="'+info.date+'"';
					} else if (info.startDate) {
						xml += ' from="'+info.startDate+'" to="'+info.endDate+'"';
					}
					
					var atts = info.attributes.date;
					xml += getAttributeString(atts);
					
					xml += '>'+TEXT_SELECTION+'</date>';
					return xml;
				},
				events: function(entity) {
					var xml = '';
					if (info.date) {
						xml += '<DATE VALUE="'+info.date+'">'+TEXT_SELECTION+'</DATE>';
					} else if (info.startDate) {
						xml += '<DATERANGE FROM="'+info.startDate+'" TO="'+info.endDate+'">'+TEXT_SELECTION+'</DATERANGE>';
					}
					return xml;
				}
			},
			annotation: function(entity) {
				var data = entity.annotation;
				var anno = commonAnnotation(data, 'cnt:ContentAsText');
				if (entity.info.date) {
					anno.hasBody['cnt:chars'] = entity.info.date;
				} else {
					anno.hasBody['cnt:chars'] = entity.info.startDate+'/'+entity.info.endDate;
				}
				return anno;
			}
		},
		place: {
			title: 'Place',
			parentTag: {
				tei: 'placeName',
				events: 'PLACE'
			},
			textTag: {
				tei: 'placeName'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<placeName';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					xml += '>'+TEXT_SELECTION+'';
					if (info.precision) {
						xml += '<precision';
						if (id) xml += ' annotationId="'+id+'"';
						xml += ' precision="'+info.precision+'" />';
					}
					xml += '</placeName>';
					return xml;
				},
				events: '<PLACE>'+TEXT_SELECTION+'</PLACE>'
			},
			annotation: function(entity) {
				var data = entity.annotation;
				return commonAnnotation(data, 'geo:SpatialThing');
			}
		},
		event: {
			title: 'Event',
			parentTag: {
				tei: 'event'
			},
			mapping: {
				tei: '<event cert="${info.certainty}">'+TEXT_SELECTION+'</event>'
			}
		},
		org: {
			title: 'Organization',
			parentTag: {
				tei: 'orgName',
				events: 'ORGNAME'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<orgName';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.cwrcInfo) xml += ' ref="'+info.cwrcInfo.id+'"';
					
					var atts = info.attributes.orgName;
					xml += getAttributeString(atts);
					
					xml += '>'+TEXT_SELECTION+'</orgName>';
					return xml;
				},
				events: '<ORGNAME>'+TEXT_SELECTION+'</ORGNAME>'
			},
			annotation: function(entity) {
				var data = entity.annotation;
				return commonAnnotation(data, 'foaf:Organization');
			}
		},
		citation: {
			title: 'Citation',
			parentTag: {
				tei: 'cit'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<note';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					xml += ' type="citation"><bibl>';
					if (info.content) {
						var xmlDoc = w.utilities.stringToXML(info.content);
						var biblContent = $('bibl', xmlDoc)[0];
						xml += biblContent.innerHTML;
					}
					xml += '</bibl></note>';
					return xml;
				}
			},
			annotation: function(entity) {
				var data = entity.annotation;
				var anno = commonAnnotation(data, 'cnt:ContentAsText');
				anno.motivation = 'oa:identifying';
				return anno;
			}
		},
		note: {
			title: 'Note',
			parentTag: {
				tei: 'note'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<note';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.type) {
						xml += ' type="'+info.type+'"';
					}
					xml += '>';
					if (info.content) {
						var xmlDoc = w.utilities.stringToXML(info.content);
						var noteContent = $('note', xmlDoc)[0];
						xml += noteContent.innerHTML;
					}
					xml += '</note>';
					return xml;
				}
			},
			annotation: function(entity) {
				var data = entity.annotation;
				var anno = commonAnnotation(data, 'cnt:ContentAsText');
				anno.motivation = 'oa:commenting';
				return anno;
			}
		},
		correction: {
			title: 'Correction',
			parentTag: {
				tei: 'choice', // TODO add corr option
				events: 'SIC'
			},
			textTag: {
				tei: 'sic'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml;
					if (info.sicText) {
						xml = '<choice';
						if (id) xml += ' annotationId="'+id+'"';
						if (offsetId) xml += ' offsetId="'+offsetId+'"';
						xml += '>';
						xml += '<sic';
						if (id) xml += ' annotationId="'+id+'"';
						xml += '>'+TEXT_SELECTION+'</sic>';
						xml += '<corr';
						if (id) xml += ' annotationId="'+id+'"';
						xml += '>'+info.corrText+'</corr></choice>';
					} else {
						xml = '<corr';
						if (id) xml += ' annotationId="'+id+'"';
						if (offsetId) xml += ' offsetId="'+offsetId+'"';
						xml += '>'+TEXT_SELECTION+'</corr>';
					}
					return xml;
				},
				events: '<SIC CORR="${info.corrText}">'+TEXT_SELECTION+'</SIC>'
			},
			annotation: function(entity) {
				var data = entity.annotation;
				var anno = commonAnnotation(data, 'cnt:ContentAsText');
				anno.motivation = 'oa:editing';
				anno.hasBody['cnt:chars'] = entity.info.corrText;
				return anno;
			}
		},
		keyword: {
			title: 'Keyword',
			parentTag: {
				tei: 'note',
				events: 'KEYWORDCLASS'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '';
					for (var i = 0; i < info.keywords.length; i++) {
						xml += '<note type="keyword"';
						if (id) xml += ' annotationId="'+id+'"';
						if (offsetId) xml += ' offsetId="'+offsetId+'"';
						xml +='><term>'+info.keywords[i]+'</term></note>';
					}
					return xml;
				},
				events: '<KEYWORDCLASS>'+TEXT_SELECTION+'</KEYWORDCLASS>'
			},
			annotation: function(entity) {
				var data = entity.annotation;
				var anno = commonAnnotation(data, 'cnt:ContentAsText');
				anno.motivation = 'oa:tagging';
				return anno;
			}
		},
		link: {
			title: 'Link',
			parentTag: {
				tei: 'ref',
				events: 'XREF'
			},
			mapping: {
				tei: '<ref target="${info.url}">'+TEXT_SELECTION+'</ref>',
				events: '<XREF URL="${info.url}">'+TEXT_SELECTION+'</XREF>'
			},
			annotation: function(entity) {
				var data = entity.annotation;
				var anno = commonAnnotation(data, 'cnt:ContentAsText');
				anno.motivation = 'oa:linking';
				anno.hasBody = entity.info.url;
				return anno;
			}
		},
		title: {
			title: 'Text/Title',
			parentTag: {
				tei: 'title',
				events: 'TITLE'
			},
			mapping: {
				tei: '<title cert="${info.certainty}" level="${info.level}">'+TEXT_SELECTION+'</title>',
				events: '<TITLE TITLETYPE="${info.level}">'+TEXT_SELECTION+'</TITLE>'
			},
			annotation: function(entity) {
				var data = entity.annotation;
				var anno = commonAnnotation(data, 'cnt:ContentAsText');
				anno.motivation = 'oa:identifying';
				return anno;
			}
		}
	};
	
	var entmod = {};
	/**
	 * Checks if the tag is for an entity.
	 * @memberOf entmod
	 * @param tag The tag to check.
	 * @param schema The schema to use.
	 * @returns {String} The entity type, or null
	 */
	entmod.getEntityTypeForTag = function(tag, schema) {
		if (schema.indexOf('tei') != -1) {
			schema = 'tei';
		} else {
			schema = 'events';
		}
		for (var e in entities) {
			if (entities[e].parentTag[schema] == tag) {
				return e;
			}
		}
		return null;
	};
	
	/**
	 * Gets the title for an entity.
	 * @param type The entity type.
	 * @returns {String}
	 */
	entmod.getTitle = function(type) {
		var e = entities[type];
		if (e) {
			return e.title;
		}
		return null;
	};
	
	/**
	 * Returns the mapping as an array of opening and closing tags.
	 * @param entity The entity object.
	 * @param schema The schema to use for the mapping.
	 * @returns {Array}
	 */
	entmod.getMappingTags = function(entity, schema) {
		var e = entities[entity.props.type];
		if (e) {
			if (schema.indexOf('tei') != -1) {
				schema = 'tei';
			} else {
				schema = 'events';
			}
			
			if (e.mapping && e.mapping[schema]) {
				var mapping = e.mapping[schema];
				var mappedString = '';
				if (typeof mapping == 'string') {
					var result = $.tmpl(mapping, entity);
					if (result[0]) {
						mappedString = result[0].outerHTML;
					}
				} else if (typeof mapping == 'function') {
					mappedString = mapping(entity);
				}
				if (mappedString.indexOf(TEXT_SELECTION) === -1) {
					return ['', mappedString];
				} else {
					return mappedString.split(TEXT_SELECTION);
				}
			}
		}
		return ['', '']; // return array of empty strings if there is no mapping
	};
	
	/**
	 * Returns the parent tag for entity when converted to a particular schema.
	 * @param entityType The entity type.
	 * @param schema The schema to use.
	 * @returns {String}
	 */
	entmod.getParentTag = function(entityType, schema) {
		var e = entities[entityType];
		if (e) {
			if (schema.indexOf('tei') != -1) {
				schema = 'tei';
			} else {
				schema = 'events';
			}
			if (e.parentTag && e.parentTag[schema]) {
				return e.parentTag[schema];
			}
		}
		return '';
	};
	
	/**
	 * Returns the text tag (tag containing user-highlighted text) for entity when converted to a particular schema.
	 * @param entityType The entity type.
	 * @param schema The schema to use.
	 * @returns {String}
	 */
	entmod.getTextTag = function(entityType, schema) {
		var e = entities[entityType];
		if (e) {
			if (schema.indexOf('tei') != -1) {
				schema = 'tei';
			} else {
				schema = 'events';
			}
			if (e.textTag && e.textTag[schema]) {
				return e.textTag[schema];
			}
		}
		return '';
	};
	
	
	/**
	 * Get the annotation object for the entity.
	 * @param {String} type The type of entity.
	 * @param {Object} entity The entity data object (from the global entities list).
	 * @param {Object} entity.annotation The annotation data associated with the entity.
	 * @returns {Object} The annotation object. 
	 */
	entmod.getAnnotation = function(type, entity) {
		var e = entities[type];
		var anno = {};
		if (e && e.annotation) {
			anno = e.annotation(entity);
		}
		return anno;
	};
	
	return entmod;
};

});