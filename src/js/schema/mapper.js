// TODO add IDs
define(['jquery', 'entity', 'jquery.xpath'], function($, Entity) {

function Mapper(config) {
    this.w = config.writer;

    this.mappings = {};
}

Mapper.TEXT_SELECTION = '[[[editorText]]]'; // constant represents the user's text selection when adding an entity

Mapper.getAttributeString = function(attObj) {
    var str = '';
    for (var key in attObj) {
        var val = attObj[key];
        if (val !== undefined && val !== '') {
            str += ' '+key+'="'+val+'"';
        }
    }
    return str;
};

/**
 * Gets the range string for the entity
 * @param {Entity} entity
 * @returns {String}
 */
Mapper.getRangeString = function(entity) {
    var rangeString = '';
    var range = entity.getRange();

    var annoId = range.annotationId || entity.getId();
    rangeString += ' annotationId="'+annoId+'"';

    if (range.offsetId !== undefined) {
        rangeString += ' offsetId="'+range.offsetId+'"';
    }

    return rangeString;
};

/**
 * Gets entity markup attributes from xml. Assumes all other attributes have been removed.
 * @param xml {xml} The xml
 * @returns {Object} key/value pairs
 */
Mapper.getAttributesFromXml = function(xml) {
    var attrs = {};
    $.map(xml.attributes, function(att) {
        if (att.name === 'annotationId' || att.name === 'offsetId' || att.name === 'cwrcStructId') {
            // don't include
        } else {
            attrs[att.name] = att.value;
        }
    });
    return attrs;
};

/**
 * Gets the standard mapping for a tag and attributes.
 * Doesn't close the tag, so that further attributes can be added.
 * @param {Entity} entity The Entity from which to fetch attributes
 * @returns {String}
 */
Mapper.getTagAndDefaultAttributes = function(entity) {
    var tag = entity.getTag();
    var xml = '<'+tag;
    xml += Mapper.getRangeString(entity);
    xml += Mapper.getAttributeString(entity.getAttributes());
    return xml;
};

/**
 * Similar to the Mapper.getTagAndDefaultAttributes method but closes the tag.
 * @param {Entity} entity
 * @returns
 */
Mapper.getDefaultMapping = function(entity) {
    var xml = Mapper.getTagAndDefaultAttributes(entity);
    var tag = entity.getTag();
    xml += '>'+Mapper.TEXT_SELECTION+'</'+tag+'>';
    return xml;
};

Mapper.getDefaultReverseMapping = function(xml, customMappings, nsPrefix) {
    function getValueFromXpath(xpath) {
        var val;
        var result = Mapper.getXpathResult(xml, xpath, nsPrefix);
        if (result !== undefined) {
            switch (result.nodeType) {
                case Node.ELEMENT_NODE:
                    val = Mapper.xmlToString(result);
                    break;
                case Node.TEXT_NODE:
                    val = $(result).text();
                    break;
                case Node.ATTRIBUTE_NODE:
                    val = $(result).val();
                    break;
                case undefined:
                    val = result;
            }
        }
        return val;
    }
    
    var obj = {};
    if (customMappings !== undefined) {
        for (var key in customMappings) {
            if (typeof customMappings[key] === 'object') {
                obj[key] = {};
                for (var key2 in customMappings[key]) {
                    var xpath = customMappings[key][key2];
                    var val = getValueFromXpath(xpath);
                    if (val !== undefined) {
                        obj[key][key2] = val;
                    }
                }
            } else if (typeof customMappings[key] === 'string') {
                var xpath = customMappings[key];
                var val = getValueFromXpath(xpath);
                obj[key] = val;
            }
        }
    }
    obj.attributes = Mapper.getAttributesFromXml(xml);
    
    return obj;
};

Mapper.getXpathResult = function(xmlContext, xpath, nsPrefix) {
    nsPrefix = nsPrefix || '';
    var nsUri = xmlContext.namespaceURI;
    if (nsUri === null && nsPrefix !== '') {
        // remove namespaces
        var regex = new RegExp(nsPrefix+':', 'g');
        xpath = xpath.replace(regex, '');
    }
    var nsResolver = function(prefix) {
        if (prefix == nsPrefix) return nsUri;
    };

    var result = $(xmlContext).xpath(xpath, nsResolver)[0];
    return result;
};

Mapper.xmlToString = function(xmlData) {
    var xmlString = '';
    try {
        if (window.ActiveXObject) {
            xmlString = xmlData.xml;
        } else {
            xmlString = (new XMLSerializer()).serializeToString(xmlData);
        }
    } catch (e) {
        alert(e);
    }
    return xmlString;
};

Mapper.prototype = {
    constructor: Mapper,

    /**
     * Loads the mappings for the specified schema.
     * @param schemaMappingId {String} The schema mapping ID.
     * @returns {Deferred} Deferred object that resolves when the mappings are loaded.
     */
    loadMappings: function(schemaMappingId) {
        var dfd = $.Deferred();
        require(['schema/' + schemaMappingId + '/mappings'], $.proxy(function(mappings) {
            this.mappings = mappings;
            dfd.resolve();
        }, this));
        return dfd;
    },

    clearMappings: function() {
        if (this.mappings.listeners !== undefined) {
            for (var event in this.mappings.listeners) {
                this.w.event(event).unsubscribe(this.mappings.listeners[event]);
            }
        }
        this.mappings = {};
    },
    
    getMappings: function() {
        return this.mappings;
    },

    getMapping: function(entity) {
        var mapping = this.mappings.entities[entity.getType()].mapping;
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
        var entry = this.mappings.entities[type];
        var mapping = entry.reverseMapping;
        if (mapping) {
            return mapping(xml);
        }
        return {};
    },

    /**
     * Checks if the tag is for an entity.
     * @param {Element|String} el The tag to check.
     * @returns {String} The entity type, or null
     */
    getEntityTypeForTag: function(el) {
        var tag;
        var isElement = false;
        if (typeof el === 'string') {
            tag = el;
        } else {
            isElement = true;
            tag = el.nodeName;
        }

        var resultType = null;
        for (var type in this.mappings.entities) {
            var xpath = this.mappings.entities[type].xpathSelector;
            if (xpath !== undefined && isElement) {
                var result = Mapper.getXpathResult(el, xpath, this.w.schemaManager.getCurrentSchema().schemaMappingsId);
                if (result !== undefined) {
                    resultType = type;
                    break; // prioritize xpath
                }
            } else {
                var parentTag = this.mappings.entities[type].parentTag;
                if (($.isArray(parentTag) && parentTag.indexOf(tag) !== -1) || parentTag === tag) {
                    resultType = type;
                }
            }
        }
        return resultType;
    },

    /**
     * Checks if the particular entity type is "a note or note-like".
     * @param {String} type The entity type
     * @return {Boolean}
     */
    isEntityTypeNote: function(type) {
        var isNote = this.mappings.entities[type].isNote;
        if (isNote === undefined) {
            return false;
        } else {
            return isNote;
        }
    },

    /**
     * Gets the content of a note/note-like entity.
     * @param {Entity} entity The entity
     * @param {Boolean} returnString True to return a string
     * @returns {String|Array|XML}
     */
    getNoteContentForEntity: function(entity, returnString) {
        var entry = this.mappings.entities[entity.getType()];
        if (entry.isNote) {
            var content;
            if (entry.getNoteContent !== undefined) {
                content = entry.getNoteContent(entity, returnString);
            } else {
                content = entity.getNoteContent();
                if (returnString !== true) {
                    try {
                        content = $.parseXML(content);
                    } catch(e) {
                        if (window.console) {
                            console.warn("error parsing xml:", content);
                        }
                    }
                }
            }
            return content;
        } else {
            return '';
        }
    },

    /**
     * Returns the parent tag for entity when converted to a particular schema.
     * @param type The entity type.
     * @returns {String}
     */
    getParentTag: function(type) {
        var tag = this.mappings.entities[type].parentTag;
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
        var tag = this.mappings.entities[type].textTag;
        if (tag === undefined) {
            return '';
        }
        return tag;
    },

    /**
     * Returns the name of the header tag for the current schema.
     * @returns {String}
     */
    getHeaderTag: function() {
        return this.mappings.header;
    },

    /**
     * Returns the name for the ID attribute for the current schema.
     * @returns {String}
     */
    getIdAttributeName: function() {
        return this.mappings.id;
    },

    /**
     * Returns the block level elements for the current schema.
     * @returns {Array}
     */
    getBlockLevelElements: function() {
        return this.mappings.blockElements;
    },
    
    /**
     * Returns the attribute names that define whether the tag is an URL.
     * @returns {Array}
     */
    getUrlAttributes: function() {
        return this.mappings.urlAttributes;
    }
};

return Mapper;

});
