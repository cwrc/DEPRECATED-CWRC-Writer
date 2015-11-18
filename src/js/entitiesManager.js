define(['jquery', 'entity'], function($, Entity) {

/**
 * @class EntitiesManager
 * @param {Writer} writer
 */
function EntitiesManager(writer) {
    this.w = writer;
    
    this.entities = {};
    
    this.currentEntity = null;
    
    this.w.event('entityAdded').subscribe($.proxy(function(entityId) {
        this.highlightEntity(entityId);
    }, this));
    this.w.event('entityEdited').subscribe($.proxy(function(entityId) {
        this.highlightEntity(entityId);
    }, this));
    this.w.event('entityRemoved').subscribe($.proxy(function(entityId) {
        this.highlightEntity();
    }, this));
    this.w.event('entityPasted').subscribe($.proxy(function(entityId) {
        this.highlightEntity(entityId);
    }, this));
}

EntitiesManager.prototype = {
    constructor: EntitiesManager,
    
    /**
     * Creates and adds an entity to the collection.
     * @fires Writer#entityAdded
     * @param {Object|Entity} config The entity config.
     * @returns {Entity} The newly created Entity
     */
    addEntity: function(config) {
        var entity;
        if (config.constructor.name === 'Entity') {
            entity = config;
        } else {
            if (config.id === undefined) {
                config.id = this.w.getUniqueId('ent_');
            }
            
            if (config.tag === undefined) {
                config.tag = this.w.schemaManager.mapper.getParentTag(config.type);
            }
            
            entity = new Entity(config);
        }
        
        
        this.entities[entity.id] = entity;
        
        this.w.editor.isNotDirty = false;
        this.w.event('entityAdded').publish(entity.id);
        
        return entity;
    },
    
    /**
     * Remove an entity from the collection.
     * NB: does not remove any associated tags in the document.
     * @fires Writer#entityRemoved
     * @param {String} id Then entity ID.
     * @param id
     */
    removeEntity: function(id) {
        if (this.entities[id] !== undefined) {
            delete this.entities[id];
            this.w.editor.isNotDirty = false;
            this.w.event('entityRemoved').publish(id);
        }
    },
    
    /**
     * Gets an entity by its ID.
     * @param {String} id The entity ID.
     * @returns {Entity}
     */
    getEntity: function(id) {
        return this.entities[id];
    },
    
    /**
     * Sets an entity by ID.
     * @param {String} id The entity ID.
     * @param {Entity} entity The entity.
     */
    setEntity: function(id, entity) {
        if (entity instanceof Entity) {
            this.entities[id] = entity;
        } else {
            if (window.console) {
                console.warn('Trying to set a non-Entity object.');
            }
        }
    },
    
    /**
     * Returns a clone of the entity.
     * @param {String} id The entity ID.
     * @returns {Entity}
     */
    cloneEntity: function(id) {
        var clone = this.entities[id].clone();
        clone.id = this.w.getUniqueId('ent_');
        // TODO get new URIs
        return clone;
    },
    
    /**
     * Gets all the entities.
     * @returns {Object}
     */
    getEntities: function() {
        return this.entities;
    },
    
    /**
     * Iterate through all entities.
     * Callback is passed the ID and the Entity as arguments.
     * @param {Function} callback
     */
    eachEntity: function(callback) {
        $.each(this.entities, callback);
    },
    
    /**
     * Gets the currently highlighted entity ID.
     * @returns {String} Entity ID
     */
    getCurrentEntity: function() {
        return this.currentEntity;
    },
    
    /**
     * Sets the currently highlighted entity ID.
     * @returns {String} Entity ID
     */
    setCurrentEntity: function(entityId) {
        this.currentEntity = entityId;
    },
    
    /**
     * Highlights an entity or removes the highlight from a previously highlighted entity.
     * @fires Writer#entityUnfocused
     * @fires Writer#entityFocused
     * @param {String} id The entity ID.
     * @param bm TinyMce bookmark
     * @param {Boolean} doScroll True to scroll to the entity
     */
    highlightEntity: function(id, bm, doScroll) {
        if (id == null || id !== this.currentEntity) {
            var body = this.w.editor.getBody();
            var prevHighlight = $('.entityHighlight', body);
            if (prevHighlight.length !== 0) {
                prevHighlight.each(function(index, el) {
                    var $p = $(el);
                    var parent = $p.parent()[0];
                    if ($p.contents().length !== 0) {
                        $p.contents().unwrap();
                    } else {
                        $p.remove();
                    }
                    parent.normalize();
                });
            }
            if (this.currentEntity !== null) {
                this.w.event('entityUnfocused').publish(this.currentEntity);
            }
            
            this.currentEntity = null;
            
            if (id) {
                // clear selection
                var rng = this.w.editor.dom.createRng();
                this.w.editor.selection.setRng(rng);
                
                this.currentEntity = id;
                var type = this.getEntity(id).getType();
                
                var entityTags = $('[name="'+id+'"]', body);
                entityTags.wrap('<span class="entityHighlight '+type+'"/>');

                // maintain the original caret position
                if (bm) {
                    this.w.editor.selection.moveToBookmark(bm);
                }
                
                if (doScroll) {
                    var val = entityTags.offset().top;
                    $(body).scrollTop(val);
                }
                
                this.w.event('entityFocused').publish(id);
            }
        }
    },
    
    /**
     * Removes all the entities.
     */
    reset: function() {
        this.entities = {};
    }
};

return EntitiesManager;

});