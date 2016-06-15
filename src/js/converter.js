/**
 * Converts between CWRCWriter format and XML format.
 */
define(['jquery','tinymce'], function($, tinymce) {

/**
 * @class Converter
 * @param {Writer} writer
 */
return function(writer) {
    var w = writer;

    $(document.body).append(''+
        '<div id="entitiesConverter"></div>' // used by converter.convertTextForExport
    );

    /**
     * @lends Converter.prototype
     */
    var converter = {};

    // a list of reserved attribute names that are used by the editor
    converter.reservedAttributes = {
        '_entity': true,
        '_type': true,
        '_tag': true,
        '_textallowed': true,
        'id': true,
        'name': true,
        'class': true
    };


    /////////////////////////////////////////////////////////////////////
    // CWRCWriter -> XML Methods
    /////////////////////////////////////////////////////////////////////



    /**
     * Gets the content of the document, converted from internal format to the schema format
     * @param includeRDF True to include RDF in the header
     * @param separateRDF True to return RDF as a separate string (in an object)
     * @returns {String|Object}
     */
    converter.getDocumentContent = function(includeRDF, separateRDF) {
        // remove highlights
        w.entitiesManager.highlightEntity();

        var xmlString = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xmlString += '<?xml-model href="'+w.schemaManager.getCurrentSchema().url+'" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>\n';
        var currentCSS = w.schemaManager.currentCSS || w.schemaManager.getCurrentSchema().cssUrl;
        xmlString += '<?xml-stylesheet type="text/css" href="'+currentCSS+'"?>\n';
        

        var body = $(w.editor.getBody());
        var clone = body.clone(false, true); // make a copy, don't clone body events, but clone child events

        _recursiveTextConversion(body);

        // get the overlapping entity IDs, in the order that they appear in the document.
        var entNodes = $('[_entity][class~="start"]', body).not('[_tag]').not('[_note]');
        var entIds = $.map(entNodes, function(val, index) {
            return $(val).attr('name');
        });

        // get ranges for overlapping entities
        // then remove the associated nodes
        $(entIds).each(function(index, id) {
            var range = getRangesForEntity(id);
            var entry = w.entitiesManager.getEntity(id);
            // TODO make sure this is working
            $.extend(entry.getRange(), range);
            $('[name="'+id+'"]', body).each(function(index, el) {
                $(el).contents().unwrap();
            });
        });

        // RDF
        
        var rdfString = '';
        if (w.mode === w.RDF || (w.mode === w.XMLRDF && includeRDF)) {
            var rdfmode = 'xml';
            rdfString = buildAnnotations(rdfmode);
        }
        if (w.mode === w.RDF) {
            return rdfString;
        }
        
        // XML
        
        var root = body.children('[_tag='+w.root+']');
        // make sure the root has the right namespaces for validation purposes
        var struct = w.structs[root.attr('id')];
        // add them to the structs entry and they'll get added to the markup later
        struct['xmlns:cw'] = 'http://cwrc.ca/ns/cw#';
        if (w.root === 'TEI') {
            struct['xmlns'] = 'http://www.tei-c.org/ns/1.0';
        }
        if (includeRDF) {
            struct['xmlns:rdf'] = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
        } else {
            delete struct['xmlns:rdf'];
        }

        var tags = _nodeToStringArray(root);
        xmlString += tags[0];

        var bodyString = '';
        root.contents().each(function(index, el) {
            if (el.nodeType == 1) {
                bodyString += converter.buildXMLString($(el));
            } else if (el.nodeType == 3) {
                bodyString += el.data;
            }
        });
        bodyString = bodyString.replace(/\uFEFF/g, ''); // remove characters inserted by node selecting

        body.replaceWith(clone);

        if (includeRDF === false) {
            // strip out RDF related ids
            bodyString = bodyString.replace(/\s?(annotation|offset)Id=".*?"/g, '');
        }

        if (separateRDF) {
            xmlString = bodyString + tags[1];
            return {xml: xmlString, rdf: rdfString};
        } else {
            xmlString += rdfString + bodyString + tags[1];
            return xmlString;
        }
    };

    // gets any metadata info for the node and adds as attributes
    // returns an array of 2 strings: opening and closing tags
    function _nodeToStringArray(node) {
        var array = [];
        var id = node.attr('id');
        var tag = node.attr('_tag');

        var structEntry = w.structs[id];
        var entityEntry = w.entitiesManager.getEntity(id);
        if (entityEntry && tag) {
            array = w.schemaManager.mapper.getMapping(entityEntry);
        } else if (structEntry) {
            var openingTag = '<'+tag;
            var cwrcAnnotationId = node[0].getAttribute('annotationId');
            if (cwrcAnnotationId != null) {
                openingTag += ' annotationId="'+cwrcAnnotationId+'"';
            }
            var cwrcOffsetId = node[0].getAttribute('offsetId');
            if (cwrcOffsetId != null) {
                openingTag += ' offsetId="'+cwrcOffsetId+'"';
            }
            for (var key in structEntry) {
                if (key.indexOf('_') != 0) {
                    var attName = key;
                    var attValue = structEntry[key];
                    if (attName == 'id') {
                        // leave out IDs
//                        attName = w.idName;
                    } else {
                        var validVal = converter.convertTextForExport(attValue);
                        openingTag += ' '+attName+'="'+validVal+'"';
                    }
                }
            }
            openingTag += '>';
            array.push(openingTag);
            array.push('</'+tag+'>');
        } else {
            // not a valid tag so return empty strings
            array = ['', ''];
        }

        return array;
    }

    /**
     * Converts the editor node and its contents into an XML string suitable for export.
     * @param node A jQuery node.
     * @returns {String}
     */
    converter.buildXMLString = function(node) {
        var xmlString = '';

        function doBuild(currentNode) {
            var tags = _nodeToStringArray(currentNode);
            xmlString += tags[0];
            currentNode.contents().each(function(index, el) {
                if (el.nodeType == Node.ELEMENT_NODE) {
                    doBuild($(el));
                } else if (el.nodeType == Node.TEXT_NODE) {
                    xmlString += el.data;
                }
            });
            xmlString += tags[1];
        }

        doBuild(node);
        return xmlString;
    };

    /**
     * Constructs the annotations string for the header.
     * @param {String} format What format to build the annotations with: 'xml' or 'json'.
     * @returns {String}
     */
    function buildAnnotations(format) {
        format = format || 'xml';

        var namespaces = {
            'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
            'cw': 'http://cwrc.ca/ns/cw#'
        };

        var rdfString = '';

        // xml mode
        var uri = w.baseUrl+'editor/documents/'+w.currentDocId;
        rdfString += '<rdf:Description rdf:about="'+uri+'">\n\t<cw:mode>'+w.mode+'</cw:mode>\n\t<cw:allowOverlap>'+w.allowOverlap+'</cw:allowOverlap>\n</rdf:Description>';

        var body = w.editor.getBody();
        w.entitiesManager.eachEntity(function(id, entity) {
            // TODO temp fix for entities that don't have URIs
            if (entity.getUris().annotationId == null) {
                // generate the URIs
                $.when(
                    w.delegator.getUriForEntity(entity),
                    w.delegator.getUriForAnnotation(),
                    w.delegator.getUriForDocument(),
                    w.delegator.getUriForTarget(),
                    w.delegator.getUriForSelector(),
                    w.delegator.getUriForUser()
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
            var annotation = getAnnotationForEntity(id, format);

            if (format === 'xml') {
                // process namespaces
                $(annotation.attributes).each(function(index, el) {
                    if (el.prefix === 'xmlns') {
                        namespaces[el.localName] = el.value;
                    }
                });

                // get the child descriptions
                $('rdf\\:Description, Description', annotation).each(function(index, el) {
                    rdfString += w.utilities.xmlToString(el);
                });
            } else if (format === 'json') {
                rdfString += '\n<rdf:Description rdf:datatype="http://www.w3.org/TR/json-ld/"><![CDATA[\n';
                rdfString += JSON.stringify(annotation, null, '\t');
                rdfString += '\n]]></rdf:Description>';
            }

            // process child entities (for note, citation)
            if (entity.getCustomValues().entities && entity.getCustomValues().content) {
                // get the rdf and append it
                var xml = w.utilities.stringToXML(entity.getCustomValues().content);
                var rdf = $('rdf\\:RDF, RDF', xml);
                $('[rdf\\:datatype]', rdf).each(function(index, el) {
                    rdfString += w.utilities.xmlToString(el);
                });
            }
        });

        // triples
        for (var i = 0; i < w.triples.length; i++) {
            var t = w.triples[i];

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
    }

    /**
     * Determines the range that an entity spans, using xpath and character offset.
     * @param {String} entityId The id for the entity
     * @returns {JSON} The range object
     */
    function getRangesForEntity(entityId) {
        var range = {};

        function getOffsetFromParentForEntity(id, parent, isEnd) {
            var offset = 0;

            // Recursive function counts the number of characters in the offset,
            // recurses down overlapping entities and counts their characters as well.
            // Since entity tags are created when a document is loaded we must count
            // the characters inside of them. We can ignore _tag elements though in the
            // count as they will be present when the document is loaded.
            function getOffset(parent) {
                // To allow this function to exit recursion it must be able to return false.
                var ret = true;
                parent.contents().each(function(index, element) {
                    var el = $(this), start, end, finished;
                    if (el.attr('name') === id) {
                        // Some tags are not the start or the end, they are used for
                        // highlighting the entity.
                        start = el.hasClass('start');
                        end = el.hasClass('end');
                        finished = (start && !isEnd) || (end && isEnd);
                        // Always count the content length if looking for the end.
                        if (isEnd) {
                            offset += el.text().length;
                        }
                        if (finished) {
                            ret = false;
                            return ret;
                        }
                    }
                    // Not sure why the &nbsp; text nodes would not be counted but as long
                    // as we are consistent in both the saving and loading it should be
                    // fine.
                    else if (this.nodeType === Node.TEXT_NODE && this.data !== ' ') {
                        // Count all the text!
                        offset += this.length;
                    }
                    // An Tag or an Entity that is not the one we're looking for.
                    else {
                        // We must use all intermediate node's text to ensure an accurate
                        // text count. As the order in which entities are wrapped in spans
                        // when the document is loaded will not be guarantee to be in an
                        // order in which replicates the state the document was in at the
                        // time it was saved.
                        ret = getOffset(el);
                        return ret;
                    }
                });
                return ret;
            }

            getOffset(parent);
            return offset;
        }

        function doRangeGet($el, isEnd) {
            var parent = $el.parents('[_tag]').first();
            var parentId = parent.attr('id');
            if (parentId == null) {
                parentId = w.getUniqueId('struct_');
            } else if (w.entitiesManager.getEntity(parentId) !== undefined) {
                w.entitiesManager.getEntity(parentId).getRange().offsetId = parentId;
            }
            parent.attr('offsetId', parentId);
            var xpath = '//'+parent.attr('_tag')+'[@offsetId="'+parentId+'"]';
            var offset = getOffsetFromParentForEntity(entityId, parent, isEnd);
            return [xpath, offset];
        }

        var entitySpans = $('[name="'+entityId+'"]', w.editor.getBody());
        var entityStart = entitySpans.first();
        var entityEnd = entitySpans.last();

        var infoStart = doRangeGet(entityStart, false);
        range.start = infoStart[0];
        range.startOffset = infoStart[1];

        var infoEnd = doRangeGet(entityEnd, true);
        range.end = infoEnd[0];
        range.endOffset = infoEnd[1];

        return range;
    }

    /**
     * Sets annotation info in the entity entry, and returns a string representation of it. Must call after convertEntityToTag.
     * @param {String} entityId The id for the entity
     * @param {String} format What format to build the annotation with: 'xml' or 'json'
     * @returns {XML|JSON} What's returned depends on the mode parameter
     */
    function getAnnotationForEntity(entityId, format) {
        var entry = w.entitiesManager.getEntity(entityId);

        var entity = $('#'+entityId, w.editor.getBody());
        if (entity.length === 0) {
//            range = getRangesForEntity(entityId);
            // TODO fill this in
        } else {
            // get the xpath for the entity's tag
            entity[0].setAttribute('annotationId', entityId);
            var range = {};
            var tag = entry.getTag();
            range.start = '//'+tag+'[@annotationId="'+entityId+'"]';
            range.annotationId = entityId;
            $.extend(entry.getRange(), range);
        }

        var annotation = w.annotationsManager.getAnnotation(entry, format);
        return annotation;
    }

    
    function _recursiveTextConversion(parentNode) {
        var contents = $(parentNode).contents();
        contents.each(function(index, el) {
            if (el.nodeType == Node.TEXT_NODE) {
                el.nodeValue = converter.convertTextForExport(el.nodeValue);
            } else if (el.nodeType == Node.ELEMENT_NODE) {
                // convert attributes
//                for (var i = 0; i < el.attributes.length; i++) {
//                    var attr = el.attributes[i];
//                    attr.value = converter.convertTextForExport(attr.value);
//                }
                
                _recursiveTextConversion(el);
            }
        });
    };
    
    /**
     * Converts HTML entities to unicode, while preserving those that must be escaped as entities.
     * @param {String} text The text to convert
     */
    converter.convertTextForExport = function(text) {
        var newText = text;
        if (newText.match(/&.+?;/gim)) { // match all entities
            $('#entitiesConverter')[0].innerHTML = newText;
            newText = $('#entitiesConverter')[0].innerText || $('#entitiesConverter')[0].firstChild.nodeValue;
        }
        // the following characters must be escaped
        newText = newText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return newText;
    }
    

    /**
     * For debug
     */
    converter.getEntityOffsets = function() {
        var body = $(w.editor.getBody());
        var offsets = _getNodeOffsetsFromParent(body);
        var ents = [];
        for (var i = 0; i < offsets.length; i++) {
            var o = offsets[i];
            if (o.entity) {
                ents.push(o);
            }
        }
        return ents;
    };

    /**
     * Get character offsets for a node.
     * @param {Node} parent The node to start calculating offsets from.
     * @returns Array
     */
    function _getNodeOffsetsFromParent(parent) {
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
                        length: w.entitiesManager.getEntity(id).getContent().length,
                        entity: true
                    });
                }
            });
        }

        getOffsets(parent);
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



    /////////////////////////////////////////////////////////////////////
    // XML -> CWRCWriter Methods
    /////////////////////////////////////////////////////////////////////


    /**
     * Processes a document and loads it into the editor.
     * @fires Writer#documentLoaded
     * @param doc An XML DOM
     * @param [schemaIdOverride] The (optional) schemaId to use (overrides document schema)
     */
    converter.processDocument = function(doc, schemaIdOverride) {
        var schemaId = schemaIdOverride;
        var cssUrl;
        var loadSchemaCss = true; // whether to load schema css

        // TODO need a better way of tying this to the schemas config
        
        if (schemaId === undefined) {
            // grab the schema (and css) from xml-model
            for (var i = 0; i < doc.childNodes.length; i++) {
                var node = doc.childNodes[i];
                if (node.nodeName === 'xml-model') {
                    var xmlModelData = node.data;
                    var schemaUrl = xmlModelData.match(/href="([^"]*)"/)[1];
                    // Search the known schemas, if the url matches it must be the same one.
                    $.each(w.schemaManager.schemas, function(id, schema) {
                        var aliases = schema.aliases || [];
                        if (schemaUrl == schema.url || $.inArray(schemaUrl, aliases) !== -1) {
                            schemaId = id;
                            return false;
                        }
                    });
                    
                    if (schemaId === undefined) {
                        schemaId = 'customSchema';
                        w.schemaManager.schemas.customSchema = {
                            name: 'Custom Schema',
                            url: schemaUrl
                        };
                    }
                } else if (node.nodeName === 'xml-stylesheet') {
                    var xmlStylesheetData = node.data;
                    cssUrl = xmlStylesheetData.match(/href="([^"]*)"/)[1];
                }
            }
        }

        if (cssUrl !== undefined) {
            loadSchemaCss = false;
            w.schemaManager.loadSchemaCSS(cssUrl);
        }

        // TODO this shouldn't be hardcoded
        if (schemaId === undefined) {
            // determine the schema based on the root element
            var root = doc.firstElementChild;
            var rootName = root.nodeName.toLowerCase();
            if (rootName === 'tei') {
                schemaId = 'tei';
            } else if (rootName === 'events') {
                schemaId = 'events';
            } else if (rootName === 'biography') {
                schemaId = 'biography';
            } else if (rootName === 'writing') {
                schemaId = 'writing';
            } else if (rootName === 'cwrc') {
                schemaId = 'cwrcEntry';
            }
        }

        if (schemaId === undefined) {
            w.dialogManager.show('message', {
                title: 'Error',
                msg: 'Couldn\'t load the document because the schema could not be determined.',
                type: 'error'
            });
        } else {
            if (schemaId !== w.schemaManager.schemaId) {
                w.schemaManager.loadSchema(schemaId, false, loadSchemaCss, function() {
                    doProcessing(doc);
                });
            } else {
                doProcessing(doc);
            }
        }
    };

    function doProcessing(doc) {
        // reset the stores
        w.entitiesManager.reset();
        w.structs = {};
        w.triples = [];
        w.deletedEntities = {};
        w.deletedStructs = {};

        var rdfs = $(doc).find('rdf\\:RDF, RDF');

        var overlapSetFromHeader = false;
        // process RDF and/or entities
        if (rdfs.length) {
            var mode = parseInt(rdfs.find('cw\\:mode, mode').first().text());
            if (mode === w.XML) {
                w.mode = w.XML;
            } else {
                w.mode = w.XMLRDF;
            }

            var allowOverlap = rdfs.find('cw\\:allowOverlap, allowOverlap').first().text();
            w.allowOverlap = allowOverlap === 'true';
            overlapSetFromHeader = true;

            processRdf(rdfs);
            rdfs.remove();
        } else {
            w.mode = w.XMLRDF;
            w.allowOverlap = false;
            processEntities($(w.root+', '+w.root.toLowerCase(), doc));
        }

        // FIXME temp fix until document format is correct
        var root = $(w.root+', '+w.root.toLowerCase(), doc)[0];

        if (root != null) {
            var editorString = converter.buildEditorString(root);
            w.editor.setContent(editorString, {format: 'raw'}); // format is raw to prevent html parser and serializer from messing up whitespace

            insertEntities();
            if (!overlapSetFromHeader) {
                var isOverlapping = w.utilities.doEntitiesOverlap();
                if (isOverlapping) {
                    w.allowOverlap = true;
                } else {
                    w.allowOverlap = false;
                }
            }

            w.event('documentLoaded').publish(w.editor.getBody());

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

            if (w.isReadOnly !== true) {
                var msg;
                if (w.mode === w.XML) {
                    msg = '<b>XML only</b><br/>Only XML tags and no RDF/Semantic Web annotations will be created.';
                } else {
                    if (w.allowOverlap) {
                        msg = '<b>XML and RDF (overlap)</b><br/>XML tags and RDF/Semantic Web annotations equivalent to the XML tags will be created, to the extent that the hierarchy of the XML schema allows. Annotations that overlap will be created in RDF only, with no equivalent XML tags.';
                    } else {
                        msg = '<b>XML and RDF (no overlap)</b><br/>XML tags and RDF/Semantic Web annotations equivalent to the XML tags will be created, consistent with the hierarchy of the XML schema, so annotations will not be allowed to overlap.';
                    }
                }
    
                w.dialogManager.show('message', {
                    title: 'CWRC-Writer Mode',
                    msg: msg,
                    type: 'info'
                });
            }
        } else {
            w.dialogManager.show('message', {
                title: 'Error',
                msg: 'Couldn\'t load the document because the root ('+w.root+') was not found.',
                type: 'error'
            });
        }
    }

    // Needs to be public, to be able to process documents after the schema
    // changes.
    converter.doProcessing = doProcessing;

    function processRdf(rdfs) {
        var doc = rdfs.parents().last()[0].parentNode;

        var nsr = doc.createNSResolver(doc.documentElement);
        var defaultNamespace = doc.documentElement.getAttribute('xmlns');

        function nsResolver(prefix) {
            return nsr.lookupNamespaceURI(prefix) || defaultNamespace;
        }

        // parse the xpointer, get the el associated with the xpath, assign a temp. ID for later usage
        // expected format: xpointer(string-range(XPATH,"",OFFSET))
        // regex assumes no parentheses in xpath
        function parseXpointer(xpointer, doc) {
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
                w.dialogManager.show('message', {
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
                    parentId = w.getUniqueId('struct_');
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

        // store triples and process later
        var triples = [];

        rdfs.children().each(function() {
            var rdf = $(this);

            // json-ld
            if (rdf.attr('rdf:datatype') == 'http://www.w3.org/TR/json-ld/') {
                var entity = JSON.parse(rdf.text());
                if (entity != null) {
                    var id;
                    var rangeObj;

                    var selector = entity.hasTarget.hasSelector;
                    if (selector['@type'] == 'oa:TextPositionSelector') {
                        id = w.getUniqueId('ent_');

                        var xpointerStart = selector['oa:start'];
                        var xpointerEnd = selector['oa:end'];
                        var xpathStart = parseXpointer(xpointerStart, doc);
                        var xpathEnd = parseXpointer(xpointerEnd, doc);

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
                        var xpathObj = parseXpointer(xpointer, doc);

                        id = xpathObj.parentId;

                        rangeObj = {
                            id: id,
                            el: xpathObj.el,
                            parentStart: xpathObj.parentId
                        };
                    }

                    var atts = entity.cwrcAttributes.attributes;
                    delete entity.cwrcAttributes.attributes;
                    var cwrcInfo = entity.cwrcAttributes.cwrcInfo;
                    delete entity.cwrcAttributes.cwrcInfo;

                    var newEntity = w.entitiesManager.addEntity({
                        id: id,
                        type: entity.cwrcType,
                        attributes: atts,
                        customValues: entity.cwrcAttributes,
                        cwrcLookupInfo: cwrcInfo,
                        range: rangeObj
                    });
                }

            // triple
            } else if (rdf.attr('cw:external')){
                triples.push(rdf);

            // rdf/xml
            } else if (rdf.attr('rdf:about')) {
                var aboutUri = rdf.attr('rdf:about');

                if (aboutUri.indexOf('id.cwrc.ca/annotation') !== -1) {
                    var hasBodyUri = rdf.find('oa\\:hasBody, hasBody').attr('rdf:resource');
                    var body = rdfs.find('[rdf\\:about="'+hasBodyUri+'"]');
                    var hasTargetUri = rdf.find('oa\\:hasTarget, hasTarget').attr('rdf:resource');
                    var target = rdfs.find('[rdf\\:about="'+hasTargetUri+'"]');

                    // determine type
                    var typeUri = body.children().last().attr('rdf:resource');
                    if (typeUri == null || typeUri.indexOf('ContentAsText') !== -1) {
                        // body is external resource (e.g. link), or it's a generic type so must use motivation instead
                        typeUri = rdf.find('oa\\:motivatedBy, motivatedBy').last().attr('rdf:resource');
                    }
                    var type = w.annotationsManager.getEntityTypeForAnnotation(typeUri);

                    // get type specific info
                    // TODO move all this to annotationsManager?
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
                            typeInfo.url = hasBodyUri;
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
                        var xpathObj = parseXpointer(xpointer, doc);

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
                        var xpathStart = parseXpointer(xpointerStart, doc);
                        var xpathEnd = parseXpointer(xpointerEnd, doc);

                        id = w.getUniqueId('ent_');

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
                    if (el !== undefined) {
                        var entityType = w.schemaManager.mapper.getEntityTypeForTag(el[0]);
                        var info = w.schemaManager.mapper.getReverseMapping(el[0], entityType);
                        $.extend(propObj, info.customValues);
                        $.extend(cwrcAttributes, info.attributes);

                        if (type === 'note' || type === 'citation') {
//                            typeInfo.content = w.utilities.xmlToString(el[0]);
                            rangeObj.el.contents().remove();
                        }
                    }

                    // FIXME cwrcAttributes
                    $.extend(propObj, typeInfo);
                    var newEntity = w.entitiesManager.addEntity({
                        id: id,
                        type: type,
                        attributes: cwrcAttributes,
                        customValues: propObj,
                        cwrcLookupInfo: cwrcLookupObj,
                        range: rangeObj,
                        uris: annotationObj
                    });
                }
            }
        });

        for (var i = 0; i < triples.length; i++) {
            var subject = triples[i];
            var subjectUri = subject.attr('rdf:about');
            var predicate = subject.children().first();
            var object = subject.find('rdf\\:Description, Description');
            var objectUri = object.attr('rdf:about');

            var subEnt = null;
            var objEnt = null;
            w.entitiesManager.eachEntity(function(id, ent) {
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
                w.triples.push(triple);
            }
        }
    }

    /**
     * Recursively builds offset info from entity tags.
     */
    function processEntities(parent) {
        parent.contents().each(function(index, element) {
            if (this.nodeType !== Node.TEXT_NODE) {
                var node = $(this);
                if (node.attr('annotationId')) {
                    var entityType = processEntity(this);
                    if (entityType !== 'note' && entityType !== 'citation') {
                        // TODO test handling for entities inside correction and keyword
                        processEntities(node);
                    }
                } else {
                    processEntities(node);
                }
            }
        });
    }

    /**
     * Process the tag of an entity, and creates a new entry in the manager.
     * @param {Element} el The XML element
     * @returns {String} entityType
     */
    function processEntity(el) {
        var node = $(el);
        var id = w.getUniqueId('ent_');

        var structId = w.getUniqueId('struct_');
        node.attr('cwrcStructId', structId);

        var entityType = w.schemaManager.mapper.getEntityTypeForTag(el);

        var info = w.schemaManager.mapper.getReverseMapping(el, entityType);

        var config = {
            id: id,
            type: entityType,
            attributes: info.attributes,
            customValues: info.customValues,
            cwrcLookupInfo: info.cwrcInfo,
            range: {
                id: id,
                parentStart: structId
            }
        };
        if (info.properties !== undefined) {
            for (var key in info.properties) {
                config[key] = info.properties[key];
            }
        }

        var entity = w.entitiesManager.addEntity(config);

        return entityType;
    }

    /**
     * Takes a document node and returns a string representation of its
     * contents, compatible with the editor. Additionally creates w.structs
     * entries.
     *
     * @param node
     *            An (X)HTML element
     * @returns {String}
     */
    converter.buildEditorString = function(node) {
        var editorString = '';

        function doBuild(currentNode, forceInline) {
            var tag = currentNode.nodeName;
            var $node = $(currentNode);

            // TODO ensure that block level elements aren't inside inline level elements, the inline parent will be removed by the browser
            // temp fix: force inline level for children if parent is inline

            var isEntity = $node.attr('annotationId') != null; // temp entity tag needs to be inline, otherwise spaces around entity text will disappear
            var tagName;
            if (forceInline) {
                tagName = 'span';
            } else {
                tagName = w.utilities.getTagForEditor(tag);
            }

            editorString += '<'+tagName+' _tag="'+tag+'"';

            // create structs entries while we build the string

            // determine the ID
            // first check our special cwrcStructId attribute, finally generate a new one
            var id = $node.attr('id');
            if (id !== undefined) {
                if (window.console) {
                    console.warn('Node already had ID!', id);
                }
                $node.removeAttr('id');
            }
            id = $node.attr('cwrcStructId');
            $node.removeAttr('cwrcStructId');
            if (id === undefined) {
                id = w.getUniqueId('struct_');
            }
            editorString += ' id="'+id+'"';

            var idNum = parseInt(id.split('_')[1], 10);
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

                if (converter.reservedAttributes[attName] !== true) {
                    editorString += ' '+attName+'="'+att.value+'"';
                }

                if (attName !== 'annotationId' && attName !== 'offsetId') {
                    w.structs[id][attName] = att.value;
                }
            });

            if ($node.is(':empty')) {
                editorString += '>\uFEFF</'+tagName+'>'; // need \uFEFF otherwise a <br> gets inserted
            } else {
                editorString += '>';

                var isInline = forceInline || !w.utilities.isTagBlockLevel(tag);

                $node.contents().each(function(index, el) {
                    if (el.nodeType == 1) {
                        doBuild(el, isInline);
                    } else if (el.nodeType == 3) {
                        editorString += el.data;
                    }
                });

                editorString += '</'+tagName+'>';
            }
        }

        doBuild(node, false);
        return editorString;
    };

    function insertEntities() {
        // editor needs focus in order for entities to be properly inserted
        w.editor.focus();

        var entityNodes = []; // keep track of the nodes so we can remove them afterwards

        var body = w.editor.getBody();
        // insert entities
        // TODO handling for recursive entities (notes, citations)
        var entry, range, parent, contents, lengthCount, match, matchingNode, startOffset, endOffset, startNode, endNode;
        w.entitiesManager.eachEntity(function(id, entry) {
            matchingNode = null;
            startNode = null;
            endNode = null;
            startOffset = 0;
            endOffset = 0;

            range = entry.getRange();

            // just rdf, no markup
            if (range.parentEnd) {
                var parent = $('#'+range.parentStart, body);
                var result = _getTextNodeFromParentAndOffset(parent, range.startOffset);
                startNode = result.textNode;
                startOffset = result.offset;
                parent = $('#'+range.parentEnd, body);
                result = _getTextNodeFromParentAndOffset(parent, range.endOffset);
                endNode = result.textNode;
                endOffset = result.offset;
            // markup
            } else if (range.parentStart) {
                var entityNode = $('#'+range.parentStart, body);
                startNode = entityNode[0];
                endNode = entityNode[0];

                entityNodes.push({entity: entry, node: entityNode});
            }

            if (startNode != null && endNode != null) {
                var type = entry.getType();
                try {
                    if (startNode != endNode) {
                        var range = w.editor.selection.getRng(true);
                        range.setStart(startNode, startOffset);
                        range.setEnd(endNode, endOffset);
                        w.tagger.insertBoundaryTags(id, type, range, entry.getTag());
                    } else {
                        // then tag already exists
                        $(startNode).attr({
                            '_entity': true,
                            '_type': type,
                            'class': 'entity start end '+type,
                            'name': id,
                            'id': id
                        });
                    }
                    if (entry.getContent() === undefined) {
                        // get and set the text content
                        // TODO remove schema specific properties
                        var content = '';
                        if (type === 'note' || type === 'citation') {
                            content = $($.parseXML(entry.getCustomValues().content)).text();
                        } else if (type === 'keyword') {
                            content = entry.getCustomValues().keywords.join(', ');
                        } else if (type === 'correction') {
                            content = entry.getCustomValues().corrText;
                        } else {
                            w.entitiesManager.highlightEntity(); // remove highlight
                            w.entitiesManager.highlightEntity(id);
                            content = $('.entityHighlight', body).text();
                            w.entitiesManager.highlightEntity();
                        }
                        entry.setContent(content);

                        // finish with triples
                        for (var i = 0; i < w.triples.length; i++) {
                            var trip = w.triples[i];
                            if (trip.subject.uri === entry.getUris().annotationId) {
                                trip.subject.text = entry.getTitle();
                            }
                            if (trip.object.uri === entry.getUris().annotationId) {
                                trip.object.text = entry.getTitle();
                            }
                        }
                    }
                } catch (e) {
                    if (window.console) {
                        console.warn(e);
                    }
                }
            }
        });

        // remove all the entity markup
        $.each(entityNodes, function(index, info) {
            var entity = info.entity;
            var $node = info.node;

            var type = entity.getType();
            //    var tag = $(node).attr('_tag');
            //    var type = w.schemaManager.mapper.getEntityTypeForTag(node);

            var textTagName = w.schemaManager.mapper.getTextTag(type);
            if (textTagName !== '') {
                var selector;
                if ($.isArray(textTagName)) {
                    selector = '';
                    $.each(textTagName, function(i, tag) {
                        selector += '[_tag="'+tag+'"]';
                        if (i < textTagName.length - 1) {
                            selector += ',';
                        }
                    });
                } else {
                    selector = '[_tag="'+textTagName+'"]';
                }
                var textTag = $(selector, $node).first();
                if (type === 'correction') {
                    entity.getCustomValues().sicText = textTag.text();
                }
                textTag.contents().unwrap(); // keep the text inside the textTag
            }

            var annotationId = $node.attr('annotationId');
            $('[annotationId="'+annotationId+'"]', $node).remove(); // remove all child elements with matching ID

            var id = $node.attr('id');
            var structsEntry = w.structs[id];
            if (structsEntry !== undefined) {
                delete structsEntry;
            }

            /*
            var contents = $node.contents();
            if (contents.length === 0) {
                // no contents so just remove the node
                $node.remove();
            } else {
                contents.unwrap();
            }
            */
        });

        // remove annotationId and offsetId
        $('[annotationId]', body).each(function(index, el) {
            $(el).removeAttr('annotationId');
        });
        $('[offsetId]', body).each(function(index, el) {
            $(el).removeAttr('offsetId');
        });
    }

    function _getTextNodeFromParentAndOffset(parent, offset) {
        var currentOffset = 0;
        var textNode = null;

        function getTextNode(parent) {
            var ret = true;
            parent.contents().each(function(index, element) {
                var el = $(this);
                // Not sure why the &nbsp; text nodes would not be counted but as long
                // as we are consistent in both the saving and loading it should be
                // fine.
                if (this.nodeType === Node.TEXT_NODE && this.data !== ' ') {
                    // Count all the text!
                    currentOffset += this.length;
                    if (currentOffset >= offset) {
                        currentOffset = offset - (currentOffset - this.length);
                        textNode = this;
                        ret = false;
                        return ret;
                    }
                }
                // An Tag or an Entity that is not the one we're looking for.
                else {
                    // We must use all intermediate node's text to ensure an accurate text
                    // count. As the order in which entities are wrapped in spans when the
                    // document is loaded will not be guarantee to be in an order in which
                    // replicates the state the document was in at the time it was saved.
                    ret = getTextNode(el);
                    return ret;
                }
            });
            return ret;
        }

        getTextNode(parent);

        return {
            textNode: textNode,
            offset: currentOffset
        };
    }

    return converter;
};

});
