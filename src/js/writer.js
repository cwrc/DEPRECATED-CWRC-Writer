define([
    'jquery',
    'tinymce',
    'tinymce-copyevent',
    'eventManager','schemaManager','dialogManager','utilities',
    'tagger','converter','fileManager','entitiesModel','dialogs/settings'
], function($, tinymce, tinymceCopyEvent,
		EventManager, SchemaManager, DialogManager, Utilities, Tagger, Converter, FileManager, EntitiesModel, SettingsDialog) {
	
return function(config) {
	config = config || {};
	
	var w = {};
	
	w.layout = null; // jquery ui layout object
	w.editor = null; // reference to the tinyMCE instance we're creating, set in setup
	
	/**
	 * Entities store.
	 * Each entry contains 3 properties:
	 * info: tag info about the entity
	 * info.cwrcInfo: info from the cwrcDialogs lookups
	 * props: metadata for use by CWRCWriter
	 * annotation: annotation uris and object
	 */
	w.entities = {};
	
	w.structs = {}; // structs store
	
	w.triples = []; // triples store
	// store deleted tags in case of undo
	// TODO add garbage collection for this
	w.deletedEntities = {};
	w.deletedStructs = {};
	
	w.project = config.project || {}; // the current project (cwrc or russell)
	
	w.containerId = config.containerId; // the id of the element to initialize cwrcwriter in
	
	w.baseUrl = window.location.protocol+'//'+window.location.host+'/'; // the url for referencing various external services
	w.cwrcRootUrl = config.cwrcRootUrl; // the url which points to the root of the cwrcwriter location
	if (w.cwrcRootUrl == null) {
		alert('Error: you must specify the cwrcRootUrl in the CWRCWriter config!');
	}
	
	w.currentDocId = null;
	
	// root block element, should come from schema
	w.root = '';
	// header element: hidden in editor view, can only edit from structure tree
	w.header = '';
	// id attribute name, based on schema
	w.idName = '';
	
	// possible editor modes
	w.XMLRDF = 0; // XML + RDF
	w.XML = 1; // XML only
	w.RDF = 2; // RDF only (not currently used)
	
	// editor mode
	w.mode = config.mode;
	if (w.mode != null && w.mode === 'xml') {
		w.mode = w.XML;
	} else {
		w.mode = w.XMLRDF;
	}
	
	// can entities overlap?
	w.allowOverlap = false;
	if (config.allowOverlap != null && typeof config.allowOverlap === 'boolean') {
		w.allowOverlap = config.allowOverlap;
	}
	if (w.allowOverlap && w.mode === w.XML) {
		w.allowOverlap = false;
		alert('XML cannot overlap!');
	}
	
	// possible results when trying to add entity
	w.NO_SELECTION = 0;
	w.NO_COMMON_PARENT = 1;
	w.VALID = 2;
	
	w.emptyTagId = null; // stores the id of the entities tag to be added
	
	w.highlightEntity = function(id, bm, doScroll) {
		var prevHighlight = $('#entityHighlight', w.editor.getBody());
		if (prevHighlight.length == 1) {
			var parent = prevHighlight.parent()[0];
			prevHighlight.contents().unwrap();
			parent.normalize();
			
			w.event('entityUnfocused').publish(w.editor.currentEntity);
		}
		
		w.editor.currentEntity = null;
		
		if (id) {
			w.editor.currentEntity = id;
			var type = w.entities[id].props.type;
			var markers = w.editor.dom.select('span[name="'+id+'"]');
			var start = markers[0];
			var end = markers[1];
			
			var nodes = [start];
			var currentNode = start;
			while (currentNode != end  && currentNode != null) {
				currentNode = currentNode.nextSibling;
				nodes.push(currentNode);
			}
			
			$(nodes).wrapAll('<span id="entityHighlight" class="'+type+'"/>');
			
			// maintain the original caret position
			if (bm) {
				w.editor.selection.moveToBookmark(bm);
			}
			
			if (doScroll) {
				var val = $(start).offset().top;
				$(w.editor.dom.doc.body).scrollTop(val);
			}
			
			w.event('entityFocused').publish(id);
		}
	};
	
	/**
	 * Selects a structure tag in the editor
	 * @param id The id of the tag to select
	 * @param selectContentsOnly Whether to select only the contents of the tag (defaults to false)
	 */
	w.selectStructureTag = function(id, selectContentsOnly) {
		selectContentsOnly = selectContentsOnly == null ? false : selectContentsOnly;
		w.editor.currentStruct = id;
		var node = $('#'+id, w.editor.getBody());
		var nodeEl = node[0];
		
		if (nodeEl != null) {
			var rng = w.editor.dom.createRng();
			if (selectContentsOnly) {
				if (tinymce.isWebKit) {
	//				$('[data-mce-bogus]', node).remove();
	//				node.prepend('<span data-mce-bogus="1">\uFEFF</span>').append('<span data-mce-bogus="1">\uFEFF</span>');
	//				rng.setStart(nodeEl.firstChild, 0);
	//				rng.setEnd(nodeEl.lastChild, nodeEl.lastChild.length);
					if (nodeEl.firstChild == null) {
						node.append('\uFEFF');
					}
					rng.selectNodeContents(nodeEl);
				} else {
					rng.selectNodeContents(nodeEl);
				}
			} else {
				$('[data-mce-bogus]', node.parent()).remove();
				
				if (tinymce.isWebKit) {
					// if no nextElementSibling then only the contents will be copied in webkit
					if (nodeEl.nextElementSibling == null) {
						// sibling needs to be visible otherwise it doesn't count
						node.after('<span data-mce-bogus="1" style="display: inline;">\uFEFF</span>');
					}
					node.before('<span data-mce-bogus="1" style="display: inline;">\uFEFF</span>').after('<span data-mce-bogus="1" style="display: inline;">\uFEFF</span>');
					rng.setStart(nodeEl.previousSibling.firstChild, 0);
					rng.setEnd(nodeEl.nextSibling.firstChild, 0);
				} else {
					rng.selectNode(nodeEl);
				}
			}
			w.editor.selection.setRng(rng);
			
			// scroll node into view
			$(w.editor.getDoc()).scrollTop(node.position().top - $(w.editor.getContentAreaContainer()).height()*0.25);
			
			w._fireNodeChange(nodeEl);
			
			// need focus to happen after timeout, otherwise it doesn't always work (in FF)
			window.setTimeout(function() {
				w.editor.focus();
				w.event('tagSelected').publish(id, selectContentsOnly);
			}, 0);
		}
	};
	
	w.removeHighlights = function() {
		w.highlightEntity();
	};
	
	/**
	 * Load a document into the editor
	 * @param docXml The XML content of the document
	 * @param schemaURI The URI for the corresponding schema
	 */
	w.loadDocument = function(docXml, schemaURI) {
		w.fileManager.loadDocumentFromXml(docXml);
	};
	
	/**
	 * Get the current document from the editor
	 * @returns Element The XML document serialized to a string
	 */
	w.getDocument = function() {
		var docString = w.converter.getDocumentContent(true);
		var doc = null;
		try {
			var parser = new DOMParser();
			doc = parser.parseFromString(docString, 'application/xml');
		} catch(e) {
			w.dialogManager.show('message', {
				title: 'Error',
				msg: 'There was an error getting the document:'+e,
				type: 'error'
			});
		}
		return doc;
	};
	
	w._fireNodeChange = function(nodeEl) {
		// fire the onNodeChange event
		w.editor.parents = [];
		w.editor.dom.getParent(nodeEl, function(n) {
			if (n.nodeName == 'BODY')
				return true;

			w.editor.parents.push(n);
		});
		w.editor.onNodeChange.dispatch(w.editor, w.editor.controlManager, nodeEl, false, w.editor);
	};
	
	function _onMouseUpHandler(ed, evt) {
		_hideContextMenus(evt);
		_doHighlightCheck(ed, evt);
	};
	
	function _onKeyDownHandler(ed, evt) {
		ed.lastKeyPress = evt.which; // store the last key press
		// TODO move to keyup
		// redo/undo listener
		if ((evt.which == 89 || evt.which == 90) && evt.ctrlKey) {
			w.event('contentChanged').publish(ed);
		}
		
		w.event('writerKeydown').publish(evt);
	};
	
	function _onKeyUpHandler(ed, evt) {
		// nav keys and backspace check
		if (evt.which >= 33 || evt.which <= 40 || evt.which == 8) {
			_doHighlightCheck(ed, evt);
		}
		
		// update current entity
		if (ed.currentEntity) {
			var content = $('#entityHighlight', ed.getBody()).text();
			var entity = w.entities[ed.currentEntity];
			entity.props.content = content;
			entity.props.title = w.utilities.getTitleFromContent(content);
			w.event('entityEdited').publish(ed.currentEntity);
		}
		
		if (w.emptyTagId) {
			// alphanumeric keys
			if (evt.which >= 48 || evt.which <= 90) {
				var range = ed.selection.getRng(true);
				range.setStart(range.commonAncestorContainer, range.startOffset-1);
				range.setEnd(range.commonAncestorContainer, range.startOffset+1);
				w.insertBoundaryTags(w.emptyTagId, w.entities[w.emptyTagId].props.type, range);
				
				// TODO get working in IE
				var tags = $('[name='+w.emptyTagId+']', ed.getBody());
				range = ed.selection.getRng(true);
				range.setStartAfter(tags[0]);
				range.setEndBefore(tags[1]);
				range.collapse(false);
				
				w.event('entityEdited').publish(w.emptyTagId);
			} else {
				delete w.entities[w.emptyTagId];
			}
			w.emptyTagId = null;
		}
		
		if (ed.currentNode) {
			// check if the node still exists in the document
			if (ed.currentNode.parentNode === null) {
				var rng = w.editor.selection.getRng(true);
				var parent = rng.commonAncestorContainer.parentNode;
				// trying to type inside a bogus node?
				// (this can happen on webkit when typing "over" a selected structure tag)
				if (parent.getAttribute('data-mce-bogus') != null) {
					var $parent = $(parent);
					var collapseToStart = true;
					
					var newCurrentNode = $parent.nextAll('[_tag]')[0];
					if (newCurrentNode == null) {
						newCurrentNode = $parent.parent().nextAll('[_tag]')[0];
						if (newCurrentNode == null) {
							collapseToStart = false;
							newCurrentNode = $parent.prevAll('[_tag]')[0];
						}
					}
					
					if (newCurrentNode != null) {
						rng.selectNodeContents(newCurrentNode);
						rng.collapse(collapseToStart);
						ed.selection.setRng(rng);
						
						window.setTimeout(function(){
							w._fireNodeChange(newCurrentNode);
						}, 0);
					}
				}
			}
			
			// check if text is allowed in this node
			if (ed.currentNode.getAttribute('_textallowed') == 'false') {
				if (evt.ctrlKey || evt.which == 17) {
					// don't show message if we got here through undo/redo
					var node = $('[_textallowed="true"]', w.editor.getBody()).first();
					var rng = w.editor.selection.getRng(true);
					rng.selectNodeContents(node[0]);
					rng.collapse(true);
					w.editor.selection.setRng(rng);
				} else {
					w.dialogManager.show('message', {
						title: 'No Text Allowed',
						msg: 'Text is not allowed in the current tag: '+ed.currentNode.getAttribute('_tag')+'.',
						type: 'error'
					});
					
					// remove all text
					$(ed.currentNode).contents().filter(function() {
						return this.nodeType == 3;
					}).remove();
				}
			}
			
			// replace br's inserted on shift+enter
			if (evt.shiftKey && evt.which == 13) {
				var node = ed.currentNode;
				if ($(node).attr('_tag') == 'lb') node = node.parentNode;
				var tagName = w.utilities.getTagForEditor('lb');
				$(node).find('br').replaceWith('<'+tagName+' _tag="lb"></'+tagName+'>');
			}
		}
		
		// delete keys check
		// need to do this here instead of in onchangehandler because that one doesn't update often enough
		if (evt.which == 8 || evt.which == 46) {
			var doUpdate = w.tagger.findNewAndDeletedTags();
			if (doUpdate) {
				w.event('contentChanged').publish(ed);
			}
		}
		
		// enter key
		if (evt.which == 13) {
			// find the element inserted by tinymce
			var idCounter = tinymce.DOM.counter-1;
			var newTag = $('#struct_'+idCounter, ed.getBody());
			if (newTag.text() == '') {
				newTag.text('\uFEFF'); // insert zero-width non-breaking space so empty tag takes up space
			}
//			if (!w.utilities.isTagBlockLevel(newTag.attr('_tag'))) {
//				w.selectStructureTag(newTag.attr('id'), true);
//			}
		}
		
		w.event('writerKeyup').publish(evt);
	};
	
	function _onChangeHandler(ed, event) {
		if (ed.isDirty()) {
			$('br', ed.getBody()).remove();
			
			var doUpdate = w.tagger.findNewAndDeletedTags();
			if (doUpdate) {
				// TODO seemingly never getting fired
				w.event('contentChanged').publish(ed);
			}
		}
	};
	
	function _onNodeChangeHandler(ed, cm, e) {
		if (e != null) {
			if (e.nodeType != 1) {
				ed.currentNode = w.utilities.getRootTag()[0];
			} else {
				if (e.getAttribute('_tag') == null && e.getAttribute('id') != 'entityHighlight') {
					if (e.getAttribute('data-mce-bogus') != null) {
						// artifact from selectStructureTag
						var sibling;
						var rng = ed.selection.getRng(true);
						if (rng.collapsed) {
							// the user's trying to type in a bogus tag
							// find the closest valid tag and correct the cursor location
							var backwardDirection = true;
							if (ed.lastKeyPress == 36 || ed.lastKeyPress == 37 || ed.lastKeyPress == 38) {
								sibling = $(e).prevAll('[_tag]')[0];
								backwardDirection = false;
							} else {
								sibling = $(e).nextAll('[_tag]')[0];
								if (sibling == null) {
									sibling = $(e).parent().nextAll('[_tag]')[0];
								}
							}
							if (sibling != null) {
								rng.selectNodeContents(sibling);
								rng.collapse(backwardDirection);
								ed.selection.setRng(rng);
							}
						} else {
							// the structure is selected
							sibling = $(e).next('[_tag]')[0];
						}
						if (sibling != null) {
							e = sibling;
						} else {
							e = e.parentNode;
						}
					} else {
						e = e.parentNode;
					}
					
					// use setTimeout to add to the end of the onNodeChange stack
					window.setTimeout(function(){
						w._fireNodeChange(e);
					}, 0);
				} else {
					ed.currentNode = e;
				}
			}
			
			w.event('nodeChanged').publish(ed.currentNode);
			
			if (w.emptyTagId) {
				delete w.entities[w.emptyTagId];
				w.emptyTagId = null;
			}
		}
	};
	
	function _onCopyHandler(ed, event) {
		if (ed.copiedElement.element != null) {
			$(ed.copiedElement.element).remove();
			ed.copiedElement.element = null;
		}
		
		w.event('contentCopied').publish();
	};
	
	function _onPasteHandler(ed, event) {
		window.setTimeout(function() {
			w.event('contentPasted').publish();
		}, 0);
	};
	
	function _hideContextMenus(evt) {
		var target = $(evt.target);
		// hide structure tree menu
		// TODO move to structure tree
		if ($.vakata && $.vakata.context && target.parents('.vakata-context').length === 0) {
			$.vakata.context.hide();
		}
		// hide editor menu
		if ($('#menu_editor_contextmenu:visible').length > 0 && target.parents('#menu_editor_contextmenu, #menu_structTagsContextMenu, #menu_changeTagContextMenu').length == 0) {
			w.editor.execCommand('hideContextMenu', w.editor, evt);
		}
	};
	
	function _doHighlightCheck(ed, evt) {
		var range = ed.selection.getRng(true);
		
		// check if inside boundary tag
		var parent = range.commonAncestorContainer;
		if (parent.nodeType == 1 && parent.hasAttribute('_entity')) {
			w.highlightEntity(); // remove highlight
			if ((w.editor.dom.hasClass(parent, 'start') && evt.which == 37) || 
				(w.editor.dom.hasClass(parent, 'end') && evt.which != 39)) {
				var prevNode = w.utilities.getPreviousTextNode(parent);
				range.setStart(prevNode, prevNode.length);
				range.setEnd(prevNode, prevNode.length);
			} else {
				var nextNode = w.utilities.getNextTextNode(parent);
				range.setStart(nextNode, 0);
				range.setEnd(nextNode, 0);
			}
			w.editor.selection.setRng(range);
			range = ed.selection.getRng(true);
		}
		
		var entityStart = w.tagger.findEntityBoundary('start', range.startContainer);
		var entityEnd = w.tagger.findEntityBoundary('end', range.endContainer);
		
		if (entityEnd == null || entityStart == null) {
			w.highlightEntity();
			var parentNode = $(ed.selection.getNode());
			if (parentNode.attr('_tag')) {
				var id = parentNode.attr('id');
				w.editor.currentStruct = id;
			}
			return;
		}
		
		var id = entityStart.getAttribute('name');
		if (id == ed.currentEntity) return;
		
		w.highlightEntity(id, ed.selection.getBookmark());
	};
	
	
	/**
	 * Begin init functions
	 */
	function init() {

		w.eventManager = new EventManager(w);
		w.schemaManager = new SchemaManager(w, {schemas: config.schemas});
		w.dialogManager = new DialogManager(w);
		w.utilities = new Utilities(w);
		w.tagger = new Tagger(w);
		w.converter = new Converter(w);
		w.fileManager = new FileManager(w);
		w.entitiesModel = new EntitiesModel(w);
		w.settings = new SettingsDialog(w, {
			showEntityBrackets: true,
			showStructBrackets: false
		});
		if (config.delegator != null) {
			w.delegator = new config.delegator(w);
		} else {
			alert('Error: you must specify a delegator in the CWRCWriter config for full functionality!');
		}
		if (config.id == null) {
			alert('Error: no ID supplied for CWRCWriter!');
		}
		
		$(document.body).mousedown(function(e) {
			_hideContextMenus(e);
		});
		
		if (window.location.hostname != 'localhost') {
			window.addEventListener('beforeunload', function(e) {
				if (tinymce.get('editor').isDirty()) {
					var msg = 'You have unsaved changes.';
					(e || window.event).returnValue = msg;
					return msg;
				}
			});
		}

		$(window).unload(function(e) {
			// clear the editor first (large docs can cause the browser to freeze)
			w.utilities.getRootTag().remove();
		});


		// event subscriptions for editor methods
		w.event('entityAdded').subscribe(function(entityId) {
			w.highlightEntity(entityId);
		});
		w.event('entityEdited').subscribe(function(entityId) {
			w.highlightEntity(entityId);
		});
		w.event('entityRemoved').subscribe(function(entityId) {
			w.highlightEntity();
		});
		w.event('entityPasted').subscribe(function(entityId) {
			w.highlightEntity(entityId);
		});

		/**
		 * Init tinymce
		 */
//				$('#editor').tinymce({
//					script_url : 'js/tinymce/jscripts/tiny_mce/tiny_mce.js',
		tinymce.init({
			mode: 'exact',
			elements: config.id,
			theme: 'advanced',
			content_css: w.cwrcRootUrl+'css/editor.css',
			
			width: '100%',
			
			contextmenu_never_use_native: true,
			
			doctype: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
			element_format: 'xhtml',
			
			forced_root_block: w.utilities.BLOCK_TAG,
			keep_styles: false, // false, otherwise tinymce interprets our spans as style elements
			
			paste_auto_cleanup_on_paste: true, // true, otherwise paste_postprocess isn't called
			paste_postprocess: function(pl, o) {
				function stripTags(index, node) {
					if (node.hasAttribute('_tag') || node.hasAttribute('_entity') ||
						node.nodeName.toLowerCase() == 'p' && node.nodeName.toLowerCase() == 'br') {
						$(node).children().each(stripTags);
					} else {
						if ($(node).contents().length == 0) {
							$(node).remove();
						} else {
							var contents = $(node).contents().unwrap();
							contents.not(':text').each(stripTags);
						}
					}
				}
				
				function replaceTags(index, node) {
					if (node.nodeName.toLowerCase() == 'p') {
						var tagName = w.utilities.getTagForEditor('p');
						$(node).contents().unwrap().wrapAll('<'+tagName+' _tag="p"></'+tagName+'>').not(':text').each(replaceTags);
					} else if (node.nodeName.toLowerCase() == 'br') {
						var tagName = w.utilities.getTagForEditor('br');
						$(node).replaceWith('<'+tagName+' _tag="lb"></'+tagName+'>');
					}
				}
				
				$(o.node).children().each(stripTags);
				$(o.node).children().each(replaceTags);
			},
			
			valid_elements: '*[*]', // allow everything
			
			plugins: '-treepaste,-entitycontextmenu,-schematags,-currenttag,-viewsource',
			theme_advanced_buttons1: config.buttons1 || 'schematags,|,addperson,addplace,adddate,addevent,addorg,addcitation,addnote,addtitle,addcorrection,addkeyword,addlink,|,editTag,removeTag,|,addtriple,|,viewsource,editsource,|,validate,savebutton,loadbutton',
			theme_advanced_buttons2: config.buttons2 || 'currenttag',
			theme_advanced_buttons3: config.buttons3 || '',
			theme_advanced_toolbar_location: 'top',
			theme_advanced_toolbar_align: 'left',
			theme_advanced_path: false,
			theme_advanced_statusbar_location: 'none',
			
			setup: function(ed) {
				// link the writer and editor
				w.editor = ed;
				ed.writer = w;
				
				// custom properties added to the editor
				ed.currentEntity = null; // the id of the currently highlighted entity
				ed.currentStruct = null; // the id of the currently selected structural tag
				ed.currentBookmark = null; // for storing a bookmark used when adding a tag
				ed.currentNode = null; // the node that the cursor is currently in
				ed.entityCopy = null; // store a copy of an entity for pasting
				ed.contextMenuPos = null; // the position of the context menu (used to position related dialog box)
				ed.copiedElement = {selectionType: null, element: null}; // the element that was copied (when first selected through the structure tree)
				ed.lastKeyPress = null; // the last key the user pressed
				
				ed.onInit.add(function(ed) {
					// modify isBlock method to check _tag attributes
					ed.dom.isBlock = function(node) {
						var type = node.nodeType;

						// If it's a node then check the type and use the nodeName
						if (type) {
							if (type === 1) {
								var tag = node.getAttribute('_tag') || node.nodeName;
//										return true;
								return !!(ed.schema.getBlockElements()[tag]);
							}
						}

						return !!ed.schema.getBlockElements()[node];
					};
					
					var settings = w.settings.getSettings();
					var body = $(ed.getBody());
					if (settings.showEntityBrackets) body.addClass('showEntityBrackets');
					if (settings.showStructBrackets) body.addClass('showStructBrackets');
					
					ed.addCommand('isSelectionValid', w.utilities.isSelectionValid);
					ed.addCommand('addEntity', w.tagger.addEntity);
					ed.addCommand('editTag', w.tagger.editTag);
					ed.addCommand('changeTag', w.tagger.changeTag);
					ed.addCommand('removeTag', w.tagger.removeTag);
					ed.addCommand('copyEntity', w.tagger.copyEntity);
					ed.addCommand('pasteEntity', w.tagger.pasteEntity);
					ed.addCommand('removeEntity', w.tagger.removeEntity);
					ed.addCommand('addStructureTag', w.tagger.addStructureTag);
					ed.addCommand('editStructureTag', w.tagger.editStructureTag);
					ed.addCommand('changeStructureTag', w.changeStructureTag);
					ed.addCommand('removeHighlights', w.removeHighlights);
					ed.addCommand('loadDocument', w.fileManager.loadDocument);
					ed.addCommand('getParentsForTag', w.utilities.getParentsForTag);
					ed.addCommand('getDocumentationForTag', w.delegator.getHelp);
					
					// used in conjunction with the paste plugin
					// needs to be false in order for paste postprocessing to function properly
					ed.pasteAsPlainText = false;
					
					// highlight tracking
					ed.onMouseUp.addToTop(_onMouseUpHandler);
					
					ed.onKeyDown.add(_onKeyDownHandler);
					ed.onKeyUp.add(_onKeyUpHandler);
					
					w.event('writerInitialized').publish(w);
				});
				ed.onChange.add(_onChangeHandler);
				ed.onNodeChange.add(_onNodeChangeHandler);
				ed.onCopy.add(_onCopyHandler);
				ed.onPaste.add(_onPasteHandler);
				
				// add schema file and method
				ed.addCommand('getSchema', function(){
					return w.schemaManager.schema;
				});
				
				// add custom plugins and buttons
				var plugins = ['treepaste','schematags','currenttag','entitycontextmenu','viewsource','scrolling_dropmenu'];
				
				for (var i = 0; i < plugins.length; i++) {
					var name = plugins[i];
					tinymce.PluginManager.load(name, w.cwrcRootUrl+'js/tinymce_plugins/'+name+'.js');
				}
				
				ed.addButton('addperson', {title: 'Tag Person', image: w.cwrcRootUrl+'img/user.png', 'class': 'entityButton person',
					onclick : function() {
						ed.execCommand('addEntity', 'person');
					}
				});
				ed.addButton('addplace', {title: 'Tag Place', image: w.cwrcRootUrl+'img/world.png', 'class': 'entityButton place',
					onclick : function() {
						ed.execCommand('addEntity', 'place');
					}
				});
				ed.addButton('adddate', {title: 'Tag Date', image: w.cwrcRootUrl+'img/calendar.png', 'class': 'entityButton date',
					onclick : function() {
						ed.execCommand('addEntity', 'date');
					}
				});
				ed.addButton('addevent', {title: 'Tag Event', image: w.cwrcRootUrl+'img/cake.png', 'class': 'entityButton event',
					onclick : function() {
						ed.execCommand('addEntity', 'event');
					}
				});
				ed.addButton('addorg', {title: 'Tag Organization', image: w.cwrcRootUrl+'img/group.png', 'class': 'entityButton org',
					onclick : function() {
						ed.execCommand('addEntity', 'org');
					}
				});
				ed.addButton('addcitation', {title: 'Tag Citation', image: w.cwrcRootUrl+'img/vcard.png', 'class': 'entityButton citation',
					onclick : function() {
						ed.execCommand('addEntity', 'citation');
					}
				});
				ed.addButton('addnote', {title: 'Tag Note', image: w.cwrcRootUrl+'img/note.png', 'class': 'entityButton note',
					onclick : function() {
						ed.execCommand('addEntity', 'note');
					}
				});
				ed.addButton('addcorrection', {title: 'Tag Correction', image: w.cwrcRootUrl+'img/error.png', 'class': 'entityButton correction',
					onclick : function() {
						ed.execCommand('addEntity', 'correction');
					}
				});
				ed.addButton('addkeyword', {title: 'Tag Keyword', image: w.cwrcRootUrl+'img/page_key.png', 'class': 'entityButton keyword',
					onclick : function() {
						ed.execCommand('addEntity', 'keyword');
					}
				});
				ed.addButton('addlink', {title: 'Tag Link', image: w.cwrcRootUrl+'img/link.png', 'class': 'entityButton link',
					onclick : function() {
						ed.execCommand('addEntity', 'link');
					}
				});
				ed.addButton('addtitle', {title: 'Tag Text/Title', image: w.cwrcRootUrl+'img/book.png', 'class': 'entityButton textTitle',
					onclick : function() {
						ed.execCommand('addEntity', 'title');
					}
				});
				ed.addButton('editTag', {title: 'Edit Tag', image: w.cwrcRootUrl+'img/tag_blue_edit.png', 'class': 'entityButton',
					onclick : function() {
						ed.execCommand('editTag');
					}
				});
				ed.addButton('removeTag', {title: 'Remove Tag', image: w.cwrcRootUrl+'img/tag_blue_delete.png', 'class': 'entityButton',
					onclick : function() {
						ed.execCommand('removeTag');
					}
				});
				ed.addButton('newbutton', {title: 'New', image: w.cwrcRootUrl+'img/page_white_text.png', 'class': 'entityButton',
					onclick: function() {
						w.fileManager.newDocument();
					}
				});
				ed.addButton('savebutton', {title: 'Save', image: w.cwrcRootUrl+'img/save.png',
					onclick: function() {
						w.fileManager.saveDocument();
					}
				});
				ed.addButton('saveasbutton', {title: 'Save As', image: w.cwrcRootUrl+'img/save_as.png',
					onclick: function() {
						w.dialogManager.filemanager.showSaver();
					}
				});
				ed.addButton('loadbutton', {title: 'Load', image: w.cwrcRootUrl+'img/folder_page.png', 'class': 'entityButton',
					onclick: function() {
						w.dialogManager.filemanager.showLoader();
					}
				});
				ed.addButton('editsource', {title: 'Edit Source', image: w.cwrcRootUrl+'img/editsource.gif', 'class': 'wideButton',
					onclick: function() {
						w.fileManager.editSource();
					}
				});
				ed.addButton('validate', {title: 'Validate', image: w.cwrcRootUrl+'img/validate.png', 'class': 'entityButton',
					onclick: function() {
						w.delegator.validate();
					}
				});
				ed.addButton('addtriple', {title: 'Add Relation', image: w.cwrcRootUrl+'img/chart_org.png', 'class': 'entityButton',
					onclick: function() {
						$('#westTabs').tabs('option', 'active', 2);
						w.dialogManager.show('triple');
					}
				});
				
				
//						ed.addButton('toggleeditor', {
//							title: 'Show Advanced Mode',
//							image: 'img/html.png',
//							'class': 'entityButton',
//							cmd: 'toggle_editor'
//						});
			}
		});
	};
	init();
	
	return w;
};

});