define(['jquery', 'mapper'], function($, Mapper) {

return {

person: {
    parentTag: 'NAME',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    }
},

org: {
    parentTag: 'ORGNAME',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    }
},

place: {
    parentTag: 'PLACE',
    textTag: ['ADDRESS', 'AREA', 'GEOG', 'PLACENAME', 'REGION', 'SETTLEMENT'],
    mapping: function(entity) {
        var range = entity.getRange();
        var id = range.annotationId;
        var offsetId = range.offsetId;
        var tag = entity.getCustomValue('tag');
        
        var xml = '<PLACE';
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        xml += '><'+tag;
        if (id) xml += ' annotationId="'+id+'"';
        xml += '>'+Mapper.TEXT_SELECTION+'</'+tag+'></PLACE>';
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            customValues: {tag: 'fn:node-name(child::*)'}
        });
    }
},

title: {
    parentTag: 'TITLE',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    }
},

date: {
    xpathSelector: 'self::orlando:DATE|self::orlando:DATERANGE|self::orlando:DATESTRUCT',
    parentTag: ['DATE', 'DATERANGE', 'DATESTRUCT'],
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            properties: {tag: 'fn:node-name(.)'}
        });
    }
},

note: {
    xpathSelector: 'self::orlando:RESEARCHNOTE|self::orlando:SCHOLARNOTE',
    parentTag: ['RESEARCHNOTE', 'SCHOLARNOTE'],
    mapping: function(entity) {
        var tag = entity.getTag();
        var xml = Mapper.getTagAndDefaultAttributes(entity);
        xml += '>';
        
        var content = entity.getCustomValue('content');
        if (content) {
            var xmlDoc = $.parseXML(content);
            var noteContent = $('DIV0, '+tag, xmlDoc).last()[0];
            xml += noteContent.innerHTML;
        }
        
        xml += '</'+tag+'>';
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            customValues: {parent: 'fn:node-name(.)', content: '.'}
        });
    }
},

citation: {
    parentTag: 'BIBCITS',
    textTag: 'BIBCIT',
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
            customValues: {content: './text()'}
        }, 'cwrc');
    }
},

correction: {
    parentTag: 'SIC',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    }
},

keyword: {
    parentTag: 'KEYWORDCLASS',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
    }
},

link: {
    parentTag: 'XREF',
    mapping: function(entity) {
        return Mapper.getDefaultMapping(entity);
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml);
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

};

});