// TODO add IDs
define(['jquery', 'jquery.tmpl'], function($) {

/**
 * @class EntitiesModel
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
	
	// converts a key/value obj into a markup string
	function getAttributeString(attObj) {
		var str = '';
		for (var key in attObj) {
			str += ' '+key+'="'+attObj[key]+'"';
		}
		return str;
	}
	
	/**
	 * Gets entity markup attributes from xml. Assumes all other attributes have been removed.
	 * @param xml {xml} The xml
	 * @returns {Object} key/value pairs
	 */
	function getAttributesFromXml(xml) {
		var attrs = {};
		var nodeAttrs = attrs[xml.nodeName] = {};
		$.map(xml.attributes, function(att) {
			if (att.name === 'annotationId' || att.name === 'offsetId' || att.name === 'cwrcStructId') {
				// don't include
			} else {
				nodeAttrs[att.name] = att.value;
			}
		});
		return attrs;
	}
	
	function getResp() {
		return 'PLACEHOLDER_USER';
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
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<persName';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.type) xml += ' type="'+info.type+'"';
					if (info.role) xml += ' role="'+info.role+'"';
					if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
					
					if (info.attributes) {
						var atts = info.attributes.persName;
						xml += getAttributeString(atts);
					}
					
					xml += '>'+TEXT_SELECTION+'</persName>';
					return xml;
				},
				events: function(entity) {
					return '<NAME>'+TEXT_SELECTION+'</NAME>';
				}
			},
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.cwrcInfo = {id: $xml.attr('ref')};
					obj.certainty = $xml.attr('cert');
					obj.type = $xml.attr('type');
					obj.role = $xml.attr('role');
					
					$xml.removeAttr('ref').removeAttr('cert').removeAttr('type').removeAttr('role');
					
					obj.attributes = getAttributesFromXml(xml);
					
					return obj;
				}
			},
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
			title: 'Organization',
			parentTag: {
				tei: 'orgName',
				events: 'ORGNAME'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<orgName';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
					
					if (info.attributes) {
						var atts = info.attributes.orgName;
						xml += getAttributeString(atts);
					}
					
					xml += '>'+TEXT_SELECTION+'</orgName>';
					return xml;
				},
				events: '<ORGNAME>'+TEXT_SELECTION+'</ORGNAME>'
			},
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.cwrcInfo = {id: $xml.attr('ref')};
					obj.certainty = $xml.attr('cert');
					
					$xml.removeAttr('ref').removeAttr('cert');
					
					obj.attributes = getAttributesFromXml(xml);
					
					return obj;
				}
			},
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
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<placeName';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
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
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.cwrcInfo = {id: $xml.attr('ref')};
					obj.certainty = $xml.attr('cert');
					obj.precision = $xml.children('precision').attr('precision');
					
					$xml.removeAttr('ref').removeAttr('cert');
					$xml.children('precision').remove();
					
					obj.attributes = getAttributesFromXml(xml);
					
					return obj;
				}
			},
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
			title: 'Text/Title',
			parentTag: {
				tei: 'title',
				events: 'TITLE'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<title';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
					if (info.certainty) xml += ' cert="'+info.certainty+'"';
					if (info.level) xml += ' level="'+info.level+'"';
					
					if (info.attributes) {
						var atts = info.attributes.title;
						xml += getAttributeString(atts);
					}
					
					xml += '>'+TEXT_SELECTION+'</title>';
					return xml;
				},
				events: '<TITLE TITLETYPE="${info.level}">'+TEXT_SELECTION+'</TITLE>'
			},
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.cwrcInfo = {id: $xml.attr('ref')};
					obj.certainty = $xml.attr('cert');
					obj.level = $xml.attr('level');
					
					$xml.removeAttr('ref').removeAttr('cert').removeAttr('level');
					
					obj.attributes = getAttributesFromXml(xml);
					
					return obj;
				}
			},
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
			title: 'Date',
			parentTag: {
				tei: 'date',
				events: 'DATE'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
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
					
					if (info.attributes) {
						var atts = info.attributes.date;
						xml += getAttributeString(atts);
					}
					
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
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.certainty = $xml.attr('cert');
					$xml.removeAttr('cert');
					
					if ($xml.attr('when')) {
						obj.date = $xml.attr('when');
						$xml.removeAttr('when');
					} else {
						obj.startDate = $xml.attr('from');
						obj.endDate = $xml.attr('to');
						$xml.removeAttr('from').removeAttr('to');
					}
					
					obj.attributes = getAttributesFromXml(xml);
					
					return obj;
				}
			},
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
		event: {
			title: 'Event',
			parentTag: {
				tei: 'event'
			},
			mapping: {
				tei: '<event cert="${info.certainty}">'+TEXT_SELECTION+'</event>'
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
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<note';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					xml += ' resp="'+getResp()+'"';
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
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.resp = $xml.attr('resp');
					obj.type = $xml.attr('type');
					obj.content = w.utilities.xmlToString(xml);
					
					return obj;
				}
			},
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
			title: 'Citation',
			parentTag: {
				tei: 'note'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<note';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					xml += ' resp="'+getResp()+'"';
					xml += ' type="citation"><bibl';
					if (info.cwrcInfo && info.cwrcInfo.id) xml += ' ref="'+info.cwrcInfo.id+'"';
					xml += '>';
					if (info.content) {
						var xmlDoc = w.utilities.stringToXML(info.content);
						var biblContent = $('bibl', xmlDoc)[0];
						xml += biblContent.innerHTML;
					}
					xml += '</bibl></note>';
					return xml;
				}
			},
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.cwrcInfo = {id: $xml.children('bibl').attr('ref')};
					obj.resp = $xml.attr('resp');
					obj.content = w.utilities.xmlToString(xml);
					
					return obj;
				}
			},
			annotationType: 'dcterms:BibliographicResource',
			annotation: function(entity, format) {
				var data = entity.annotation;
				data.cwrcInfo = entity.info.cwrcInfo;
				
				var anno = commonAnnotation({data: data, types: 'dcterms:BibliographicResource', motivations: 'cw:citing'}, format);
				
				return anno;
			}
		},
		correction: {
			title: 'Correction',
			parentTag: {
				tei: ['choice', 'corr'],
				events: 'SIC'
			},
			textTag: {
				tei: 'sic'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
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
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					if (xml.nodeName === 'choice') {
						obj.corrText = $xml.find('corr').text();
						obj.sicText = $xml.find('sic').text();
					}
					
					return obj;
				}
			},
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
			title: 'Keyword',
			parentTag: {
				tei: 'note',
				events: 'KEYWORDCLASS'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '';
					for (var i = 0; i < info.keywords.length; i++) {
						xml += '<note type="keyword"';
						if (id) xml += ' annotationId="'+id+'"';
						if (offsetId) xml += ' offsetId="'+offsetId+'"';
						xml += ' resp="'+getResp()+'"';
						xml +='><term';
						if (id) xml += ' annotationId="'+id+'"';
						xml +='>'+info.keywords[i]+'</term></note>';
					}
					return xml;
				},
				events: '<KEYWORDCLASS>'+TEXT_SELECTION+'</KEYWORDCLASS>'
			},
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.resp = $xml.attr('resp');
					obj.keywords = [$xml.children('term').text()];
					
					return obj;
				}
			},
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
			title: 'Link',
			parentTag: {
				tei: 'ref',
				events: 'XREF'
			},
			mapping: {
				tei: function(entity) {
					var info = entity.info;
					var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
					var offsetId = entity.annotation.range.cwrcOffsetId;
					
					var xml = '<ref';
					if (id) xml += ' annotationId="'+id+'"';
					if (offsetId) xml += ' offsetId="'+offsetId+'"';
					if (info.url) xml += ' target="'+info.url+'"';
					xml += '>'+TEXT_SELECTION+'</ref>';
					return xml;
				},
				events: '<XREF URL="${info.url}">'+TEXT_SELECTION+'</XREF>'
			},
			reverseMapping: {
				tei: function(xml) {
					var obj = {};
					var $xml = $(xml);
					
					obj.url = $xml.attr('target');
					
					return obj;
				}
			},
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
	 * @lends EntitiesModel.prototype
	 */
	var entmod = {};
	
	/**
	 * Checks if the tag is for an entity.
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
		var testTag;
		// TODO need way to differentiate between citation and note
		for (var e in entities) {
			testTag = entities[e].parentTag[schema];
			if (($.isArray(testTag) && testTag.indexOf(tag) !== -1) || testTag === tag) {
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
	 * Returns the mapping of xml to an entity object.
	 * @param xml {XML} The xml.
	 * @param type {String} The entity type.
	 * @param schema {String} The schema to use for the mapping.
	 * @returns {Object} The entity object.
	 */
	entmod.getReverseMapping = function(xml, type, schema) {
		var e = entities[type];
		if (e) {
			if (schema.indexOf('tei') != -1) {
				schema = 'tei';
			} else {
				schema = 'events';
			}
			
			if (e.reverseMapping && e.reverseMapping[schema]) {
				var entityObj = e.reverseMapping[schema](xml);
				return entityObj;
			}
		}
		return {};
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
				var tag = e.parentTag[schema];
				if ($.isArray(tag)) {
					tag = tag[0];
				}
				return tag;
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
	 * Returns the entity type, using a annotation string.
	 * @param {String} annotation The annotation string, e.g. 'foaf:Person'
	 * @returns {String}
	 */
	entmod.getEntityTypeForAnnotation = function(annotation) {
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
	entmod.getAnnotation = function(type, entity, format) {
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
	
	return entmod;
};

});