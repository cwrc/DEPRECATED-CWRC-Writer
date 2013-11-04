// TODO add IDs

var EntitiesModel = function() {
	var entities = {
		person: {
			title: 'Person',
			mapping: {
				tei: '<person cert="${info.certainty}">[[[editorText]]]</person>',
				events: '<NAME>[[[editorText]]]</NAME>'
			}
		},
		date: {
			title: 'Date',
			mapping: {
				tei: ''+
				'<date '+
				'{{if info.date}}'+
					'when="${info.date}"'+
				'{{else info.startDate}}'+
					'from="${info.startDate}" to="${info.endDate}"'+
				'{{/if}}'+
				'>[[[editorText]]]</date>',
				events: ''+
				'{{if info.date}}'+
					'<DATE VALUE="${info.date}">[[[editorText]]]</DATE>'+
				'{{else info.startDate}}'+
					'<DATERANGE FROM="${info.startDate}" TO="${info.endDate}">[[[editorText]]]</DATERANGE>'+
				'{{/if}}'
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
	
	function doMapping(entity, map) {		
		var result = $.tmpl(map, entity);
		if (result[0]) return result[0].outerHTML;
		else return '';
	}
	
	var pm = {};
	/**
	 * @memberOf pm
	 * @param type
	 * @returns {Boolean}
	 */
	pm.isEntity = function(type) {
		return entities[type] != null;
	};
	pm.getTitle = function(type) {
		var e = entities[type];
		if (e) {
			return e.title;
		}
		return null;
	};
	pm.getMapping = function(entity, schema) {
		var e = entities[entity.props.type];
		if (e) {
			if (e.mapping && e.mapping[schema]) {
				var mappedString = doMapping(entity, e.mapping[schema]);
				return mappedString;
			}
		}
		return null;
	};
	// returns the mapping as an array of opening and closing tags
	pm.getMappingTags = function(entity, schema) {
		var e = entities[entity.props.type];
		if (e) {
			if (schema.indexOf('tei') != -1) {
				schema = 'tei';
			} else {
				schema = 'events';
			}
			
			if (e.mapping && e.mapping[schema]) {
				var result = doMapping(entity, e.mapping[schema]);
				return result.split('[[[editorText]]]');
			}
		}
		return ['', '']; // return array of empty strings if there is no mapping
	};
	
	return pm;
};