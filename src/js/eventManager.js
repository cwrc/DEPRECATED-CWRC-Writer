// a wrapper for the pub/sub pattern described here: http://api.jquery.com/jQuery.Callbacks/
define(['jquery'], function($) {

return function(writer) {
	var w = writer;
	
	var events = {};
	
	// add event method directly to the writer
	w.event = function(id) {
		var callbacks, method, event = id && events[id];
		
		if (!event) {
			callbacks = $.Callbacks();
			event = {
				publish: function() {
					if (window.console) {
						console.debug('CWRC-Writer "'+this.event+'":', arguments);
					}
					callbacks.fire.apply(this, arguments);
				},
				subscribe: callbacks.add,
				unsubscribe: callbacks.remove,
				event: id
			};
		}
		
		if (id) {
			events[id] = event;
		}
		
		return event;
	};
	
	/**
	 * CWRCWriter events
	 */
	
	
	/**
	 * The writer has been initialized.
	 * @returns {Object} The CWRCWriter.
	 */
	w.event('writerInitialized');
	/**
	 * The StructureTree has been initialized.
	 * @returns {Object} The StructureTree.
	 */
	w.event('structureTreeInitialized');
	/**
	 * The EntitiesList has been initialized.
	 * @returns {Object} The EntitiesList.
	 */
	w.event('entitiesListInitialized');
	
	
	/**
	 * The current node was changed.
	 * @returns {Element} The current node.
	 */
	w.event('nodeChanged');
	/**
	 * Content was changed in the editor.
	 * @returns {Object} The editor.
	 */
	w.event('contentChanged');
	
	
	/**
	 * A document was loaded into the editor.
	 */
	w.event('documentLoaded');
	/**
	 * A document was saved.
	 */
	w.event('documentSaved');
	
	
	/**
	 * A schema was loaded into the editor.
	 */
	w.event('schemaLoaded');
	/**
	 * The current schema was changed.
	 * @returns {String} The id of the new schema.
	 */
	w.event('schemaChanged');
	/**
	 * A schema was added to the list of available schemas.
	 * @returns {String} The id of the new schema.
	 */
	w.event('schemaAdded');
	
	
	/**
	 * A document was validated.
	 * @returns {Boolean} True if the doc is valid.
	 * @returns {Document} Validation results.
	 * @returns {String} The string sent to the validator.
	 */
	w.event('documentValidated');
	
	
	/**
	 * A segment of the document was copied.
	 */
	w.event('contentCopied');
	/**
	 * Content was pasted into the document.
	 */
	w.event('contentPasted');
	
	/**
	 * The user triggered a keydown event in the editor.
	 * @returns {Object} Event object.
	 */
	w.event('writerKeydown');
	/**
	 * The user triggered a keyup event in the editor.
	 * @returns {Object} Event object.
	 */
	w.event('writerKeyup');
	
	
	/**
	 * An entity was added to the document.
	 * @returns {String} The entity ID.
	 */
	w.event('entityAdded');
	/**
	 * An entity was edited in the document.
	 * @returns {String} The entity ID.
	 */
	w.event('entityEdited');
	/**
	 * An entity was removed from the document.
	 * @returns {String} The entity ID.
	 */
	w.event('entityRemoved');
	/**
	 * An entity was focused on in the document.
	 * @returns {String} The entity ID.
	 */
	w.event('entityFocused');
	/**
	 * An entity was unfocused on in the document.
	 * @returns {String} The entity ID.
	 */
	w.event('entityUnfocused');
	/**
	 * An entity was copied to the internal clipboard.
	 * @returns {String} The entity ID.
	 */
	w.event('entityCopied');
	/**
	 * An entity was pasted to the document.
	 * @returns {String} The entity ID.
	 */
	w.event('entityPasted');
	
	
	/**
	 * A structure tag was added.
	 * @returns {String} The tag ID.
	 */
	w.event('tagAdded');
	/**
	 * A structure tag was edited.
	 * @returns {String} The tag ID.
	 */
	w.event('tagEdited');
	/**
	 * A structure tag was removed.
	 * @returns {String} The tag ID.
	 */
	w.event('tagRemoved');
	/**
	 * A structure tag's contents were removed.
	 * @returns {String} The tag ID.
	 */
	w.event('tagContentsRemoved');
	/**
	 * A structure tag was selected.
	 * @returns {String} The tag ID.
	 * @returns {Boolean} True if only tag contents were selected.
	 */
	w.event('tagSelected');
	
	return {
		getEvents: function() {
			return events;
		}
	};
};

});