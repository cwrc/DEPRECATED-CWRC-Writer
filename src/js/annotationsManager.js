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
            typesString += '\n\t<rdf:type rdf:resource="'+namespace+typeParts[1]+'"/>';
        }
        
        var motivationsString = '';
        for (var i = 0; i < motivations.length; i++) {
            var motivationParts = motivations[i].split(':');
            var prefix = motivationParts[0];
            var namespace = AnnotationsManager.prefixMap[prefix];
            namespaces[prefix] = 'xmlns:'+prefix+'="'+namespace+'"';
            motivationsString += '\n\t<oa:motivatedBy rdf:resource="'+namespace+motivationParts[1]+'"/>';
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
            certaintyString = '\n\t<cw:hasCertainty rdf:resource="http://cwrc.ca/ns/cw#'+certainty+'"/>';
        }
        
        var selectorString = ''+
        '\n<rdf:Description rdf:about="'+targetId+'">'+
            '\n\t<oa:hasSource rdf:resource="'+docId+'"/>'+
            '\n\t<rdf:type rdf:resource="http://www.w3.org/ns/oa#SpecificResource"/>'+
            '\n\t<oa:hasSelector rdf:resource="'+selectorId+'"/>'+
        '\n</rdf:Description>';
        if (range.end) {
            selectorString += ''+
            '\n<rdf:Description rdf:about="'+selectorId+'">'+
                '\n\t<oa:start>xpointer(string-range('+range.start+',"",'+range.startOffset+'))</oa:start>'+
                '\n\t<oa:end>xpointer(string-range('+range.end+',"",'+range.endOffset+'))</oa:end>'+
                '\n\t<rdf:type rdf:resource="http://www.w3.org/ns/oa#TextPositionSelector"/>'+
            '\n</rdf:Description>';
        } else {
            selectorString += ''+
            '\n<rdf:Description rdf:about="'+selectorId+'">'+
                '\n\t<rdf:value>xpointer('+range.start+')</rdf:value>'+
                '\n\t<rdf:type rdf:resource="http://www.w3.org/ns/oa#FragmentSelector"/>'+
            '\n</rdf:Description>';
        }
        
        var cwrcInfoString = '';
        if (cwrcInfo !== undefined) {
            delete cwrcInfo.data; // remove extra XML data
            var cwrcInfo = JSON.stringify(cwrcInfo);
            cwrcInfoString = '\n\t<cw:cwrcInfo>'+cwrcInfo+'</cw:cwrcInfo>';
        }
        
        var cwrcAttributesString = '';
        if (attributes != null) {
            var cwrcAttributes = JSON.stringify(attributes);
            cwrcAttributesString = '\n\t<cw:cwrcAttributes>'+cwrcAttributes+'</cw:cwrcAttributes>';
        }
        
        var rdfString = ''+
        '\n<rdf:RDF'+namespaceString+'>'+
            '\n<rdf:Description rdf:about="'+annotationId+'">'+
                '\n\t<oa:hasTarget rdf:resource="'+targetId+'"/>'+
                '\n\t<oa:hasBody rdf:resource="'+entityId+'"/>'+
                '\n\t<oa:annotatedBy rdf:resource="'+annotatedById+'"/>'+
                '\n\t<oa:annotatedAt>'+date+'</oa:annotatedAt>'+
                '\n\t<oa:serializedBy rdf:resource=""/>'+
                '\n\t<oa:serializedAt>'+date+'</oa:serializedAt>'+
                '\n\t<rdf:type rdf:resource="http://www.w3.org/ns/oa#Annotation"/>'+
                motivationsString+
                certaintyString+
                cwrcInfoString+
                cwrcAttributesString+
            '\n</rdf:Description>'+
            '\n<rdf:Description rdf:about="'+entityId+'">'+
                '\n\t<rdf:type rdf:resource="http://www.w3.org/ns/oa#SemanticTag"/>'+
                typesString+
            '\n</rdf:Description>'+
            selectorString+
        '\n</rdf:RDF>';
        
        annotation = $($.parseXML(rdfString));
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
    },
    
    getAnnotations: function(format) {
        format = format || 'xml';

        var namespaces = {
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'cw': 'http://cwrc.ca/ns/cw#'
        };

        var rdfString = '';

        // xml mode
        var uri = this.w.baseUrl+'editor/documents/'+this.w.currentDocId;
        rdfString += ''+
        '<rdf:Description rdf:about="'+uri+'">'+
            '\n\t<cw:mode>'+this.w.mode+'</cw:mode>'+
            '\n\t<cw:allowOverlap>'+this.w.allowOverlap+'</cw:allowOverlap>'+
        '\n</rdf:Description>';

        var me = this;
        this.w.entitiesManager.eachEntity(function(id, entity) {
            // TODO temp fix for entities that don't have URIs
            if (entity.getUris().annotationId == null) {
                // generate the URIs
                $.when(
                    me.w.delegator.getUriForEntity(entity),
                    me.w.delegator.getUriForAnnotation(),
                    me.w.delegator.getUriForDocument(),
                    me.w.delegator.getUriForTarget(),
                    me.w.delegator.getUriForSelector(),
                    me.w.delegator.getUriForUser()
                ).then(function(entityUri, annoUri, docUri, targetUri, selectorUri, userUri) {
                    entity.setUris({
                        entityId: entityUri,
                        annotationId: annoUri,
                        docId: docUri,
                        targetId: targetUri,
                        selectorId: selectorUri,
                        userId: userUri
                    });
                });
            }
            var annotation = me.getAnnotation(entity, format);

            if (format === 'xml') {
                // process namespaces
                $(annotation.attributes).each(function(index, el) {
                    if (el.prefix === 'xmlns') {
                        namespaces[el.localName] = el.value;
                    }
                });

                // get the child descriptions
                $('rdf\\:Description, Description', annotation).each(function(index, el) {
                    rdfString += '\n';
                    rdfString += me.w.utilities.xmlToString(el);
                });
            } else if (format === 'json') {
                rdfString += '\n<rdf:Description rdf:datatype="http://www.w3.org/TR/json-ld/"><![CDATA[\n';
                rdfString += JSON.stringify(annotation, null, '\t');
                rdfString += '\n]]></rdf:Description>';
            }

            // process child entities (for note, citation)
            if (entity.getNoteContent()) {
                // get the rdf and append it
                var xml = me.w.utilities.stringToXML(entity.getNoteContent());
                // TODO should RDF be in note content???
                var rdf = $('rdf\\:RDF, RDF', xml);
                $('[rdf\\:datatype]', rdf).each(function(index, el) {
                    rdfString += me.w.utilities.xmlToString(el);
                });
            }
        });

        // triples
        for (var i = 0; i < me.w.triples.length; i++) {
            var t = me.w.triples[i];

            rdfString += '\n<rdf:Description rdf:about="'+t.subject.uri+'" cw:external="'+t.subject.external+'">'+
            '\n\t<cw:'+t.predicate.name+' cw:text="'+t.predicate.text+'" cw:external="'+t.predicate.external+'">'+
            '\n\t\t<rdf:Description rdf:about="'+t.object.uri+'" cw:external="'+t.object.external+'" />'+
            '\n\t</cw:'+t.predicate.name+'>'+
            '\n</rdf:Description>';
        }

        var rdfHead = '<rdf:RDF';
        for (var name in namespaces) {
            rdfHead += ' xmlns:'+name+'="'+namespaces[name]+'"';
        }

        rdfString = rdfHead + '>\n' + rdfString + '\n</rdf:RDF>\n';

        return rdfString;
    },
    
    /**
     * Parse JSON and get an Entity config object
     * @param {Element} rdfEl An RDF element containing JSON text
     * @returns {Object|null} Entity config object
     */
    getEntityFromJsonAnnotation: function(rdfEl) {
        var newEntity = null;
        
        var rdf = $(rdfEl);
        var json = JSON.parse(rdf.text());
        if (json != null) {
            var id;
            var rangeObj;

            var rdfs = rdf.parent('rdf\\:RDF, RDF');            
            var doc = rdfs.parents().last()[0].parentNode;
            
            var selector = json.hasTarget.hasSelector;
            if (selector['@type'] == 'oa:TextPositionSelector') {
                id = this.w.getUniqueId('ent_');

                var xpointerStart = selector['oa:start'];
                var xpointerEnd = selector['oa:end'];
                var xpathStart = this._parseXpointer(xpointerStart, doc);
                var xpathEnd = this._parseXpointer(xpointerEnd, doc);

                if (xpathStart != null && xpathEnd != null) {
                    rangeObj = {
                        id: id,
                        parentStart: xpathStart.parentId,
                        startOffset: xpathStart.offset,
                        parentEnd: xpathEnd.parentId,
                        endOffset: xpathEnd.offset
                    };
                }
            } else if (selector['@type'] == 'oa:FragmentSelector') {
                var xpointer = selector['rdf:value'];
                var xpathObj = this._parseXpointer(xpointer, doc);

                id = xpathObj.parentId;

                rangeObj = {
                    id: id,
                    el: xpathObj.el,
                    parentStart: xpathObj.parentId
                };
            }

            // determine type
            var type = null;
            
            var bodyTypes = json.hasBody['@type'];
            var needsMotivation = bodyTypes.indexOf('cnt:ContentAsText') !== -1;
            if (needsMotivation) {
                bodyTypes = bodyTypes.concat(json.motivatedBy);
            }
            for (var i = 0; i < bodyTypes.length; i++) {
                var typeUri = bodyTypes[i];
                type = this.w.annotationsManager.getEntityTypeForAnnotation(typeUri);
                if (type != null) {
                    break;
                }
            }
            
            // get type specific info
            var typeInfo = {};
            var propObj = {};
            
            switch (type) {
            case 'date':
                var dateString = json.hasBody['xsd:date'];
                var dateParts = dateString.split('/');
                if (dateParts.length === 1) {
                    typeInfo.date = dateParts[0];
                } else {
                    typeInfo.startDate = dateParts[0];
                    typeInfo.endDate = dateParts[1];
                }
                break;
            case 'place':
                var precisionString = json.hasPrecision;
                if (precisionString && precisionString != '') {
                    precisionString = precisionString.split('#')[1];
                }
                propObj.precision = precisionString;
                break;
            case 'title':
                var levelString = json.hasBody.pubType;
                typeInfo.level = levelString;
                break;
            case 'correction':
                var corrString = json.hasBody['cnt:chars'];
                typeInfo.corrText = corrString;
                break;
            case 'keyword':
                var keywordsArray = json.hasBody['cnt:chars'];
                typeInfo.keywords = keywordsArray;
                break;
            case 'link':
                typeInfo.url = ''; // FIXME never used
                break;
            }
            
            // FIXME cwrcAttributes
            $.extend(propObj, typeInfo);

            newEntity = {
                id: id,
                type: type,
                attributes: json.cwrcAttributes,
                customValues: propObj,
                cwrcLookupInfo: json.cwrcInfo,
                range: rangeObj
            };
        }
        
        return newEntity;
    },
    
    /**
     * Parse XML and create a Entity config object
     * @param {Element} xml An RDF element containing XML elements
     * @returns {Object|null} Entity config object
     */
    getEntityFromXmlAnnotation: function(xml) {
        var newEntity = null;
        
        var rdf = $(xml);
        var aboutUri = rdf.attr('rdf:about');
        if (aboutUri.indexOf('id.cwrc.ca/annotation') !== -1) {
            var rdfs = rdf.parent('rdf\\:RDF, RDF');            
            var doc = rdfs.parents().last()[0].parentNode;

            var hasBodyUri = rdf.find('oa\\:hasBody, hasBody').attr('rdf:resource');
            var body = rdfs.find('[rdf\\:about="'+hasBodyUri+'"]');
            var hasTargetUri = rdf.find('oa\\:hasTarget, hasTarget').attr('rdf:resource');
            var target = rdfs.find('[rdf\\:about="'+hasTargetUri+'"]');

            // determine type
            var typeUri = body.children().last().attr('rdf:resource'); // FIXME relies on consistent order of rdf:type elements
            if (typeUri == null || typeUri.indexOf('ContentAsText') !== -1) {
                // body is external resource (e.g. link), or it's a generic type so must use motivation instead
                typeUri = rdf.find('oa\\:motivatedBy, motivatedBy').last().attr('rdf:resource');
            }
            
            if (typeUri == null) {
                if (window.console) {
                    console.warn('can\'t determine type for', xml);
                }
            } else {
                var type = this.w.annotationsManager.getEntityTypeForAnnotation(typeUri);
    
                // get type specific info
                var typeInfo = {};
                var propObj = {};
                
                switch (type) {
                    case 'date':
                        var dateString = body.find('xsd\\:date, date').text();
                        var dateParts = dateString.split('/');
                        if (dateParts.length === 1) {
                            typeInfo.date = dateParts[0];
                        } else {
                            typeInfo.startDate = dateParts[0];
                            typeInfo.endDate = dateParts[1];
                        }
                        break;
                    case 'place':
                        var precisionString = rdf.find('cw\\:hasPrecision, hasPrecision').attr('rdf:resource');
                        if (precisionString && precisionString != '') {
                            precisionString = precisionString.split('#')[1];
                        }
                        propObj.precision = precisionString;
                        break;
                    case 'title':
                        var levelString = body.find('cw\\:pubType, pubType').text();
                        typeInfo.level = levelString;
                        break;
                    case 'correction':
                        var corrString = body.find('cnt\\:chars, chars').text();
                        typeInfo.corrText = corrString;
                        break;
                    case 'keyword':
                        var keywordsArray = [];
                        body.find('cnt\\:chars, chars').each(function() {
                            keywordsArray.push($(this).text());
                        });
                        typeInfo.keywords = keywordsArray;
                        break;
                    case 'link':
                        typeInfo.url = hasBodyUri; // FIXME never used
                        break;
                }
    
                // certainty
                var certainty = rdf.find('cw\\:hasCertainty, hasCertainty').attr('rdf:resource');
                if (certainty && certainty != '') {
                    certainty = certainty.split('#')[1];
                    if (certainty === 'reasonable') {
                        // fix for discrepancy between schemas
                        certainty = 'reasonably certain';
                    }
                    propObj.certainty = certainty;
                }
    
                // cwrcInfo (from cwrcDialogs lookups)
                var cwrcLookupObj = rdf.find('cw\\:cwrcInfo, cwrcInfo').text();
                if (cwrcLookupObj != '') {
                    cwrcLookupObj = JSON.parse(cwrcLookupObj);
                } else {
                    cwrcLookupObj = {};
                }
    
                // cwrcAttributes (catch-all for properties not fully supported in rdf yet
                var cwrcAttributes = rdf.find('cw\\:cwrcAttributes, cwrcAttributes').text();
                if (cwrcAttributes != '') {
                    cwrcAttributes = JSON.parse(cwrcAttributes);
                } else {
                    cwrcAttributes = {};
                }
    
                // selector and annotation uris
                var docUri = target.find('oa\\:hasSource, hasSource').attr('rdf:resource');
                var selectorUri = target.find('oa\\:hasSelector, hasSelector').attr('rdf:resource');
                var selector = rdfs.find('[rdf\\:about="'+selectorUri+'"]');
                var selectorType = selector.find('rdf\\:type, type').attr('rdf:resource');
                var annotationObj = {
                    entityId: hasBodyUri,
                    annotationId: aboutUri,
                    targetId: hasTargetUri,
                    docId: docUri,
                    selectorId: selectorUri,
                    userId: ''
                };
    
                // range
                var rangeObj = {};
                var id;
                var el;
                // matching element
                if (selectorType.indexOf('FragmentSelector') !== -1) {
                    var xpointer = selector.find('rdf\\:value, value').text();
                    var xpathObj = this._parseXpointer(xpointer, doc);
    
                    id = xpathObj.parentId;
                    el = xpathObj.el;
                    rangeObj = {
                        id: id,
                        el: xpathObj.el,
                        parentStart: xpathObj.parentId
                    };
                // offset
                } else {
                    var xpointerStart = selector.find('oa\\:start, start').text();
                    var xpointerEnd = selector.find('oa\\:end, end').text();
                    var xpathStart = this._parseXpointer(xpointerStart, doc);
                    var xpathEnd = this._parseXpointer(xpointerEnd, doc);
    
                    id = this.w.getUniqueId('ent_');
    
                    if (xpathStart != null && xpathEnd != null) {
                        rangeObj = {
                            id: id,
                            parentStart: xpathStart.parentId,
                            startOffset: xpathStart.offset,
                            parentEnd: xpathEnd.parentId,
                            endOffset: xpathEnd.offset
                        };
                    }
                }
    
                // process the element for attributes, etc.
                var noteContent;
                if (el !== undefined) {
                    var entityType = this.w.schemaManager.mapper.getEntityTypeForTag(el[0]);
                    var info = this.w.schemaManager.mapper.getReverseMapping(el[0], entityType);
                    $.extend(propObj, info.customValues);
                    $.extend(cwrcAttributes, info.attributes);
    
                    if (type === 'note' || type === 'citation') {
                        noteContent = this.w.utilities.xmlToString(el[0]);
                        rangeObj.el.contents().remove();
                    }
                }
    
                // FIXME cwrcAttributes
                $.extend(propObj, typeInfo);
                newEntity = {
                    id: id,
                    type: type,
                    attributes: cwrcAttributes,
                    customValues: propObj,
                    noteContent: noteContent,
                    cwrcLookupInfo: cwrcLookupObj,
                    range: rangeObj,
                    uris: annotationObj
                };
            
            }
        }
        
        return newEntity;
    },
    
    _parseXpointer: function(xpointer, doc) {
        var nsr = doc.createNSResolver(doc.documentElement);
        var defaultNamespace = doc.documentElement.getAttribute('xmlns');

        function nsResolver(prefix) {
            return nsr.lookupNamespaceURI(prefix) || defaultNamespace;
        }

        // parse the xpointer, get the el associated with the xpath, assign a temp. ID for later usage
        // expected format: xpointer(string-range(XPATH,"",OFFSET))
        // regex assumes no parentheses in xpath
        function doParseXpointer(xpointer, doc) {
            var regex = new RegExp(/xpointer\((?:string-range\()?([^\)]*)\)+/); // regex for isolating xpath and offset
            var content = regex.exec(xpointer)[1];
            var parts = content.split(',');
            var xpath = parts[0];
            var offset = null;
            if (parts[2]) {
                offset = parseInt(parts[2]);
            }

            var foopath;
            if (defaultNamespace !== null) {
                foopath = xpath.replace(/\/\//g, '//foo:'); // default namespace hack (http://stackoverflow.com/questions/9621679/javascript-xpath-and-default-namespaces)
            } else {
                foopath = xpath;
            }
            var result;
            try {
                result = doc.evaluate(foopath, doc, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            } catch (e) {
                this.w.dialogManager.show('message', {
                    title: 'Error',
                    msg: 'There was an error evaluating an XPath:<br/>'+e,
                    type: 'error'
                });
            }
            if (result.singleNodeValue != null) {
                var xpathEl = $(result.singleNodeValue);

                var parentId;
                if (offset == null) {
                    parentId = xpathEl.attr('annotationId');
                } else {
                    parentId = xpathEl.attr('offsetId');
                }
                if (parentId == null) {
                    // assign a struct ID now, to associate with the entity
                    // later we'll insert it as the real struct ID value
                    if (window.console) {
                        console.warn('null ID for xpointer!');
                    }
                    parentId = this.w.getUniqueId('struct_');
                } else {
                    var idNum = parseInt(parentId.split('_')[1]);
                    if (idNum >= tinymce.DOM.counter) tinymce.DOM.counter = idNum+1;
                }
                xpathEl.attr('cwrcStructId', parentId);

                return {
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
        
        return doParseXpointer(xpointer, doc);
    },
    
    /**
     * Parses the RDF and adds entities to the EntitiesManager.
     * Also processes any relations/triples.
     * @param {Element} rdfEl RDF parent element
     */
    setAnnotations: function(rdfEl) {
        this.w.entitiesManager.reset();
        this.w.deletedEntities = {};
        
        var rdfs = $(rdfEl);
        
        var triples = [];
        rdfs.children().each(function(index, el) {
            var rdf = $(el);

            // json-ld
            if (rdf.attr('rdf:datatype') == 'http://www.w3.org/TR/json-ld/') {
                var entityConfig = this.getEntityFromJsonAnnotation(rdf[0]);
                if (entityConfig != null) {
                    this.w.entitiesManager.addEntity(entityConfig);
                }
            // rdf/xml
            } else if (rdf.attr('rdf:about')) {
                var entityConfig = this.getEntityFromXmlAnnotation(rdf[0]);
                if (entityConfig != null) {
                    this.w.entitiesManager.addEntity(entityConfig);
                }
            // triple
            } else if (rdf.attr('cw:external')){
                triples.push(rdf);
            }
        }.bind(this));
        
        this._processTriples(triples);
    },
    
    _processTriples: function(triples) {
        this.w.triples = [];
        
        for (var i = 0; i < triples.length; i++) {
            var subject = triples[i];
            var subjectUri = subject.attr('rdf:about');
            var predicate = subject.children().first();
            var object = subject.find('rdf\\:Description, Description');
            var objectUri = object.attr('rdf:about');

            var subEnt = null;
            var objEnt = null;
            this.w.entitiesManager.eachEntity(function(id, ent) {
                if (ent.getUris().annotationId === subjectUri) {
                    subEnt = ent;
                }
                if (ent.getUris().annotationId === objectUri) {
                    objEnt = ent;
                }
                if (subEnt != null && objEnt != null) {
                    return false;
                }
            });

            if (subEnt != null && objEnt != null) {
                var subExt = subject.attr('cw:external') == 'true' ? true : false;
                var predExt = predicate.attr('cw:external') == 'true' ? true : false;
                var objExt = object.attr('cw:external') == 'true' ? true : false;
                var triple = {
                    subject: {
                        uri: subjectUri,
                        text: subExt ? subjectUri : subEnt.getTitle(),
                        external: subExt
                    },
                    predicate: {
                        text: predicate.attr('cw:text'),
                        name: predicate[0].nodeName.split(':')[1],
                        external: predExt
                    },
                    object: {
                        uri: objectUri,
                        text: objExt ? objectUri : objEnt.getTitle(),
                        external: objExt
                    }
                };
                this.w.triples.push(triple);
            }
        }
    }
};

return AnnotationsManager;

});