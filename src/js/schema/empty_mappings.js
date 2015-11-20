define(['jquery', 'mapper'], function($, Mapper) {

return {

// The name of the ID attribute
id: '',
// The name of the header tag
header: '',
// Additional block level elements that should be added to TinyMCE
blockElements: [],

listeners: {
    // Listeners to CWRC-Writer events can go here and will subscribe upon mappings load
    // e.g. tagAdded: function() {}
},

/**
 * The entries for each entity. Each entity entry needs the following members:
 * parentTag {String|Array}: the XML tag(s) that encapsulates the entity, also used to determine if an XML tag is associated with an entity
 * textTag {String}: the tag that contains the text content of the entity
 * mapping {Function}: a function which accepts an Entity and returns a string of XML to display in the Writer (see Mapper.getDefaultMapping)
 * reverseMapping {Function}: a function which accepts an XML fragment and returns a JSON object (see Mapper.getDefaultReverseMapping) with the following entries:
 *     attributes: JSON representation of the XML attributes, see Entity.attributes
 *     customValues: JSON object of additional values, see Entity.customValues
 * annotation {Function}: a function which accepts an Entity and a format string (either 'xml' or 'json') and returns an annotation in the specified format (see AnnotationsManager.commonAnnotation)
 * 
 * Optional members:
 * isNote {Boolean}: boolean indicating the entity is a "note type" (default is false)
 * getNoteContent {Function}: if the entity is a note it requires this member. This is a function which accepts an Entity and a boolean, and which returns a string or XML, depending on the boolean.
 *     It should return the content of the note (typically, what's inside the parentTag).
 * xpathSelector {String}: if the entity can have several different parentTags or if several entities share the same parentTag, this selector can help differentiate
 */

entities: {
    
person: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

org: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

place: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

title: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

correction: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

link: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

date: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

note: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

citation: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

keyword: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
},

event: {
    parentTag: '',
    textTag: '',
    mapping: function(entity) {
    },
    reverseMapping: function(xml) {
    },
    annotation: function(entity, format) {
    }
}

}

};

});