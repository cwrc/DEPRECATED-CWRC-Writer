define(['jquery', 'mapper'], function($, Mapper) {

return {

person: {
    parentTag: 'name',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml = '<NAME';
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        if (info.standard) xml += ' STANDARD="'+info.standard+'"';
        
        xml += '>'+Mapper.TEXT_SELECTION+'</NAME>';
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        var $xml = $(xml);

        obj.standard = $xml.attr('STANDARD');
        
        return obj;
    }
},

org: {
    parentTag: 'ORGNAME',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml = '<ORGNAME';
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        if (info.standard) xml += ' STANDARD="'+info.standard+'"';
        
        xml += '>'+Mapper.TEXT_SELECTION+'</ORGNAME>';
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        var $xml = $(xml);
        
        obj.standard = $xml.attr('STANDARD');
        
        return obj;
    }
},

place: {
    parentTag: 'PLACE',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml = '<PLACE';
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        
        xml += '>'+Mapper.TEXT_SELECTION+'</PLACE>';
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        var $xml = $(xml);
        
        return obj;
    }
},

title: {
    parentTag: 'TITLE',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml = '<TITLE';
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        if (info.level) xml += ' TITLETYPE="'+info.level+'"';
        
        xml += '>'+Mapper.TEXT_SELECTION+'</TITLE>';
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        var $xml = $(xml);
        
        obj.level = $xml.attr('TITLETYPE');
        
        return obj;
    }
},

date: {
    parentTag: 'DATE',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml = '';
        if (info.date) {
            xml += '<DATE';
            if (id) xml += ' annotationId="'+id+'"';
            if (offsetId) xml += ' offsetId="'+offsetId+'"';
            xml +=' VALUE="'+info.date+'">'+Mapper.TEXT_SELECTION+'</DATE>';
        } else if (info.startDate) {
            xml += '<DATERANGE';
            if (id) xml += ' annotationId="'+id+'"';
            if (offsetId) xml += ' offsetId="'+offsetId+'"';
            xml += ' FROM="'+info.startDate+'" TO="'+info.endDate+'">'+Mapper.TEXT_SELECTION+'</DATERANGE>';
        }
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        var $xml = $(xml);
        
        if ($xml.attr('VALUE')) {
            obj.date = $xml.attr('VALUE');
            $xml.removeAttr('VALUE');
        } else {
            obj.startDate = $xml.attr('FROM');
            obj.endDate = $xml.attr('TO');
            $xml.removeAttr('FROM').removeAttr('TO');
        }
        
        obj.attributes = Mapper.getAttributesFromXml(xml);
        
        return obj;
    }
},

note: {
    parentTag: ['RESEARCHNOTE', 'SCHOLARNOTE'],
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var el = 'RESEARCHNOTE';
        if (info.type && info.type == 'scholarNote') {
            el = 'SCHOLARNOTE';
        }
        var xml = '<'+el;
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        if (info.content) {
            var xmlDoc = w.utilities.stringToXML(info.content);
            var noteContent = $('note', xmlDoc)[0];
            xml += noteContent.innerHTML;
        }
        xml += '>';
        xml += '</'+el+'>';
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        
        obj.type = xml.nodeName.toLowerCase() == 'researchnote' ? 'researchNote' : 'scholarNote';
        obj.content = w.utilities.xmlToString(xml);
        
        return obj;
    }
},

citation: {
    parentTag: 'BIBCITS',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml = '<BIBCITS';
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        xml += '><BIBCIT>';
        if (info.content) {
            var xmlDoc = w.utilities.stringToXML(info.content);
            var noteContent = $('note', xmlDoc)[0];
            xml += noteContent.innerHTML;
        }
        xml += '</BIBCIT></BIBCITS>';
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        
        obj.content = w.utilities.xmlToString(xml);
        
        return obj;
    }
},

correction: {
    parentTag: 'SIC',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml;
        if (info.corrText) {
            xml = '<SIC';
            if (id) xml += ' annotationId="'+id+'"';
            if (offsetId) xml += ' offsetId="'+offsetId+'"';
            xml += ' CORR="'+info.corrText+'">'+Mapper.TEXT_SELECTION+'</SIC>';
        } else {
            xml = '<SIC';
            if (id) xml += ' annotationId="'+id+'"';
            if (offsetId) xml += ' offsetId="'+offsetId+'"';
            xml += '>'+Mapper.TEXT_SELECTION+'</SIC>';
        }
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        var $xml = $(xml);
        
        if ($xml.attr('CORR')) {
            obj.corrText = $xml.attr('CORR');
        }
        obj.sicText = $xml.text();
        
        return obj;
    }
},

keyword: {
    parentTag: 'KEYWORDCLASS',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml = '';
        for (var i = 0; i < info.keywords.length; i++) {
            xml += '<KEYWORDCLASS KEYWORDTYPE="'+info.keywords[i]+'"';
            if (id) xml += ' annotationId="'+id+'"';
            if (offsetId) xml += ' offsetId="'+offsetId+'"';
            xml +='>'+Mapper.TEXT_SELECTION+'</KEYWORDCLASS>';
        }
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        var $xml = $(xml);
        
        obj.keywords = [$xml.attr('KEYWORDTYPE')];
        
        return obj;
    }
},

link: {
    parentTag: 'XREF',
    mapping: function(entity) {
        var info = entity.info;
        var id = entity.annotation.range.cwrcAnnotationId || entity.props.id;
        var offsetId = entity.annotation.range.cwrcOffsetId;
        
        var xml = '<XREF';
        if (id) xml += ' annotationId="'+id+'"';
        if (offsetId) xml += ' offsetId="'+offsetId+'"';
        if (info.url) xml += ' URL="'+info.url+'"';
        xml += '>'+Mapper.TEXT_SELECTION+'</XREF>';
        return xml;
    },
    reverseMapping: function(xml) {
        var obj = {};
        var $xml = $(xml);
        
        obj.url = $xml.attr('URL');
        
        return obj;
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