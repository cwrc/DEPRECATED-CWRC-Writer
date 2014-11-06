define(['jquery'], function($) {
 
/**
 * @class AnnotationsManager
 * @param {Writer} writer
 */
function AnnotationsManager(writer) {
    this.w = writer;
}

AnnotationsManager.prefixMap = {
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

AnnotationsManager.types = {
    person: 'foaf:Person',
    org: 'foaf:Organization',
    place: 'geo:SpatialThing',
    title: 'dcterms:title',
    date: 'time:TemporalEntity',
    note: 'bibo:Note',
    citation: 'dcterms:BibliographicResource',
    correction: 'oa:editing',
    keyword: 'skos:Concept',
    link: 'oa:linking'
};

/**
 * Creates a common annotation object.
 * @param {Entity} entity The entity.
 * @param {Array} types The annotation type(s).
 * @param {Array} [motivations] The annotation motivations(s).
 * @param {String} format The annotation format to return: 'json' or 'xml'.
 * @returns {JSON|XML} 
 */
AnnotationsManager.commonAnnotation = function(entity, types, motivations, format) {
    format = format || 'xml';
    
    var uris = entity.getUris();
    var certainty = entity.getAttribute('cert') || entity.getAttribute('certainty')|| entity.getAttribute('CERTAINTY');
    var range = entity.getRange();
    var cwrcInfo = entity.getLookupInfo();
    var attributes = entity.getAttributes();

    if (!$.isArray(types)) {
        types = [types];
    }
    
    if (motivations === null) {
        motivations = ['oa:tagging','oa:identifying'];
    }
    if (!$.isArray(motivations)) {
        motivations = [motivations];
    }
    
    var date = new Date().toISOString();
    var annotationId = uris.annotationId;
    var body = '';
    var annotatedById = uris.userId;
    var userName = '';
    var userMbox = '';
    var entityId = uris.entityId;
    var docId = uris.docId;
    var targetId = uris.targetId;
    var selectorId = uris.selectorId;
    
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
            var namespace = AnnotationsManager.prefixMap[prefix];
            namespaces[prefix] = 'xmlns:'+prefix+'="'+namespace+'"';
            typesString += '<rdf:type rdf:resource="'+namespace+typeParts[1]+'"/>';
        }
        
        var motivationsString = '';
        for (var i = 0; i < motivations.length; i++) {
            var motivationParts = motivations[i].split(':');
            var prefix = motivationParts[0];
            var namespace = AnnotationsManager.prefixMap[prefix];
            namespaces[prefix] = 'xmlns:'+prefix+'="'+namespace+'"';
            motivationsString += '<oa:motivatedBy rdf:resource="'+namespace+motivationParts[1]+'"/>';
        }
        
        var namespaceString = '';
        for (var prefix in namespaces) {
            namespaceString += ' '+namespaces[prefix];
        }
        
        var certaintyString = '';
        if (certainty != null) {
            // fix for discrepancy between schemas
            if (certainty === 'reasonably certain') {
                certainty = 'reasonable';
            }
            certaintyString = '<cw:hasCertainty rdf:resource="http://cwrc.ca/ns/cw#'+certainty+'"/>';
        }
        
        var selectorString = ''+
        '<rdf:Description rdf:about="'+targetId+'">'+
            '<oa:hasSource rdf:resource="'+docId+'"/>'+
            '<rdf:type rdf:resource="http://www.w3.org/ns/oa#SpecificResource"/>'+
            '<oa:hasSelector rdf:resource="'+selectorId+'"/>'+
        '</rdf:Description>';
        if (range.end) {
            selectorString += ''+
            '<rdf:Description rdf:about="'+selectorId+'">'+
                '<oa:start>xpointer(string-range('+range.start+',"",'+range.startOffset+'))</oa:start>'+
                '<oa:end>xpointer(string-range('+range.end+',"",'+range.endOffset+'))</oa:end>'+
                '<rdf:type rdf:resource="http://www.w3.org/ns/oa#TextPositionSelector"/>'+
            '</rdf:Description>';
        } else {
            selectorString += ''+
            '<rdf:Description rdf:about="'+selectorId+'">'+
                '<rdf:value>xpointer('+range.start+')</rdf:value>'+
                '<rdf:type rdf:resource="http://www.w3.org/ns/oa#FragmentSelector"/>'+
            '</rdf:Description>';
        }
        
        var cwrcInfoString = '';
        if (cwrcInfo !== undefined) {
            delete cwrcInfo.data; // remove extra XML data
            var cwrcInfo = JSON.stringify(cwrcInfo);
            cwrcInfoString = '<cw:cwrcInfo>'+cwrcInfo+'</cw:cwrcInfo>';
        }
        
        var cwrcAttributesString = '';
        if (attributes != null) {
            var cwrcAttributes = JSON.stringify(attributes);
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
            'serializedAt': date,
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
        
        if (certainty !== undefined) {
            annotation.hasCertainty = 'cw:'+certainty;
        }
        
        if (cwrcInfo !== undefined) {
            annotation.cwrcInfo = cwrcInfo;
        }
        
        if (attributes !== undefined) {
            annotation.cwrcAttributes = attributes;
        }
        
        if (range.end) {
            annotation.hasTarget.hasSelector = {
                '@id': selectorId,
                '@type': 'oa:TextPositionSelector',
                'dcterms:conformsTo': 'http://tools.ietf.org/rfc/rfc3023',
                'oa:start': 'xpointer(string-range('+range.start+',"",'+range.startOffset+'))',
                'oa:end': 'xpointer(string-range('+range.end+',"",'+range.endOffset+'))',
            };
        } else {
            annotation.hasTarget.hasSelector = {
                '@id': selectorId,
                '@type': 'oa:FragmentSelector',
                'dcterms:conformsTo': 'http://tools.ietf.org/rfc/rfc3023',
                'rdf:value': 'xpointer('+range.start+')'
            };
        }
    }
    
    return annotation;
};

AnnotationsManager.prototype = {
    constructor: AnnotationsManager,

    getResp: function() {
        return 'PLACEHOLDER_USER';
    },
    
    /**
     * Returns the entity type, using a annotation string.
     * @param {String} annotation The annotation string, e.g. 'foaf:Person'
     * @returns {String}
     */
    getEntityTypeForAnnotation: function(annotation) {
        if (annotation.indexOf('http://') !== -1) {
            // convert uri to prefixed form
            for (var prefix in AnnotationsManager.prefixMap) {
                var uri = AnnotationsManager.prefixMap[prefix];
                if (annotation.indexOf(uri) === 0) {
                    annotation = annotation.replace(uri, prefix+':');
                    break;
                }
            }
        }
        for (var entityType in AnnotationsManager.types) {
            if (AnnotationsManager.types[entityType] === annotation) {
                return entityType;
            }
        }
        
        return null;
    },
    
    /**
     * Get the annotation object for the entity.
     * @param {Entity} entity The entity.
     * @param {Object} entity.annotation The annotation data associated with the entity.
     * @param {String} format The annotation format ('xml' or 'json').
     * @returns {Object} The annotation object. 
     */
    getAnnotation: function(entity, format) {
        format = format || 'xml';
        var type = entity.getType();
        var annoMappings = this.w.schemaManager.mapper.getMappings().entities;
        var e = annoMappings[type];
        var anno;
        if (e && e.annotation !== undefined) {
            anno = e.annotation(entity, format);
            if (format === 'xml') {
                anno = anno[0].firstChild; // convert from jquery obj
            }
        }
        return anno;
    }
};

return AnnotationsManager;

});