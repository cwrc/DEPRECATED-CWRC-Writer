function Writer(config) {
	config = config || {};
	
	var w = this;
	
	w.layout = null; // jquery ui layout object
	w.editor = null; // reference to the tinyMCE instance we're creating, set in setup
	w.entities = {}; // entities store
	w.structs = {}; // structs store
	w.triples = []; // triples store
	// store deleted tags in case of undo
	// TODO add garbage collection for this
	w.deletedEntities = {};
	w.deletedStructs = {};

	w.schemaXML = null; // a cached copy of the loaded schema
	w.schemaJSON = null; // a json version of the schema
	w.schema = {elements: []}; // stores a list of all the elements of the loaded schema
	
	w.project = config.project; // the current project (cwrc or russell)
	
	w.baseUrl = window.location.protocol+'//'+window.location.host+'/';
	
	w.currentDocId = null;
	
	// editor mode
	w.mode = config.mode;
	
	// schema for validation (http://www.arts.ualberta.ca/~cwrc/schema/)
	w.validationSchema = 'cwrcbasic';
	
	// root block element, should come from schema
	w.root = '';
	// header element: hidden in editor view, can only edit from structure tree
	w.header = '';
	// id attribute name, based on schema
	w.idName = '';
	
	// possible editor modes
	w.XMLRDF = 0; // allows for overlapping elements, i.e. entities
	w.XML = 1; // standard xml, no overlapping elements
	
	// possible results when trying to add entity
	w.NO_SELECTION = 0;
	w.NO_COMMON_PARENT = 1;
	w.VALID = 2;
	
	w.emptyTagId = null; // stores the id of the entities tag to be added
	
	w.u = null; // utilities
	w.tagger = null; // tagger
	w.fm = null; // filemanager
	w.entitiesList = null; // entities list
	w.tree = null; // structure tree
	w.relations = null; // relations list
	w.dialogs = null; // dialogs manager
	w.settings = null; // settings dialog
	w.delegator = null;	

	w.highlightEntity = function(id, bm, doScroll) {
		w.editor.currentEntity = null;
		
		var prevHighlight = $('#entityHighlight', w.editor.getBody());
		if (prevHighlight.length == 1) {
			var parent = prevHighlight.parent()[0];
			prevHighlight.contents().unwrap();
			parent.normalize();
			
			$('#entities > ul > li').each(function(index, el) {
				$(this).removeClass('selected').css('background-color', '').find('div[class="info"]').hide();
			});
		}
		
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
			
//			w.tree.selectNode($('#entityHighlight', w.editor.getBody())[0]);
			
			$('#entities > ul > li[name="'+id+'"]').addClass('selected').find('div[class="info"]').show();
		}
	};
	
	w.showError = function(errorType) {
		switch(errorType) {
		case w.NO_SELECTION:
			w.dialogs.show('message', {
				title: 'Error',
				msg: 'Please select some text before adding an entity or tag.',
				type: 'error'
			});
			break;
		case w.NO_COMMON_PARENT:
			w.dialogs.show('message', {
				title: 'Error',
				msg: 'Please ensure that the beginning and end of your selection have a common parent.<br/>For example, your selection cannot begin in one paragraph and end in another, or begin in bolded text and end outside of that text.',
				type: 'error'
			});
		}
	};
	
	w.addEntity = function(type) {
		var result = w.u.isSelectionValid();
		if (result == w.VALID) {
			w.editor.currentBookmark = w.editor.selection.getBookmark(1);
			w.dialogs.show(type, {type: type, title: w.em.getTitle(type), pos: w.editor.contextMenuPos});
		} else {
			w.showError(result);
		}
	};
	
	w.finalizeEntity = function(type, info) {
		w.editor.selection.moveToBookmark(w.editor.currentBookmark);
		if (info != null) {
//			var startTag = w.editor.$('[name='+id+'][class~=start]');
//			for (var key in info) {
//				startTag.attr(key, w.u.escapeHTMLString(info[key]));
//			}
			var id = w.tagger.addEntityTag(type);
			w.entities[id].info = info;
			w.entitiesList.update();
			w.highlightEntity(id);
		}
		w.editor.currentBookmark = null;
		w.editor.focus();
	};
	
	w.editEntity = function(id, info) {
		w.entities[id].info = info;
		w.entitiesList.update();
		w.highlightEntity(id);
	};
	
	w.copyEntity = function(id, pos) {
		var tag = w.tagger.getCurrentTag(id);
		if (tag.entity) {
			w.editor.entityCopy = tag.entity;
		} else {
			w.dialogs.show('message', {
				title: 'Error',
				msg: 'Cannot copy structural tags.',
				type: 'error'
			});
		}
	};
	
	w.pasteEntity = function(pos) {
		if (w.editor.entityCopy == null) {
			w.dialogs.show('message', {
				title: 'Error',
				msg: 'No entity to copy!',
				type: 'error'
			});
		} else {
			var newEntity = jQuery.extend(true, {}, w.editor.entityCopy);
			newEntity.props.id = tinymce.DOM.uniqueId('ent_');
			
			w.editor.selection.moveToBookmark(w.editor.currentBookmark);
			var sel = w.editor.selection;
			sel.collapse();
			var rng = sel.getRng(true);
			var text = w.editor.getDoc().createTextNode(newEntity.props.content);
			rng.insertNode(text);
			sel.select(text);
			
			rng = sel.getRng(true);
			w.tagger.insertBoundaryTags(newEntity.props.id, newEntity.props.type, rng);
			
			w.entities[newEntity.props.id] = newEntity;
			w.entitiesList.update();
			w.highlightEntity(newEntity.props.id);
		}
	};
	
	w.removeEntity = function(id) {
		id = id || w.editor.currentEntity;
		
		delete w.entities[id];
		var node = $('span[name="'+id+'"]', w.editor.getBody());
		var parent = node[0].parentNode;
		node.remove();
		parent.normalize();
		w.highlightEntity();
		w.entitiesList.remove(id);
		w.editor.currentEntity = null;
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
		
		if (selectContentsOnly) {
			if (tinymce.isWebKit) {
				$('[data-mce-bogus]', node).remove();
				node.prepend('<span data-mce-bogus="1">\uFEFF</span>').append('<span data-mce-bogus="1">\uFEFF</span>');
			}
			var rng = w.editor.dom.createRng();
			rng.setStart(nodeEl.firstChild, 0);
			rng.setEnd(nodeEl.lastChild, nodeEl.lastChild.length);
			w.editor.selection.setRng(rng);
//			w.tree.currentlySelectedNode = id;
		} else {
			$('[data-mce-bogus]', node.parent()).remove();
			
			// if no nextElementSibling then only the contents will be copied in webkit
			if (tinymce.isWebKit && nodeEl.nextElementSibling == null) {
				// sibling needs to be visible otherwise it doesn't count
				node.after('<span data-mce-bogus="1" style="display: inline;">\uFEFF</span>');
			}
			node.before('<span data-mce-bogus="1">\uFEFF</span>').after('<span data-mce-bogus="1">\uFEFF</span>');
			
			var rng = w.editor.dom.createRng();
			rng.setStart(nodeEl.previousSibling, 0);
			rng.setEnd(nodeEl.nextSibling, 0);
			w.editor.selection.setRng(rng);
		}
		
		// scroll node into view
		$(w.editor.getDoc()).scrollTop(node.position().top - $(w.editor.getContentAreaContainer()).height()*0.25);
		
		w._fireNodeChange(nodeEl);
		
		w.editor.focus();
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
		w.fm.loadDocumentFromXml(docXml);
	};
	
	/**
	 * Get the current document from the editor
	 * @returns Element The XML document serialized to a string
	 */
	w.getDocument = function() {
		var docString = w.fm.getDocumentContent(true);
		var doc = null;
		try {
			var parser = new DOMParser();
			doc = parser.parseFromString(docString, 'application/xml');
		} catch(e) {
			w.dialogs.show('message', {
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
	
	// webkit has trouble deleting divs, so use the tree and jquery as a workaround
	function _webKitOnKeyDownDeleteHandler(ed, evt) {
		if (evt.which == 8 || evt.which == 46) {
			if (w.tree.currentlySelectedNode != null) {
				// cancel keyboard delete
				tinymce.dom.Event.cancel(evt);
				if (w.tree.selectionType == w.tree.NODE_SELECTED) {
					$('#'+w.tree.currentlySelectedNode, ed.getBody()).remove();
				} else {
					$('#'+w.tree.currentlySelectedNode, ed.getBody()).contents().remove();
				}
			}
		}
	}
	
	function _onMouseUpHandler(ed, evt) {
		_hideContextMenus(evt);
		_doHighlightCheck(ed, evt);
	};
	
	function _onKeyDownHandler(ed, evt) {
		// TODO move to keyup
		// redo/undo listener
		if ((evt.which == 89 || evt.which == 90) && evt.ctrlKey) {
			w.entitiesList.update();
			w.tree.update();
		}
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
			entity.props.title = w.u.getTitleFromContent(content);
			w.entitiesList.update();
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
				
				w.entitiesList.update();
			} else {
				delete w.entities[w.emptyTagId];
			}
			w.emptyTagId = null;
		}
		
		if (ed.currentNode) {
			// check if text is allowed in this node
			if (ed.currentNode.getAttribute('_textallowed') == 'false') {
				w.dialogs.show('message', {
					title: 'No Text Allowed',
					msg: 'Text is not allowed in the current tag: '+ed.currentNode.getAttribute('_tag')+'.',
					type: 'error'
				});
				
				// remove all text
				$(ed.currentNode).contents().filter(function() {
					return this.nodeType == 3;
				}).remove();
			}
			
			// replace br's inserted on shift+enter
			if (evt.shiftKey && evt.which == 13) {
				var node = ed.currentNode;
				if ($(node).attr('_tag') == 'lb') node = node.parentNode;
				var tagName = w.u.getTagForEditor('lb');
				$(node).find('br').replaceWith('<'+tagName+' _tag="lb"></'+tagName+'>');
			}
		}
		
		// delete keys check
		// need to do this here instead of in onchangehandler because that one doesn't update often enough
		if (evt.which == 8 || evt.which == 46) {
			var doUpdate = w.tagger.findNewAndDeletedTags();
			if (doUpdate) w.tree.update();
		}
		
		// enter key
		if (evt.which == 13) {
			// TODO not successful for multiple contiguous enter key presses
			// look for empty tag inserted by enter
			var currNode = $(ed.currentNode);
			if (currNode.length == 1 && currNode.text() == '') {
				currNode.text('\uFEFF'); // insert zero-width non-breaking space so empty tag takes up space (if block element)
				if (!w.u.isTagBlockLevel(currNode.attr('_tag'))) {
					w.selectStructureTag(currNode.attr('id'), true);
				}
			}
		}
	};
	
	function _onChangeHandler(ed, event) {
		if (ed.isDirty()) {
			$('br', ed.getBody()).remove();
			var doUpdate = w.tagger.findNewAndDeletedTags();
			if (doUpdate) w.tree.update();
		}
	};
	
	function _onNodeChangeHandler(ed, cm, e) {
//		console.log('onNodeChangeHandler');
//		console.time('nodechange');
		if (e != null) {
			if (e.nodeType != 1) {
				ed.currentNode = w.u.getRootTag()[0];
			} else {
				if (e.getAttribute('_tag') == null) {
					if (e.getAttribute('data-mce-bogus') != null) {
						// artifact from selectStructureTag
						var sibling = $(e).next('[_tag]')[0];
						if (sibling != null) {
							e = sibling;
						} else {
							e = e.parentNode;
						}
					} else {
						e = e.parentNode;
					}
					
	//				_onNodeChangeHandler(ed, cm, e);
					// use setTimeout to add to the end of the onNodeChange stack
					window.setTimeout(function(){
//						console.log('fireNodeChange');
						w._fireNodeChange(e);
					}, 0);
				} else {
					ed.currentNode = e;
				}
			}
			if (ed.currentNode) {
				w.tree.selectNode(ed.currentNode);
			}
			if (w.emptyTagId) {
				delete w.entities[w.emptyTagId];
				w.emptyTagId = null;
			}
		}
//		console.timeEnd('nodechange');
	};
	
	function _onCopyHandler(ed, event) {
		if (ed.copiedElement.element != null) {
			$(ed.copiedElement.element).remove();
		}
		if (w.tree.currentlySelectedNode != null) {
			var clone = $('#'+w.tree.currentlySelectedNode, ed.getBody()).clone();
			ed.copiedElement.element = clone.wrapAll('<div />').parent()[0];
			ed.copiedElement.selectionType = w.tree.selectionType;
		} else {
			ed.copiedElement.element = null;
		}
	};
	
	function _onPasteHandler(ed, event) {
		window.setTimeout(function() {
			w.tagger.findDuplicateTags();
			w.entitiesList.update();
			w.tree.update();
		}, 0);
	};
	
	function _hideContextMenus(evt) {
		var target = $(evt.target);
		// hide structure tree menu
		if ($.vakata.context.vis && target.parents('#vakata-contextmenu').length == 0) {
			$.vakata.context.hide();
		}
		// hide editor menu
		if ($('#menu_editor_contextmenu:visible').length > 0 && target.parents('#menu_editor_contextmenu').length == 0) {
			w.editor.execCommand('hideContextMenu', w.editor, evt);
		}
	};
	
	function _doHighlightCheck(ed, evt) {
//		console.log('_doHighlightCheck');
		var range = ed.selection.getRng(true);
		
		// check if inside boundary tag
		var parent = range.commonAncestorContainer.parentNode;
		if (parent.hasAttribute('_entity')) {
			w.highlightEntity();
			if ((w.editor.dom.hasClass(parent, 'start') && evt.which == 37) || 
				(w.editor.dom.hasClass(parent, 'end') && evt.which != 39)) {
				var prevNode = w.u.getPreviousTextNode(parent);
				range.setStart(prevNode, prevNode.length);
				range.setEnd(prevNode, prevNode.length);
			} else {
				var nextNode = w.u.getNextTextNode(parent);
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
	w.init = function() {
		var cssFiles = ['smoothness/jquery-ui-1.9.0.custom.css', 'css/layout-default-latest.css', 'js/lib/snippet/jquery.snippet.css'];
		for (var i = 0; i < cssFiles.length; i++) {
			var css = $('<link />');
			css.attr({
				rel: 'stylesheet',
				type: 'text/css',
				href: cssFiles[i]
			});
			$(document.head).append(css);
		}
		
		w.layout = $(document.body).layout({
			defaults: {
				maskIframesOnResize: true,
				resizable: true,
				slidable: false
			},
			north: {
				size: 35,
				resizable: false,
				spacing_open: 0,
				spacing_closed: 0
			},
			east: {
				size: 'auto',
				minSize: 300
			},
			south: {
				size: 34,
				resizable: false,
				spacing_open: 0,
				spacing_closed: 0
			},
			west: {
				size: 'auto',
				minSize: 375,
				onresize: function(region, pane, state, options) {
					var tabsHeight = $('#westTabs > ul').outerHeight();
					$('#westTabsContent').height(state.layoutHeight - tabsHeight);
//					$.layout.callbacks.resizeTabLayout(region, pane);
				}
			}
		});
		w.layout.panes.center.layout({
			defaults: {
				maskIframesOnResize: true,
				resizable: true,
				slidable: false
			},
			center: {
				onresize: function(region, pane, state, options) {
					var uiHeight = $('#'+w.editor.id+'_tbl tr.mceFirst').outerHeight() + 2;
					$('#'+w.editor.id+'_ifr').height(state.layoutHeight - uiHeight);
				}
			},
			south: {
				size: 250,
				initClosed: true,
				activate: function(event, ui) {
					$.layout.callbacks.resizeTabLayout(event, ui);
				},
//				onopen_start: function(region, pane, state, options) {
//					var southTabs = $('#southTabs');
//					if (!southTabs.hasClass('ui-tabs')) {
//						
//					}
//				},
				onresize: function(region, pane, state, options) {
					var tabsHeight = $('#southTabs > ul').outerHeight();
					$('#southTabsContent').height(state.layoutHeight - tabsHeight);
				}
			}
		});
		
		$('#header h1').click(function() {
			window.location = 'http://www.cwrc.ca';
		});
		
		if (w.mode != null && w.mode == 'xml') {
			w.mode = w.XML;
		} else {
			w.mode = w.XMLRDF;
		}
		
		w.dialogs = new DialogManager({writer: w});
		w.u = new Utilities({writer: w});
		w.tagger = new Tagger({writer: w});
		w.fm = new FileManager({writer: w});
		w.tree = new StructureTree({writer: w, parentId: '#westTabsContent'});
		w.entitiesList = new EntitiesList({writer: w, parentId: '#westTabsContent'});
		w.em = new EntitiesModel();
		w.relations = new Relations({writer: w, parentId: '#westTabsContent'});
		w.validation = new Validation({writer: w, parentId: '#southTabsContent'});
		w.selection = new Selection({writer: w, parentId: '#southTabsContent'});
		w.settings = new SettingsDialog(w, {
			showEntityBrackets: true,
			showStructBrackets: false
		});
		if (config.delegator != null) {
			w.delegator = new config.delegator({writer: w});
		} else {
			alert('Error: you must specify a delegator in the Writer config for full functionality!');
		}
		
		$(document.body).click(_hideContextMenus);
		$('#westTabs').tabs({
			active: 1,
			activate: function(event, ui) {
				$.layout.callbacks.resizeTabLayout(event, ui);
			},
			create: function(event, ui) {
				$('#westTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
			}
		});
		$('#southTabs').tabs({
			active: 1,
			activate: function(event, ui) {
				$.layout.callbacks.resizeTabLayout(event, ui);
			},
			create: function(event, ui) {
				$('#southTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
			}
		});
		
		// TODO not getting fired
		window.addEventListener('unload', function(e) {
			alert('unload');
			// clear the editor first (large docs can cause the browser to freeze)
			w.u.getRootTag().remove();
		});
		
		/**
		 * Init tinymce
		 */
//		$('#editor').tinymce({
//			script_url : 'js/tinymce/jscripts/tiny_mce/tiny_mce.js',
		tinyMCE.init({
			mode: 'exact',
			elements: 'editor',
			theme: 'advanced',
			
			content_css: 'css/editor.css',
			
			width: '100%',
			
			contextmenu_never_use_native: true,
			
			doctype: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
			element_format: 'xhtml',
			
			forced_root_block: w.u.BLOCK_TAG,
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
						var tagName = w.u.getTagForEditor('p');
						$(node).contents().unwrap().wrapAll('<'+tagName+' _tag="p"></'+tagName+'>').not(':text').each(replaceTags);
					} else if (node.nodeName.toLowerCase() == 'br') {
						var tagName = w.u.getTagForEditor('br');
						$(node).replaceWith('<'+tagName+' _tag="lb"></'+tagName+'>');
					}
				}
				
				$(o.node).children().each(stripTags);
				$(o.node).children().each(replaceTags);
			},
			
			valid_elements: '*[*]', // allow everything
			
			plugins: '-treepaste,-entitycontextmenu,-schematags,-currenttag,-viewsource',
			theme_advanced_buttons1: 'schematags,|,addperson,addplace,adddate,addevent,addorg,addcitation,addnote,addtitle,addcorrection,addkeyword,addlink,|,editTag,removeTag,|,addtriple,|,viewsource,editsource,|,validate,savebutton,loadbutton',
			theme_advanced_buttons2: 'currenttag',
			theme_advanced_buttons3: '',
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
				
				ed.onInit.add(function(ed) {
					// modify isBlock method to check _tag attributes
					ed.dom.isBlock = function(node) {
						var type = node.nodeType;

						// If it's a node then check the type and use the nodeName
						if (type) {
							if (type === 1) {
								var tag = node.getAttribute('_tag') || node.nodeName;
//								console.log(tag);
//								return !!(ed.schema.getBlockElements()[tag]);
								return true;
							}
						}

						return !!ed.schema.getBlockElements()[node];
					};
					
					var settings = w.settings.getSettings();
					var body = $(ed.getBody());
					if (settings.showEntityBrackets) body.addClass('showEntityBrackets');
					if (settings.showStructBrackets) body.addClass('showStructBrackets');
					
					w.selection.init();
					
					ed.addCommand('isSelectionValid', w.u.isSelectionValid);
					ed.addCommand('showError', w.showError);
					ed.addCommand('addEntity', w.addEntity);
					ed.addCommand('editTag', w.tagger.editTag);
					ed.addCommand('changeTag', w.tagger.changeTag);
					ed.addCommand('removeTag', w.tagger.removeTag);
					ed.addCommand('copyEntity', w.copyEntity);
					ed.addCommand('pasteEntity', w.pasteEntity);
					ed.addCommand('removeEntity', w.removeEntity);
					ed.addCommand('addStructureTag', w.tagger.addStructureTag);
					ed.addCommand('editStructureTag', w.tagger.editStructureTag);
					ed.addCommand('changeStructureTag', w.changeStructureTag);
					ed.addCommand('updateStructureTree', w.tree.update);
					ed.addCommand('removeHighlights', w.removeHighlights);
					ed.addCommand('exportDocument', w.fm.exportDocument);
					ed.addCommand('loadDocument', w.fm.loadDocument);
					ed.addCommand('getParentsForTag', w.u.getParentsForTag);
					ed.addCommand('getDocumentationForTag', w.delegator.getHelp);
					
					// used in conjunction with the paste plugin
					// needs to be false in order for paste postprocessing to function properly
					ed.pasteAsPlainText = false;
					
					// highlight tracking
					ed.onMouseUp.add(_onMouseUpHandler);
					
					ed.onKeyDown.add(_onKeyDownHandler);
					if (tinymce.isWebKit) {
						ed.onKeyDown.addToTop(_webKitOnKeyDownDeleteHandler);
					}
					ed.onKeyUp.add(_onKeyUpHandler);
					
					setTimeout(function() {
						w.layout.resizeAll(); // now that the editor is loaded, set proper sizing
					}, 250);
					
					// load a starting document
					w.fm.loadInitialDocument(window.location.hash);
				});
				ed.onChange.add(_onChangeHandler);
				ed.onNodeChange.add(_onNodeChangeHandler);
				ed.onCopy.add(_onCopyHandler);
				ed.onPaste.add(_onPasteHandler);
				
				// add schema file and method
				ed.addCommand('getSchema', function(){
					return w.schema;
				});
				
				// add custom plugins and buttons
				var plugins = ['treepaste','schematags','currenttag','entitycontextmenu','viewsource','scrolling_dropmenu'];
				
				for (var i = 0; i < plugins.length; i++) {
					var name = plugins[i];
					tinymce.PluginManager.load(name, '../../tinymce_plugins/'+name+'.js');
				}
				
				ed.addButton('addperson', {title: 'Tag Person', image: 'img/user.png', 'class': 'entityButton person',
					onclick : function() {
						ed.execCommand('addEntity', 'person');
					}
				});
				ed.addButton('addplace', {title: 'Tag Place', image: 'img/world.png', 'class': 'entityButton place',
					onclick : function() {
						ed.execCommand('addEntity', 'place');
					}
				});
				ed.addButton('adddate', {title: 'Tag Date', image: 'img/calendar.png', 'class': 'entityButton date',
					onclick : function() {
						ed.execCommand('addEntity', 'date');
					}
				});
				ed.addButton('addevent', {title: 'Tag Event', image: 'img/cake.png', 'class': 'entityButton event',
					onclick : function() {
						ed.execCommand('addEntity', 'event');
					}
				});
				ed.addButton('addorg', {title: 'Tag Organization', image: 'img/group.png', 'class': 'entityButton org',
					onclick : function() {
						ed.execCommand('addEntity', 'org');
					}
				});
				ed.addButton('addcitation', {title: 'Tag Citation', image: 'img/vcard.png', 'class': 'entityButton citation',
					onclick : function() {
						ed.execCommand('addEntity', 'citation');
					}
				});
				ed.addButton('addnote', {title: 'Tag Note', image: 'img/note.png', 'class': 'entityButton note',
					onclick : function() {
						ed.execCommand('addEntity', 'note');
					}
				});
				ed.addButton('addcorrection', {title: 'Tag Correction', image: 'img/error.png', 'class': 'entityButton correction',
					onclick : function() {
						ed.execCommand('addEntity', 'correction');
					}
				});
				ed.addButton('addkeyword', {title: 'Tag Keyword', image: 'img/page_key.png', 'class': 'entityButton keyword',
					onclick : function() {
						ed.execCommand('addEntity', 'keyword');
					}
				});
				ed.addButton('addlink', {title: 'Tag Link', image: 'img/link.png', 'class': 'entityButton link',
					onclick : function() {
						ed.execCommand('addEntity', 'link');
					}
				});
				ed.addButton('addtitle', {title: 'Tag Text/Title', image: 'img/book.png', 'class': 'entityButton textTitle',
					onclick : function() {
						ed.execCommand('addEntity', 'title');
					}
				});
				ed.addButton('editTag', {title: 'Edit Tag', image: 'img/tag_blue_edit.png', 'class': 'entityButton',
					onclick : function() {
						ed.execCommand('editTag');
					}
				});
				ed.addButton('removeTag', {title: 'Remove Tag', image: 'img/tag_blue_delete.png', 'class': 'entityButton',
					onclick : function() {
						ed.execCommand('removeTag');
					}
				});
				ed.addButton('newbutton', {title: 'New', image: 'img/page_white_text.png', 'class': 'entityButton',
					onclick: function() {
						w.fm.newDocument();
					}
				});
				ed.addButton('savebutton', {title: 'Save', image: 'img/save.png',
					onclick: function() {
						w.fm.saveDocument();
					}
				});
				ed.addButton('saveasbutton', {title: 'Save As', image: 'img/save_as.png',
					onclick: function() {
						w.dialogs.filemanager.showSaver();
					}
				});
				ed.addButton('loadbutton', {title: 'Load', image: 'img/folder_page.png', 'class': 'entityButton',
					onclick: function() {
						w.dialogs.filemanager.showLoader();
					}
				});
				ed.addButton('editsource', {title: 'Edit Source', image: 'img/editsource.gif', 'class': 'wideButton',
					onclick: function() {
						w.fm.editSource();
					}
				});
				ed.addButton('validate', {title: 'Validate', image: 'img/validate.png', 'class': 'entityButton',
					onclick: function() {
						w.delegator.validate();
					}
				});
				ed.addButton('addtriple', {title: 'Add Relation', image: 'img/chart_org.png', 'class': 'entityButton',
					onclick: function() {
						$('#westTabs').tabs('select', 2);
						w.dialogs.show('triple');
					}
				});
				
//				ed.addButton('toggleeditor', {
//					title: 'Show Advanced Mode',
//					image: 'img/html.png',
//					'class': 'entityButton',
//					cmd: 'toggle_editor'
//				});
			}
		});
	};
}