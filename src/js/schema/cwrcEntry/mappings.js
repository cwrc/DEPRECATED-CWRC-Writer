define(['jquery', 'mapper', 'annotationsManager'], function($, Mapper, AnnotationsManager) {

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

id: 'ID',
header: 'CWRCHEADER',
blockElements: [],

listeners: {
    tagAdded: function(tag) {
        var $tag = $(tag);
        if ($tag.attr('_tag') === 'GRAPHIC') {
            handleGraphics($tag);
        }
    },
    tagEdited: function(tag) {
        var $tag = $(tag);
        if ($tag.attr('_tag') === 'GRAPHIC') {
            handleGraphics($tag);
        }
    },
    documentLoaded: function(body) {
        $(body).find('*[_tag="GRAPHIC"]').each(function(index, el) {
            handleGraphics($(el));
        });
    }
},

entities: {
    
person: {
    parentTag: 'NAME',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'foaf:Person', null, format);
    }
},

org: {
    parentTag: 'ORGNAME',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'foaf:Organization', null, format);
    }
},

place: {
    parentTag: 'PLACE',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'geo:SpatialThing', null, format);
    }
},

title: {
    parentTag: 'TITLE',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    },
    annotation: function(entity, format) {
        var anno = AnnotationsManager.commonAnnotation(entity, ['dcterms:BibliographicResource', 'dcterms:title'], null, format);
        
        if (format === 'xml') {
            var levelXml = $.parseXML('<cw:pubType xmlns:cw="http://cwrc.ca/ns/cw#">'+entity.getAttribute('TITLETYPE')+'</cw:pubType>');
            var body = $('[rdf\\:about="'+entity.getUris().entityId+'"]', anno);
            body.prepend(levelXml.firstChild);
        } else {
            anno.motivation = 'oa:identifying';
        }
        
        return anno;
    }
},

date: {
    xpathSelector: 'self::cwrcEntry:DATE|self::cwrcEntry:DATERANGE',
    parentTag: ['DATE', 'DATERANGE'],
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            properties: {tag: 'fn:node-name(.)'}
        });
    },
    annotation: function(entity, format) {
        var types = [];
        if (entity.getAttribute('FROM') !== undefined) {
            types.push('time:Interval');
        } else {
            types.push('time:Instant');
        }
        types.push('time:TemporalEntity');
        
        var anno = AnnotationsManager.commonAnnotation(entity, types, null, format);
        
        if (format === 'xml') {
            var dateXml;
            if (entity.getAttribute('VALUE') !== undefined) {
                dateXml = $.parseXML('<xsd:date xmlns:xsd="http://www.w3.org/2001/XMLSchema#">'+entity.getAttribute('VALUE')+'</xsd:date>');
            } else {
                // TODO properly encode date range
                dateXml = $.parseXML('<xsd:date xmlns:xsd="http://www.w3.org/2001/XMLSchema#">'+entity.getAttribute('FROM')+'/'+entity.getAttribute('TO')+'</xsd:date>');
            }
            var body = $('[rdf\\:about="'+entity.getUris().entityId+'"]', anno);
            body.prepend(dateXml.firstChild);
        } else {
            if (entity.getAttribute('VALUE') !== undefined) {
                anno.hasBody['xsd:date'] = entity.getAttribute('VALUE');
            } else {
                anno.hasBody['xsd:date'] = entity.getAttribute('FROM')+'/'+entity.getAttribute('TO');
            }
        }
        
        return anno;
    }
},

note: {
    xpathSelector: 'self::cwrcEntry:RESEARCHNOTE|self::cwrcEntry:SCHOLARNOTE',
    parentTag: ['RESEARCHNOTE', 'SCHOLARNOTE'],
    isNote: true,
    getNoteContent: function(entity, returnString) {
        var xml = $.parseXML(entity.getCustomValue('content'));
        if (returnString) {
            return $(xml).text();
        } else {
            return xml;
        }
    },
    mapping: function(entity) {
        var tag = entity.getTag();
        var xml = Mapper.getTagAndDefaultAttributes(entity);
        xml += '>';
        
        var content = entity.getCustomValue('content');
        if (content) {
            var xmlDoc = $.parseXML(content);
            var noteContent = $(tag, xmlDoc).first()[0];
            xml += noteContent.innerHTML;
        }
        
        xml += '</'+tag+'>';
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            customValues: {parent: 'fn:node-name(.)', content: '.'}
        });
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'bibo:Note', 'oa:commenting', format);
    }
},

// TODO fix citation
citation: {
    parentTag: 'BIBCITS',
    textTag: 'BIBCIT',
    isNote: true,
    getNoteContent: function(entity, returnString) {
        var xml = $.parseXML(entity.getCustomValue('content'));
        if (returnString) {
            return $(xml).text();
        } else {
            return xml;
        }
    },
    mapping: function(entity) {
        var range = entity.getRange();
        var id = range.annotationId;
        var offsetId = range.offsetId;
        var content = entity.getCustomValue('content');
        
        var xml = '<BIBCITS';
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        xml += '><BIBCIT';
        if (id) xml += ' annotationId="'+id+'"';
        xml += '>';
        xml += content;
        xml += '</BIBCIT></BIBCITS>';
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            cwrcInfo: {id: 'cwrc:BIBCIT/@REF'},
            customValues: {content: '.'}
        }, 'cwrc');
    },
    annotation: function(entity, format) {
        return AnnotationsManager.commonAnnotation(entity, 'dcterms:BibliographicResource', 'cw:citing', format);
    }
},

correction: {
    parentTag: 'SIC',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    },
    annotation: function(entity, format) {
        var anno = AnnotationsManager.commonAnnotation(entity, 'cnt:ContentAsText', 'oa:editing', format);
        
        if (format === 'xml') {
            var corrXml = $.parseXML('<cnt:chars xmlns:cnt="http://www.w3.org/2011/content#">'+entity.getAttribute('CORR')+'</cnt:chars>');
            var body = $('[rdf\\:about="'+entity.getUris().entityId+'"]', anno);
            body.prepend(corrXml.firstChild);
        } else {
            anno.hasBody['cnt:chars'] = entity.getAttribute('CORR');
        }

        return anno;
    }
},

keyword: {
    parentTag: 'KEYWORDCLASS',
    isNote: true,
    getNoteContent: function(entity, returnString) {
        return entity.getAttribute('KEYWORDTYPE');
    },
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    },
    annotation: function(entity, format) {
        var anno = AnnotationsManager.commonAnnotation(entity, ['oa:Tag', 'cnt:ContentAsText', 'skos:Concept'], 'oa:classifying', format);
        
        var keyword = entity.getAttribute('KEYWORDTYPE');
        if (format === 'xml') {
            var body = $('[rdf\\:about="'+entity.getUris().entityId+'"]', anno);
            var keywordXml = $.parseXML('<cnt:chars xmlns:cnt="http://www.w3.org/2011/content#">'+keyword+'</cnt:chars>');
            body.prepend(keywordXml.firstChild);
        } else {
            anno.hasBody['cnt:chars'] = keyword;
        }

        return anno;
    }
},

link: {
    parentTag: 'XREF',
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