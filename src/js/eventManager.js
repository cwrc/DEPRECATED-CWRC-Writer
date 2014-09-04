// a wrapper for the pub/sub pattern described here: http://api.jquery.com/jQuery.Callbacks/
define(['jquery'], function($) {

/**
 * @class EventManager
 * @param {Writer} writer
 */
return function(writer) {
	var w = writer;
	
	var events = {};
	
	/**
	 * Register an event with the Writer
	 * @memberof Writer
	 * @method event
	 * @instance
	 * @param {String} id The unique event name
	 */
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
	 * The writer has been initialized
	 * @event Writer#writerInitialized
	 * @param {Object} writer The CWRCWriter
	 */
	w.event('writerInitialized');
	/**
	 * The StructureTree has been initialized
	 * @event Writer#structureTreeInitialized
	 * @param {Object} structureTree The StructureTree
	 */
	w.event('structureTreeInitialized');
	/**
	 * The EntitiesList has been initialized
	 * @event Writer#entitiesListInitialized
	 * @param {Object} entitiesList The EntitiesList
	 */
	w.event('entitiesListInitialized');
	
	
	/**
	 * The current node was changed
	 * @event Writer#nodeChanged
	 * @param {Element} node The current node
	 */
	w.event('nodeChanged');
	/**
	 * Content was changed in the editor
	 * @event Writer#contentChanged
	 * @param {TinyMCE} editor The editor
	 */
	w.event('contentChanged');
	
	
	/**
	 * A document was loaded into the editor
	 * @event Writer#documentLoaded
	 */
	w.event('documentLoaded');
	/**
	 * A document was saved
	 * @event Writer#documentSaved
	 */
	w.event('documentSaved');
	
	
	/**
	 * A schema was loaded into the editor
	 * @event Writer#schemaLoaded
	 */
	w.event('schemaLoaded');
	/**
	 * The current schema was changed
	 * @event Writer#schemaChanged
	 * @param {String} id The id of the new schema
	 */
	w.event('schemaChanged');
	/**
	 * A schema was added to the list of available schemas
	 * @event Writer#schemaAdded
	 * @param {String} id The id of the new schema
	 */
	w.event('schemaAdded');
	
	/**
	 * A document was sent to the validation service
	 * @event Writer#validationInitiated
	 */
	w.event('validationInitiated');
	/**
	 * A document was validated
	 * @event Writer#documentValidated
	 * @param {Boolean} isValid True if the doc is valid
	 * @param {Document} results Validation results
	 * @param {String} docString The string sent to the validator
	 */
	w.event('documentValidated');
	
	
	/**
	 * A segment of the document was copied
	 * @event Writer#contentCopied
	 */
	w.event('contentCopied');
	/**
	 * Content was pasted into the document
	 * @event Writer#contentPasted
	 */
	w.event('contentPasted');
	
	/**
	 * The user triggered a keydown event in the editor
	 * @event Writer#writerKeydown
	 * @param {Object} event Event object
	 */
	w.event('writerKeydown');
	/**
	 * The user triggered a keyup event in the editor
	 * @event Writer#writerKeyup
	 * @param {Object} event Event object
	 */
	w.event('writerKeyup');
	
	
	/**
	 * An entity was added to the document
	 * @event Writer#entityAdded
	 * @param {String} id The entity ID
	 */
	w.event('entityAdded');
	/**
	 * An entity was edited in the document
	 * @event Writer#entityEdited
	 * @param {String} id The entity ID
	 */
	w.event('entityEdited');
	/**
	 * An entity was removed from the document
	 * @event Writer#entityRemoved
	 * @param {String} id The entity ID
	 */
	w.event('entityRemoved');
	/**
	 * An entity was focused on in the document
	 * @event Writer#entityFocused
	 * @param {String} id The entity ID
	 */
	w.event('entityFocused');
	/**
	 * An entity was unfocused on in the document
	 * @event Writer#entityUnfocused
	 * @param {String} id The entity ID
	 */
	w.event('entityUnfocused');
	/**
	 * An entity was copied to the internal clipboard
	 * @event Writer#entityCopied
	 * @param {String} id The entity ID
	 */
	w.event('entityCopied');
	/**
	 * An entity was pasted to the document
	 * @event Writer#entityPasted
	 * @param {String} id The entity ID
	 */
	w.event('entityPasted');
	
	
	/**
	 * A structure tag was added
	 * @event Writer#tagAdded
	 * @param {String} id The tag ID
	 */
	w.event('tagAdded');
	/**
	 * A structure tag was edited
	 * @event Writer#tagEdited
	 * @param {String} id The tag ID
	 */
	w.event('tagEdited');
	/**
	 * A structure tag was removed
	 * @event Writer#tagRemoved
	 * @param {String} id The tag ID
	 */
	w.event('tagRemoved');
	/**
	 * A structure tag's contents were removed
	 * @event Writer#tagContentsRemoved
	 * @param {String} id The tag ID
	 */
	w.event('tagContentsRemoved');
	/**
	 * A structure tag was selected
	 * @event Writer#tagSelected
	 * @param {String} id The tag ID
	 * @param {Boolean} contentsSelected True if only tag contents were selected
	 */
	w.event('tagSelected');
	
	/**
	 * @lends EventManager.prototype
	 */
	var e = {};
	
	/**
	 * Get the list of events
	 * @returns {Object}
	 */
	e.getEvents = function() {
		return events;
	};
	
	return e;
};

});