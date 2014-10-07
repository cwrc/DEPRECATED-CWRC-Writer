define(['jquery', 'mapper'], function($, Mapper) {

// TODO add resp for note type entities
    
return {

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
    }
},

correction: {
    parentTag: ['choice', 'corr'],
    textTag: 'sic',
    mapping: function(entity) {
        var range = entity.getRange();
        var id = range.annotationId;
        var offsetId = range.offsetId;
        var corrText = entity.getCustomValue('corrText');
        
        var xml;
        if (corrText) {
            xml = '<choice';
            if (id) xml += ' annotationId="'+id+'"';
            if (offsetId) xml += ' offsetId="'+offsetId+'"';
            xml += '>';
            xml += '<sic';
            if (id) xml += ' annotationId="'+id+'"';
            xml += '>'+Mapper.TEXT_SELECTION+'</sic>';
            xml += '<corr';
            if (id) xml += ' annotationId="'+id+'"';
            xml += '>'+corrText+'</corr></choice>';
        } else {
            xml = '<corr';
            if (id) xml += ' annotationId="'+id+'"';
            if (offsetId) xml += ' offsetId="'+offsetId+'"';
            xml += '>'+Mapper.TEXT_SELECTION+'</corr>';
        }
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            customValues: {sicText: 'tei:sic/text()', corrText: 'tei:corr/text(), text()'}
        }, 'tei');
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
    }
},

note: {
    parentTag: 'note',
    textTag: '',
    mapping: function(entity) {
        var xml = Mapper.getTagAndDefaultAttributes(entity);
        xml += '>';
        
        var content = entity.getCustomValue('content');
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
            customValues: {content: '.'}
        }, 'tei');
    }
},

citation: {
    parentTag: 'note',
    textTag: 'bibl',
    mapping: function(entity) {
        var xml = '<note';
        xml += Mapper.getRangeString(entity);
        xml += ' type="citation"><bibl';
        xml += ' ref="'+entity.getAttribute('ref')+'"';
        xml += '>';
        
        var content = entity.getCustomValue('content');
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
            customValues: {content: '.'}
        }, 'tei');
    }
},

keyword: {
    parentTag: 'note',
    textTag: '',
    mapping: function(entity) {
        var keywords = entity.getCustomValue('keywords');
        var rangeString = Mapper.getRangeString(entity);
        var annotationId = entity.getRange().annotationId;
        
        var xml = '';
        for (var i = 0; i < keywords.length; i++) {
            xml += '<note type="keyword"';
            xml += rangeString;
            xml +='><term';
            if (annotationId) xml += ' annotationId="'+annotationId+'"';
            xml +='>'+keywords[i]+'</term></note>';
        }
        return xml;
    },
    reverseMapping: function(xml) {
        return Mapper.getDefaultReverseMapping(xml, {
            customValues: {keywords: 'tei:term/text()'}
        }, 'tei');
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