// TODO add IDs
define(['jquery'], function($) {
	var entities = {
		person: {
			title: 'Person',
			mapping: {
				tei: function(info) {
					var xml = '<person';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.gender) xml += ' sex="'+info.gender+'"';
					if (info.role) xml += ' role="'+info.role+'"';
					xml += '>';
					xml += '<persName>';
					if (info.firstName || info.lastName) {
						if (info.firstName) xml += '<forename>'+info.firstName+'</forename>';
						if (info.lastName) xml += '<surname>'+info.lastName+'</surname>';
					} else {
						xml += '[[[editorText]]]';
					}
					xml += '</persName></person>';
					return xml;
				},
				events: function(info) {
					return '<NAME>[[[editorText]]]</NAME>';
				}
			},
			annotation: function(entity) {
				var date = new Date().toISOString();
				var contextUri = 'http://www.w3.org/ns/oa-context-20130208.json';
				var annotationId = '';
				var body = '';
				var annotatedById = '';
				var userName = '';
				var userMbox = '';
				var targetId = '';
				var personId = '';
				var docId = '';
				var selectorId = '';
				var offsetStart = '';
				var offsetEnd = '';
				
				var annotation = {
					'@context': contextUri, 
					'@id': annotationId, 
					'@type': 'oa:Annotation',
					'motivation':['oa:identifying', 'oa:tagging'],
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
						'@id': personId, 
						'@type': ['oa:SemanticTag', 'foaf:Person']		
					}, 
					'hasTarget': {
						'@id': targetId, 
						'@type': 'oa:SpecificResource', 
						'hasSelector': {
							'@id': selectorId, 
							'@type': 'oa:TextPositionSelector', 
							'start': offsetStart,
							'end': offsetEnd
						}, 
						'hasSource': {
							'@id': docId, 
							'@type':'dctypes:Text',
					  		'format':'text/xml'
						}
					}
				};
			}
		},
		date: {
			title: 'Date',
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
			}
		},
		place: {
			title: 'Place',
			mapping: {
				tei: '<place cert="${info.certainty}">[[[editorText]]]</place>',
				events: '<PLACE>[[[editorText]]]</PLACE>'
			}
		},
		event: {
			title: 'Event',
			mapping: {
				tei: '<event cert="${info.certainty}">[[[editorText]]]</event>'
			}
		},
		org: {
			title: 'Organization',
			mapping: {
				tei: '<org cert="${info.certainty}">[[[editorText]]]</org>',
				events: '<ORGNAME>[[[editorText]]]</ORGNAME>'
			}
		},
		citation: {
			title: 'Citation',
			mapping: {
				tei: '<cit><quote>[[[editorText]]]</quote><ref>${info.citation}</ref></cit>'
			}
		},
		note: {
			title: 'Note',
			mapping: {
				tei: '<note type="${info.type}" ana="${info.content}">[[[editorText]]]</note>'
			}
		},
		correction: {
			title: 'Correction',
			mapping: {
				tei: '<sic><corr cert="${info.certainty}" type="${info.type}" ana="${info.content}">[[[editorText]]]</corr></sic>',
				events: '<SIC CORR="${info.content}">[[[editorText]]]</SIC>'
			}
		},
		keyword: {
			title: 'Keyword',
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
			mapping: {
				tei: '<ref target="${info.url}">[[[editorText]]]</ref>',
				events: '<XREF URL="${info.url}">[[[editorText]]]</XREF>'
			}
		},
		title: {
			title: 'Text/Title',
			mapping: {
				tei: '<title level="${info.level}">[[[editorText]]]</title>',
				events: '<TITLE TITLETYPE="${info.level}">[[[editorText]]]</TITLE>'
			}
		}
	};
	
	var entmod = {};
	/**
	 * @memberOf entmod
	 * @param type
	 * @returns {Boolean}
	 */
	entmod.isEntity = function(type) {
		return entities[type] != null;
	};
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
	
	return entmod;
});