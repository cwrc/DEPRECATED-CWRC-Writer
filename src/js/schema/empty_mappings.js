define(['jquery', 'mapper'], function($, Mapper) {

return {

// the name of the ID attribute
id: '',
// the name of the header tag
header: '',
// additional block level elements that should be added to TinyMCE
blockElements: [],

listeners: {
    // listeners to CWRC-Writer events can go here and will subscribe upon mappings load
    // e.g. tagAdded: function() {}
},

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