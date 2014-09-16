// TODO add IDs
define(['jquery', 'entity'], function($, Entity) {

function Mapper(config) {
	this.w = config.writer;
	
	this.mappings = {};
}

Mapper.TEXT_SELECTION = '[[[editorText]]]'; // constant represents the user's text selection when adding an entity

Mapper.getAttributeString = function(attObj) {
	var str = '';
	for (var key in attObj) {
		str += ' '+key+'="'+attObj[key]+'"';
	}
	return str;
};

/**
 * Gets entity markup attributes from xml. Assumes all other attributes have been removed.
 * @param xml {xml} The xml
 * @returns {Object} key/value pairs
 */
Mapper.getAttributesFromXml = function(xml) {
	var attrs = {};
	var nodeAttrs = attrs[xml.nodeName] = {};
	$.map(xml.attributes, function(att) {
		if (att.name === 'annotationId' || att.name === 'offsetId' || att.name === 'cwrcStructId') {
			// don't include
		} else {
			nodeAttrs[att.name] = att.value;
		}
	});
	return attrs;
};

Mapper.prototype = {
	constructor: Mapper,
	
	/**
	 * Loads the mappings for the specified schema.
	 * @param schemaId {String} The schema ID.
	 * @returns {Deferred} Deferred object that resolves when the mappings are loaded.
	 */
	loadMappings: function(schemaId) {
	    var dfd = $.Deferred();
		require(['schema/'+schemaId+'/mappings'], $.proxy(function(mappings) {
			this.mappings = mappings;
			dfd.resolve();
		}, this));
		return dfd;
	},
	
	getMapping: function(entity) {
		var mapping = this.mappings[entity.props.type].mapping;
		if (mapping === undefined) {
		    return ['', '']; // return array of empty strings if there is no mapping
		}
		var mappedString = mapping(entity);
		if (mappedString.indexOf(Mapper.TEXT_SELECTION) === -1) {
			return ['', mappedString];
		} else {
			return mappedString.split(Mapper.TEXT_SELECTION);
		}
	}, 
	
	/**
     * Returns the mapping of xml to an entity object.
     * @param xml {XML} The xml.
     * @param type {String} The entity type.
     * @returns {Object} The entity object.
     */
	getReverseMapping: function(xml, type) {
		var entry = this.mappings[type];
		var mapping = entry.reverseMapping;
		if (mapping) {
			return mapping(xml);
		}
		return {};
	},
	
	/**
     * Checks if the tag is for an entity.
     * @param tag The tag to check.
     * @returns {String} The entity type, or null
     */
    getEntityTypeForTag: function(tag) {
        var testTag;
        // TODO need way to differentiate between citation and note
        for (var type in this.mappings) {
            testTag = this.mappings[type].parentTag;
            if (($.isArray(testTag) && testTag.indexOf(tag) !== -1) || testTag === tag) {
                return e;
            }
        }
        return null;
    },
    
    /**
     * Returns the parent tag for entity when converted to a particular schema.
     * @param type The entity type.
     * @returns {String}
     */
    getParentTag: function(type) {
        var tag = this.mappings[type].parentTag;
        if (tag === undefined) {
            return '';
        }
        if ($.isArray(tag)) {
            tag = tag[0];
        }
        return tag;
    },
    
    /**
     * Returns the text tag (tag containing user-highlighted text) for entity when converted to a particular schema.
     * @param type The entity type.
     * @returns {String}
     */
    getTextTag: function(type) {
        var tag = this.mappings[type].textTag;
        if (tag === undefined) {
            return '';
        }
        return tag;
    }
};

return Mapper;

});