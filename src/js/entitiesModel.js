// TODO add IDs
define(['jquery'], function($) {
	
	// returns a common annotation object
	function commonAnnotation(data, type) {
		var date = new Date().toISOString();
		var contextUri = 'http://www.w3.org/ns/oa-context-20130208.json';
		var annotationId = data.annotationId;
		var body = '';
		var annotatedById = data.userId;
		var userName = '';
		var userMbox = '';
		var entityId = data.entityId;
		var docId = data.docId;
		var selectorId = data.selectorId;
		var offsetStart = data.start;
		var offsetEnd = data.end;
		
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
				'hasSelector': {
					'@id': selectorId,
					'@type': 'oa:TextPositionSelector',
					'start': offsetStart,
					'end': offsetEnd
				},
				'hasSource': {
					'@id': docId,
					'@type': 'dctypes:Text',
			  		'format': 'text/xml'
				}
			}
		};
		
		return annotation;
	}
	
	var entities = {
		person: {
			title: 'Person',
			parentTag: {
				tei: 'persName',
				events: 'name'
			},
			mapping: {
				tei: function(info) {
					var xml = '<persName';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.role) xml += ' role="'+info.role+'"';
					xml += '>[[[editorText]]]</persName>';
					return xml;
				},
				events: function(info) {
					return '<NAME>[[[editorText]]]</NAME>';
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
				tei: function(info) {
					var xml = '<date';
					if (info.date) {
						xml += ' when="'+info.date+'"';
					} else if (info.startDate) {
						xml += ' from="'+info.startDate+'" to="'+info.endDate+'"';
					}
					xml += '[[[editorText]]]</date>';
					return xml;
				},
				events: function(info) {
					var xml = '';
					if (info.date) {
						xml += '<DATE VALUE="'+info.date+'">[[[editorText]]]</DATE>';
					} else if (info.startDate) {
						xml += '<DATERANGE FROM="'+info.startDate+'" TO="'+info.endDate+'">[[[editorText]]]</DATERANGE>';
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
			mapping: {
				tei: function(info) {
					var xml = '<placeName';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					xml += '>[[[editorText]]]';
					if (info.precision) {
						xml += '<precision precision="'+info.precision+'">';
						if (info.detail) {
							xml += info.detail;
						}
						xml += '</precision>';
					}
					xml += '</placeName>';
					return xml;
				},
				events: '<PLACE>[[[editorText]]]</PLACE>'
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
				tei: '<event cert="${info.certainty}">[[[editorText]]]</event>'
			}
		},
		org: {
			title: 'Organization',
			parentTag: {
				tei: 'orgName',
				events: 'ORGNAME'
			},
			mapping: {
				tei: '<orgName cert="${info.certainty}">[[[editorText]]]</orgName>',
				events: '<ORGNAME>[[[editorText]]]</ORGNAME>'
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
				tei: '<cit><quote>[[[editorText]]]</quote><ref>${info.citation}</ref></cit>'
			}
		},
		note: {
			title: 'Note',
			parentTag: {
				tei: 'note'
			},
			mapping: {
				tei: '<note type="${info.type}" ana="${info.content}">[[[editorText]]]</note>'
			}
		},
		correction: {
			title: 'Correction',
			parentTag: {
				tei: 'sic',
				events: 'SIC'
			},
			mapping: {
				tei: '<sic><corr cert="${info.certainty}" type="${info.type}" ana="${info.content}">[[[editorText]]]</corr></sic>',
				events: '<SIC CORR="${info.content}">[[[editorText]]]</SIC>'
			}
		},
		keyword: {
			title: 'Keyword',
			parentTag: {
				tei: 'keywords',
				events: 'KEYWORDCLASS'
			},
			mapping: {
				tei: ''+
				'<keywords scheme="http://classificationweb.net">'+
					'<term '+
					'{{if info.id}}'+
						'sameAs="${info.id}"'+
					'{{else info.keyword}}'+
						'sameAs="${info.keyword}"'+
					'{{/if}}'+
					' type="${info.type}">[[[editorText]]]</term>'+
				'</keywords>',
				events: '<KEYWORDCLASS>[[[editorText]]]</KEYWORDCLASS>'
			}
		},
		link: {
			title: 'Link',
			parentTag: {
				tei: 'ref',
				events: 'XREF'
			},
			mapping: {
				tei: '<ref target="${info.url}">[[[editorText]]]</ref>',
				events: '<XREF URL="${info.url}">[[[editorText]]]</XREF>'
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
				tei: '<title cert="${info.certainty}" level="${info.level}">[[[editorText]]]</title>',
				events: '<TITLE TITLETYPE="${info.level}">[[[editorText]]]</TITLE>'
			}
		}
	};
	
	var entmod = {};
	/**
	 * Checks if the tag is for an entity.
	 * @memberOf entmod
	 * @param tag The tag to check.
	 * @param schema The schema to use.
	 * @returns {Boolean}
	 */
	entmod.isEntity = function(type, schema) {
		if (schema.indexOf('tei') != -1) {
			schema = 'tei';
		} else {
			schema = 'events';
		}
		for (var e in entities) {
			if (entities[e].parentTag[schema] == type) {
				return true;
			}
		}
		return false;
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
					mappedString = mapping(entity.info);
				}
				return mappedString.split('[[[editorText]]]');
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
});