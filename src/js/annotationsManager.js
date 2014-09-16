define(['jquery'], function($) {

/**
 * @class AnnotationsManager
 * @param {Writer} writer
 */
return function(writer) {
	var w = writer;
	
	var TEXT_SELECTION = '[[[editorText]]]'; // constant represents the user's text selection when adding an entity
	
	var prefixMap = {
		'bibo': 'http://purl.org/ontology/bibo/',
		'cnt': 'http://www.w3.org/2011/content#',
		'cw': 'http://cwrc.ca/ns/cw#',
		'dc': 'http://purl.org/dc/elements/1.1/',
		'dcterms': 'http://purl.org/dc/terms/',
		'foaf': 'http://xmlns.com/foaf/0.1/',
		'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
		'oa': 'http://www.w3.org/ns/oa#',
		'owl': 'http://www.w3.org/2002/07/owl#',
		'prov': 'http://www.w3.org/ns/prov#',
		'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
		'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
		'skos': 'http://www.w3.org/2004/02/skos/core#',
		'time': 'http://www.w3.org/2006/time#',
		'xsd': 'http://www.w3.org/2001/XMLSchema#'
	};
	
	/**
	 * Creates a common annotation object.
	 * @param {Object} config The config object
	 * @param {Object} config.data Provides data to fill out the annotation
	 * @param {Array} config.types The annotation type(s)
	 * @param {Array} config.motivations The annotation motivations(s)
	 * @param {String} format The annotation format to return: 'json' or 'xml'
	 * @returns {JSON|XML} 
	 */
	function commonAnnotation(config, format) {
		format = format || 'xml';
		
		var data = config.data;
		var types = config.types;
		var motivations = config.motivations;
		
		if (!$.isArray(types)) {
			types = [types];
		}
		
		if (motivations == null) {
			motivations = ['oa:tagging','oa:identifying'];
		}
		if (!$.isArray(motivations)) {
			motivations = [motivations];
		}
		
		var date = new Date().toISOString();
		var annotationId = data.annotationId;
		var body = '';
		var annotatedById = data.userId;
		var userName = '';
		var userMbox = '';
		var entityId = data.entityId;
		var docId = data.docId;
		var targetId = data.targetId;
		var selectorId = data.selectorId;
		
		var annotation;
		
		if (format === 'xml') {
			var namespaces = {
				'rdf': 'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
				'oa': 'xmlns:oa="http://www.w3.org/ns/oa#"',
				'cw': 'xmlns:cw="http://cwrc.ca/ns/cw#"'
			};
			
			var typesString = '';
			for (var i = 0; i < types.length; i++) {
				var typeParts = types[i].split(':');
				var prefix = typeParts[0];
				var namespace = prefixMap[prefix];
				namespaces[prefix] = 'xmlns:'+prefix+'="'+namespace+'"';
				typesString += '<rdf:type rdf:resource="'+namespace+typeParts[1]+'"/>';
			}
			
			var motivationsString = '';
			for (var i = 0; i < motivations.length; i++) {
				var motivationParts = motivations[i].split(':');
				var prefix = motivationParts[0];
				var namespace = prefixMap[prefix];
				namespaces[prefix] = 'xmlns:'+prefix+'="'+namespace+'"';
				motivationsString += '<oa:motivatedBy rdf:resource="'+namespace+motivationParts[1]+'"/>';
			}
			
			var namespaceString = '';
			for (var prefix in namespaces) {
				namespaceString += ' '+namespaces[prefix];
			}
			
			var certaintyString = '';
			if (data.certainty != null) {
				// fix for discrepancy between schemas
				if (data.certainty === 'reasonably certain') {
					data.certainty = 'reasonable';
				}
				certaintyString = '<cw:hasCertainty rdf:resource="http://cwrc.ca/ns/cw#'+data.certainty+'"/>';
			}
			
			var selectorString = ''+
			'<rdf:Description rdf:about="'+targetId+'">'+
				'<oa:hasSource rdf:resource="'+docId+'"/>'+
				'<rdf:type rdf:resource="http://www.w3.org/ns/oa#SpecificResource"/>'+
				'<oa:hasSelector rdf:resource="'+selectorId+'"/>'+
			'</rdf:Description>';
			if (data.range.end) {
				selectorString += ''+
				'<rdf:Description rdf:about="'+selectorId+'">'+
				    '<oa:start>xpointer(string-range('+data.range.start+',"",'+data.range.startOffset+'))</oa:start>'+
				    '<oa:end>xpointer(string-range('+data.range.end+',"",'+data.range.endOffset+'))</oa:end>'+
				    '<rdf:type rdf:resource="http://www.w3.org/ns/oa#TextPositionSelector"/>'+
				'</rdf:Description>';
			} else {
				selectorString += ''+
				'<rdf:Description rdf:about="'+selectorId+'">'+
				    '<rdf:value>xpointer('+data.range.start+')</rdf:value>'+
				    '<rdf:type rdf:resource="http://www.w3.org/ns/oa#FragmentSelector"/>'+
				'</rdf:Description>';
			}
			
			var cwrcInfoString = '';
			if (data.cwrcInfo != null) {
				delete data.cwrcInfo.data; // remove extra XML data
				var cwrcInfo = JSON.stringify(data.cwrcInfo);
				cwrcInfoString = '<cw:cwrcInfo>'+cwrcInfo+'</cw:cwrcInfo>';
			}
			
			var cwrcAttributesString = '';
			if (data.cwrcAttributes != null) {
				var cwrcAttributes = JSON.stringify(data.cwrcAttributes);
				cwrcAttributesString = '<cw:cwrcAttributes>'+cwrcAttributes+'</cw:cwrcAttributes>';
			}
			
			annotation = $($.parseXML(''+
			'<rdf:RDF'+namespaceString+'>'+
				'<rdf:Description rdf:about="'+annotationId+'">'+
					'<oa:hasTarget rdf:resource="'+targetId+'"/>'+
					'<oa:hasBody rdf:resource="'+entityId+'"/>'+
					'<oa:annotatedBy rdf:resource="'+annotatedById+'"/>'+
					'<oa:annotatedAt>'+date+'</oa:annotatedAt>'+
					'<oa:serializedBy rdf:resource=""/>'+
					'<oa:serializedAt>'+date+'</oa:serializedAt>'+
					'<rdf:type rdf:resource="http://www.w3.org/ns/oa#Annotation"/>'+
					motivationsString+
					certaintyString+
					cwrcInfoString+
					cwrcAttributesString+
				'</rdf:Description>'+
				'<rdf:Description rdf:about="'+entityId+'">'+
					'<rdf:type rdf:resource="http://www.w3.org/ns/oa#SemanticTag"/>'+
					typesString+
				'</rdf:Description>'+
				selectorString+
			'</rdf:RDF>'
			));
		} else if (format === 'json') {
			types.push('oa:SemanticTag');
			
			annotation = {
				'@context': 'http://www.w3.org/ns/oa/oa.ttl',
				'@id': annotationId,
				'@type': 'oa:Annotation',
				'motivatedBy': motivations,
				'annotatedAt': date,
				'annotatedBy': {
					'@id': annotatedById,
					'@type': 'foaf:Person',
					'mbox': {
						'@id': userMbox
					},
					'name': userName
				},
				'serializedAt': data,
				'serializedBy': '',
				'hasBody': {
					'@id': entityId,
					'@type': types
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
			
			if (data.certainty != null) {
				annotation.hasCertainty = 'cw:'+data.certainty;
			}
			
			if (data.cwrcInfo != null) {
				annotation.cwrcInfo = data.cwrcInfo;
			}
			
			if (data.cwrcAttributes != null) {
				annotation.cwrcAttributes = data.cwrcAttributes;
			}
			
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
		}
		
		return annotation;
	}
	
	function getResp() {
		return 'PLACEHOLDER_USER';
	}
	
	var entities = {
		person: {
			annotationType: 'foaf:Person',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.certainty = entity.info.certainty;
				data.cwrcInfo = entity.info.cwrcInfo;
				data.cwrcAttributes = {
					attributes: entity.info.attributes,
					role: entity.info.role,
					type: entity.info.type
				};
				return commonAnnotation({data: data, types: 'foaf:Person'}, format);
			}
		},
		org: {
			annotationType: 'foaf:Organization',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.certainty = entity.info.certainty;
				data.cwrcInfo = entity.info.cwrcInfo;
				data.cwrcAttributes = {
					attributes: entity.info.attributes
				};
				
				return commonAnnotation({data: data, types: 'foaf:Organization'}, format);
			}
		},
		place: {
			annotationType: 'geo:SpatialThing',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.certainty = entity.info.certainty;
				data.cwrcInfo = entity.info.cwrcInfo;
				data.cwrcAttributes = {
					precision: entity.info.precision
				};
				return commonAnnotation({data: data, types: 'geo:SpatialThing'}, format);
			}
		},
		title: {
			annotationType: 'dcterms:title',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.certainty = entity.info.certainty;
				data.cwrcInfo = entity.info.cwrcInfo;
				data.cwrcAttributes = {
					attributes: entity.info.attributes
				};
				
				var anno = commonAnnotation({data: data, types: ['dcterms:BibliographicResource', 'dcterms:title']}, format);
				
				if (format === 'xml') {
					var levelXml = $.parseXML('<cw:pubType xmlns:cw="http://cwrc.ca/ns/cw#">'+entity.info.level+'</cw:pubType>');
					var body = $('[rdf\\:about="'+data.entityId+'"]', anno);
					body.prepend(levelXml.firstChild);
				} else {
					anno.motivation = 'oa:identifying';
				}
				
				return anno;
			}
		},
		date: {
			annotationType: 'time:TemporalEntity',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.certainty = entity.info.certainty;
				data.cwrcAttributes = {
					attributes: entity.info.attributes
				};
				
				var types = [];
				if (entity.info.date) {
					types.push('time:Instant');
				} else {
					types.push('time:Interval');
				}
				types.push('time:TemporalEntity');
				
				var anno = commonAnnotation({data: data, types: types}, format);
				
				if (format === 'xml') {
					var dateXml;
					if (entity.info.date) {
						dateXml = $.parseXML('<xsd:date xmlns:xsd="http://www.w3.org/2001/XMLSchema#">'+entity.info.date+'</xsd:date>');
					} else {
						// TODO properly encode date range
						dateXml = $.parseXML('<xsd:date xmlns:xsd="http://www.w3.org/2001/XMLSchema#">'+entity.info.startDate+'/'+entity.info.endDate+'</xsd:date>');
					}
					var body = $('[rdf\\:about="'+data.entityId+'"]', anno);
					body.prepend(dateXml.firstChild);
				} else {
					if (entity.info.date) {
						anno.hasBody['xsd:date'] = entity.info.date;
					} else {
						anno.hasBody['xsd:date'] = entity.info.startDate+'/'+entity.info.endDate;
					}
				}
				
				return anno;
			}
		},
		note: {
			annotationType: 'bibo:Note',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.cwrcAttributes = {
					type: entity.info.type
				};
				
				var anno = commonAnnotation({data: data, types: 'bibo:Note', motivations: 'oa:commenting'}, format);
				
				return anno;
			}
		},
		citation: {
			annotationType: 'dcterms:BibliographicResource',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.cwrcInfo = entity.info.cwrcInfo;
				
				var anno = commonAnnotation({data: data, types: 'dcterms:BibliographicResource', motivations: 'cw:citing'}, format);
				
				return anno;
			}
		},
		correction: {
			annotationType: 'oa:editing',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.cwrcAttributes = {
					attributes: entity.info.attributes
				};
				
				var anno = commonAnnotation({data: data, types: 'cnt:ContentAsText', motivations: 'oa:editing'}, format);
				
				if (format === 'xml') {
					var corrXml = $.parseXML('<cnt:chars xmlns:cnt="http://www.w3.org/2011/content#">'+entity.info.corrText+'</cnt:chars>');
					var body = $('[rdf\\:about="'+data.entityId+'"]', anno);
					body.prepend(corrXml.firstChild);
				} else {
					anno.hasBody['cnt:chars'] = entity.info.corrText;
				}

				return anno;
			}
		},
		keyword: {
			annotationType: 'skos:Concept',
			annotation: function(entity, format) {
				var data = entity.annotation;
				
				var anno = commonAnnotation({data: data, types: ['oa:Tag', 'cnt:ContentAsText', 'skos:Concept'], motivations: 'oa:classifying'}, format);
				
				if (format === 'xml') {
					var body = $('[rdf\\:about="'+data.entityId+'"]', anno);
					for (var i = 0; i < entity.info.keywords.length; i++) {
						var keyword = entity.info.keywords[i];
						var keywordXml = $.parseXML('<cnt:chars xmlns:cnt="http://www.w3.org/2011/content#">'+keyword+'</cnt:chars>');
						body.prepend(keywordXml.firstChild);
					}
				} else {
					anno.hasBody['cnt:chars'] = entity.info.keywords;
				}

				return anno;
			}
		},
		link: {
			annotationType: 'oa:linking',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.entityId = entity.info.url;
				
				var anno = commonAnnotation({data: data, types: 'cnt:ContentAsText', motivations: 'oa:linking'}, format);
				
				if (format === 'xml') {
					$('[rdf\\:about="'+entity.info.url+'"]', anno).remove();
				} else {
					
				}
				
				return anno;
			}
		}
	};
	
	/**
	 * @lends AnnotationsManager.prototype
	 */
	var annman = {};
	
	/**
	 * Returns the entity type, using a annotation string.
	 * @param {String} annotation The annotation string, e.g. 'foaf:Person'
	 * @returns {String}
	 */
	annman.getEntityTypeForAnnotation = function(annotation) {
		if (annotation.indexOf('http://') !== -1) {
			// convert uri to prefixed form
			for (var prefix in prefixMap) {
				var uri = prefixMap[prefix];
				if (annotation.indexOf(uri) === 0) {
					annotation = annotation.replace(uri, prefix+':');
					break;
				}
			}
		}
		for (var e in entities) {
			if (entities[e].annotationType === annotation) {
				return e;
			}
		}
		
		return null;
	};
	
	/**
	 * Get the annotation object for the entity.
	 * @param {String} type The entity type.
	 * @param {Object} entity The entity data object (from the global entities list).
	 * @param {Object} entity.annotation The annotation data associated with the entity.
	 * @param {String} format The annotation format ('xml' or 'json').
	 * @returns {Object} The annotation object. 
	 */
	annman.getAnnotation = function(type, entity, format) {
		format = format || 'xml';
		var e = entities[type];
		var anno;
		if (e && e.annotation) {
			anno = e.annotation(entity, format);
			if (format === 'xml') {
				anno = anno[0].firstChild; // convert from jquery obj
			}
		}
		return anno;
	};
	
	return annman;
};

});