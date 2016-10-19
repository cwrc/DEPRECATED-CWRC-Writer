define(['jquery', 'mapper', 'annotationsManager'], function($, Mapper, AnnotationsManager) {

// TODO add resp for note type entities
    
function handleGraphics($tag) {
    var url = $tag.attr('url');
    if (url !== undefined) {
        $tag.css('backgroundImage','url('+url+')');
        $tag.css('display','inline-block');
        var $img = $('<img />');
        $img.hide();
        $img.on('load', function() {
            var height = $(this).height();
            var width = $(this).width();
            $tag.width(width);
            $tag.height(height);
            $img.remove();
        });
        $('body').append($img);
        $img.attr('src', url);
    }
}

return {

id: 'xml:id',
header: 'teiHeader',
blockElements: ['argument', 'back', 'bibl', 'biblFull', 'biblScope', 'body', 'byline', 'category', 'change', 'cit', 'classCode', 'elementSpec', 'macroSpec', 'classSpec', 'closer', 'creation', 'date', 'distributor', 'div', 'div1', 'div2', 'div3', 'div4', 'div5', 'div6', 'div7', 'docAuthor', 'edition', 'editionStmt', 'editor', 'eg', 'epigraph', 'extent', 'figure', 'front', 'funder', 'group', 'head', 'dateline', 'idno', 'item', 'keywords', 'l', 'label', 'langUsage', 'lb', 'lg', 'list', 'listBibl', 'note', 'noteStmt', 'opener', 'p', 'principal', 'publicationStmt', 'publisher', 'pubPlace', 'q', 'rendition', 'resp', 'respStmt', 'salute', 'samplingDecl', 'seriesStmt', 'signed', 'sp', 'sponsor', 'tagUsage', 'taxonomy', 'textClass', 'titlePage', 'titlePart', 'trailer', 'TEI', 'teiHeader', 'text', 'authority', 'availability', 'fileDesc', 'sourceDesc', 'revisionDesc', 'catDesc', 'encodingDesc', 'profileDesc', 'projectDesc', 'docDate', 'docEdition', 'docImprint', 'docTitle'],
urlAttributes: ['ref', 'target'],

listeners: {
    tagAdded: function(tag) {
        var $tag = $(tag);
        if ($tag.attr('_tag') === 'graphic') {
            handleGraphics($tag);
        }
    },
    tagEdited: function(tag) {
        var $tag = $(tag);
        if ($tag.attr('_tag') === 'graphic') {
            handleGraphics($tag);
        }
    },
    documentLoaded: function(success, body) {
        $(body).find('*[_tag="graphic"]').each(function(index, el) {
            handleGraphics($(el));
        });
    }
},

entities: {
    
person: {
    parentTag: 'persName',
    textTag: '',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            cwrcInfo: {id: '@ref'}
        });
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'foaf:Person', null, format);
    }
},

org: {
    parentTag: 'orgName',
    textTag: '',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            cwrcInfo: {id: '@ref'}
        });
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'foaf:Organization', null, format);
    }
},

place: {
    parentTag: 'placeName',
    textTag: 'placeName',
    mapping: function(entity) {
        var xml = Mapper.getTagAndDefaultAttributes(entity);
        xml += '>'+Mapper.TEXT_SELECTION+'';
        
        var precision = entity.getCustomValue('precision');
        if (precision !== undefined) {
            xml += '<precision';
            var id = entity.getRange().annotationId;
            if (id !== undefined) xml += ' annotationId="'+id+'"';
            xml += ' precision="'+precision+'" />';
        }
        var tag = entity.getTag();
        xml += '</'+tag+'>';
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            cwrcInfo: {id: '@ref'},
            customValues: {precision: 'tei:precision/@precision'}
        }, 'tei');
    },
    annotation: function(entity, format) {
        var anno = AnnotationsManager.commonAnnotation(entity, 'geo:SpatialThing', null, format);
        
        var precision = entity.getCustomValue('precision');
        if (precision !== undefined) {
            if (format === 'xml') {
                var precisionXml = $.parseXML('<cw:hasPrecision xmlns:cw="http://cwrc.ca/ns/cw#" rdf:resource="http://cwrc.ca/ns/cw#'+precision+'" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"/>');
                // remove rdf namespace as it's included in parent and only needed to parse this XML
                precisionXml.firstChild.attributes.removeNamedItem('xmlns:rdf');
                var body = $('[rdf\\:about="'+entity.getUris().annotationId+'"]', anno);
                body.append(precisionXml.firstChild);
            } else {
                anno.hasPrecision = 'cw:'+precision;
            }
        }
        
        return anno;
    }
},

title: {
    parentTag: 'title',
    textTag: '',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            cwrcInfo: {id: '@ref'}
        });
    },
    annotation: function(entity, format) {
        var anno = AnnotationsManager.commonAnnotation(entity, ['dcterms:BibliographicResource', 'dcterms:title'], 'oa:identifying', format);
        
        if (format === 'xml') {
            var levelXml = $.parseXML('<cw:pubType xmlns:cw="http://cwrc.ca/ns/cw#">'+entity.getAttribute('level')+'</cw:pubType>');
            var body = $('[rdf\\:about="'+entity.getUris().entityId+'"]', anno);
            body.prepend(levelXml.firstChild);
        } else {
            anno.hasBody['pubType'] = entity.getAttribute('level');
        }
        
        return anno;
    }
},

correction: {
    xpathSelector: 'self::tei:choice|self::tei:corr',
    parentTag: ['choice', 'corr'],
    textTag: 'sic',
    mapping: function(entity) {
        var corrText = entity.getCustomValue('corrText');
        
        var tag;
        if (corrText) {
            tag = 'choice';
        } else {
            tag = 'corr';
        }
        var rangeString = Mapper.getRangeString(entity);
        
        var xml = '<'+tag;
        xml += rangeString;
        xml += Mapper.getAttributeString(entity.getAttributes());
        
        if (corrText) {
            xml += '>';
            xml += '<sic'+rangeString;
            xml += '>'+Mapper.TEXT_SELECTION+'</sic>';
            xml += '<corr'+rangeString;
            xml += '>'+corrText+'</corr></choice>';
        } else {
            xml += '>'+Mapper.TEXT_SELECTION+'</'+tag+'>';
        }
        
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            customValues: {sicText: 'tei:sic/text()', corrText: 'tei:corr/text(), text()'}
        }, 'tei');
    },
    annotation: function(entity, format) {
        var anno = AnnotationsManager.commonAnnotation(entity, 'cnt:ContentAsText', 'oa:editing', format);
        
        if (format === 'xml') {
            var corrXml = $.parseXML('<cnt:chars xmlns:cnt="http://www.w3.org/2011/content#">'+entity.getCustomValue('corrText')+'</cnt:chars>');
            var body = $('[rdf\\:about="'+entity.getUris().entityId+'"]', anno);
            body.prepend(corrXml.firstChild);
        } else {
            anno.hasBody['cnt:chars'] = entity.getCustomValue('corrText');
        }

        return anno;
    }
},

link: {
    parentTag: 'ref',
    textTag: '',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'cnt:ContentAsText', 'oa:linking', format);
    }
},

date: {
    parentTag: 'date',
    textTag: '',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    },
    annotation: function(entity, format) {
        var types = [];
        if (entity.getAttribute('when') !== undefined) {
            types.push('time:Instant');
        } else {
            types.push('time:Interval');
        }
        types.push('time:TemporalEntity');
        
        var anno = AnnotationsManager.commonAnnotation(entity, types, null, format);
        
        if (format === 'xml') {
            var dateXml;
            if (entity.getAttribute('when') !== undefined) {
                dateXml = $.parseXML('<xsd:date xmlns:xsd="http://www.w3.org/2001/XMLSchema#">'+entity.getAttribute('when')+'</xsd:date>');
            } else {
                // TODO properly encode date range
                dateXml = $.parseXML('<xsd:date xmlns:xsd="http://www.w3.org/2001/XMLSchema#">'+entity.getAttribute('from')+'/'+entity.getAttribute('to')+'</xsd:date>');
            }
            var body = $('[rdf\\:about="'+entity.getUris().entityId+'"]', anno);
            body.prepend(dateXml.firstChild);
        } else {
            if (entity.getAttribute('when') !== undefined) {
                anno.hasBody['xsd:date'] = entity.getAttribute('when');
            } else {
                anno.hasBody['xsd:date'] = entity.getAttribute('from')+'/'+entity.getAttribute('to');
            }
        }
        
        return anno;
    }
},

note: {
    parentTag: 'note',
    xpathSelector: 'self::tei:note/node()',
    textTag: '',
    isNote: true,
    mapping: function(entity) {
        var xml = Mapper.getTagAndDefaultAttributes(entity);
        xml += '>';
        
        var content = entity.getNoteContent();
        if (content) {
            var xmlDoc = $.parseXML(content);
            var noteContent = $('note', xmlDoc)[0];
            xml += noteContent.innerHTML;
        }
        var tag = entity.getTag();
        xml += '</'+tag+'>';
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            noteContent: '.'
        }, 'tei');
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'bibo:Note', 'oa:commenting', format);
    }
},

citation: {
    parentTag: 'note',
    xpathSelector: 'self::tei:note/tei:bibl',
    textTag: 'bibl',
    isNote: true,
    mapping: function(entity) {
        var xml = '<note';
        xml += Mapper.getRangeString(entity);
        xml += ' type="citation"><bibl';
        xml += ' ref="'+entity.getAttribute('ref')+'"';
        xml += '>';
        
        var content = entity.getNoteContent();
        if (content) {
            var xmlDoc = $.parseXML(content);
            var biblContent = $('bibl', xmlDoc)[0];
            xml += biblContent.innerHTML;
        }
        xml += '</bibl></note>';
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            cwrcInfo: {id: 'tei:bibl/@ref'},
            noteContent: '.'
        }, 'tei');
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'dcterms:BibliographicResource', 'cw:citing', format);
    }
},

keyword: {
    parentTag: 'note',
    xpathSelector: 'self::tei:note/tei:term',
    textTag: '',
    isNote: true,
    getNoteContent: function(entity, returnString) {
        var keywords = entity.getCustomValue('keywords');
        if (returnString) {
            return keywords.join(', ');
        } else {
            return keywords;
        }
    },
    mapping: function(entity) {
        var keywords = entity.getCustomValue('keywords');
        var rangeString = Mapper.getRangeString(entity);
        
        var xml = '';
        for (var i = 0; i < keywords.length; i++) {
            xml += Mapper.getTagAndDefaultAttributes(entity);
            xml += '><term'+rangeString+'>'+keywords[i]+'</term></note>';
        }
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            customValues: {keywords: 'tei:term/text()'}
        }, 'tei');
    },
    annotation: function(entity, format) {
        var anno = AnnotationsManager.commonAnnotation(entity, ['oa:Tag', 'cnt:ContentAsText', 'skos:Concept'], 'oa:classifying', format);
        
        var keywords = entity.getCustomValue('keywords');
        if (format === 'xml') {
            var body = $('[rdf\\:about="'+entity.getUris().entityId+'"]', anno);
            for (var i = 0; i < keywords.length; i++) {
                var keyword = keywords[i];
                var keywordXml = $.parseXML('<cnt:chars xmlns:cnt="http://www.w3.org/2011/content#">'+keyword+'</cnt:chars>');
                body.prepend(keywordXml.firstChild);
            }
        } else {
            anno.hasBody['cnt:chars'] = keywords;
        }

        return anno;
    }
},

event: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    }
}

}

};

});