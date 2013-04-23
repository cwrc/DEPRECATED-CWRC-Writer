// adds onCopy to events list

(function(tinymce) {
	var each = tinymce.each;

	tinymce.Editor.prototype.setupEvents = function() {
		var self = this, settings = self.settings;

		// Add events to the editor
		each([
			'onPreInit',

			'onBeforeRenderUI',

			'onPostRender',

			'onLoad',

			'onInit',

			'onRemove',

			'onActivate',

			'onDeactivate',

			'onClick',

			'onEvent',

			'onMouseUp',

			'onMouseDown',

			'onDblClick',

			'onKeyDown',

			'onKeyUp',

			'onKeyPress',

			'onContextMenu',

			'onSubmit',

			'onReset',

			'onPaste',
			
			'onCopy',

			'onPreProcess',

			'onPostProcess',

			'onBeforeSetContent',

			'onBeforeGetContent',

			'onSetContent',

			'onGetContent',

			'onLoadContent',

			'onSaveContent',

			'onNodeChange',

			'onChange',

			'onBeforeExecCommand',

			'onExecCommand',

			'onUndo',

			'onRedo',

			'onVisualAid',

			'onSetProgressState',

			'onSetAttrib'
		], function(name) {
			self[name] = new tinymce.util.Dispatcher(self);
		});

		// Handle legacy cleanup_callback option
		if (settings.cleanup_callback) {
			self.onBeforeSetContent.add(function(ed, o) {
				o.content = ed.execCallback('cleanup_callback', 'insert_to_editor', o.content, o);
			});

			self.onPreProcess.add(function(ed, o) {
				if (o.set)
					ed.execCallback('cleanup_callback', 'insert_to_editor_dom', o.node, o);

				if (o.get)
					ed.execCallback('cleanup_callback', 'get_from_editor_dom', o.node, o);
			});

			self.onPostProcess.add(function(ed, o) {
				if (o.set)
					o.content = ed.execCallback('cleanup_callback', 'insert_to_editor', o.content, o);

				if (o.get)						
					o.content = ed.execCallback('cleanup_callback', 'get_from_editor', o.content, o);
			});
		}

		// Handle legacy save_callback option
		if (settings.save_callback) {
			self.onGetContent.add(function(ed, o) {
				if (o.save)
					o.content = ed.execCallback('save_callback', ed.id, o.content, ed.getBody());
			});
		}

		// Handle legacy handle_event_callback option
		if (settings.handle_event_callback) {
			self.onEvent.add(function(ed, e, o) {
				if (self.execCallback('handle_event_callback', e, ed, o) === false) {
					e.preventDefault();
					e.stopPropagation();
				}
			});
		}

		// Handle legacy handle_node_change_callback option
		if (settings.handle_node_change_callback) {
			self.onNodeChange.add(function(ed, cm, n) {
				ed.execCallback('handle_node_change_callback', ed.id, n, -1, -1, true, ed.selection.isCollapsed());
			});
		}

		// Handle legacy save_callback option
		if (settings.save_callback) {
			self.onSaveContent.add(function(ed, o) {
				var h = ed.execCallback('save_callback', ed.id, o.content, ed.getBody());

				if (h)
					o.content = h;
			});
		}

		// Handle legacy onchange_callback option
		if (settings.onchange_callback) {
			self.onChange.add(function(ed, l) {
				ed.execCallback('onchange_callback', ed, l);
			});
		}
	};

	tinymce.Editor.prototype.bindNativeEvents = function() {
		// 'focus', 'blur', 'dblclick', 'beforedeactivate', submit, reset
		var self = this, i, settings = self.settings, dom = self.dom, nativeToDispatcherMap;

		nativeToDispatcherMap = {
			mouseup : 'onMouseUp',
			mousedown : 'onMouseDown',
			click : 'onClick',
			keyup : 'onKeyUp',
			keydown : 'onKeyDown',
			keypress : 'onKeyPress',
			submit : 'onSubmit',
			reset : 'onReset',
			contextmenu : 'onContextMenu',
			dblclick : 'onDblClick',
			paste : 'onPaste', // Doesn't work in all browsers yet
			copy : 'onCopy'
		};

		// Handler that takes a native event and sends it out to a dispatcher like onKeyDown
		function eventHandler(evt, args) {
			var type = evt.type;

			// Don't fire events when it's removed
			if (self.removed)
				return;

			// Sends the native event out to a global dispatcher then to the specific event dispatcher
			if (self.onEvent.dispatch(self, evt, args) !== false) {
				self[nativeToDispatcherMap[evt.fakeType || evt.type]].dispatch(self, evt, args);
			}
		};

		// Opera doesn't support focus event for contentEditable elements so we need to fake it
		function doOperaFocus(e) {
			self.focus(true);
		};

		function nodeChanged(ed, e) {
			// Normalize selection for example <b>a</b><i>|a</i> becomes <b>a|</b><i>a</i> except for Ctrl+A since it selects everything
			if (e.keyCode != 65 || !tinymce.VK.metaKeyPressed(e)) {
				self.selection.normalize();
			}

			self.nodeChanged();
		}

		// Add DOM events
		each(nativeToDispatcherMap, function(dispatcherName, nativeName) {

			var root = settings.content_editable ? self.getBody() : self.getDoc();

			switch (nativeName) {
				case 'contextmenu':
					dom.bind(root, nativeName, eventHandler);
					break;

				case 'paste':
					dom.bind(self.getBody(), nativeName, eventHandler);
					break;
					
				case 'copy':
					dom.bind(self.getBody(), nativeName, eventHandler);
					break;

				case 'submit':
				case 'reset':
					dom.bind(self.getElement().form || tinymce.DOM.getParent(self.id, 'form'), nativeName, eventHandler);
					break;

				default:
					dom.bind(root, nativeName, eventHandler);
			}
		});

		// Set the editor as active when focused
		dom.bind(settings.content_editable ? self.getBody() : (tinymce.isGecko ? self.getDoc() : self.getWin()), 'focus', function(e) {
			self.focus(true);
		});

		if (settings.content_editable && tinymce.isOpera) {
			dom.bind(self.getBody(), 'click', doOperaFocus);
			dom.bind(self.getBody(), 'keydown', doOperaFocus);
		}

		// Add node change handler
		self.onMouseUp.add(nodeChanged);

		self.onKeyUp.add(function(ed, e) {
			var keyCode = e.keyCode;

			if ((keyCode >= 33 && keyCode <= 36) || (keyCode >= 37 && keyCode <= 40) || keyCode == 13 || keyCode == 45 || keyCode == 46 || keyCode == 8 || (tinymce.isMac && (keyCode == 91 || keyCode == 93)) || e.ctrlKey)
				nodeChanged(ed, e);
		});

		// Add reset handler
		self.onReset.add(function() {
			self.setContent(self.startContent, {format : 'raw'});
		});

		// Add shortcuts
		function handleShortcut(e, execute) {
			if (e.altKey || e.ctrlKey || e.metaKey) {
				each(self.shortcuts, function(shortcut) {
					var ctrlState = tinymce.isMac ? e.metaKey : e.ctrlKey;

					if (shortcut.ctrl != ctrlState || shortcut.alt != e.altKey || shortcut.shift != e.shiftKey)
						return;

					if (e.keyCode == shortcut.keyCode || (e.charCode && e.charCode == shortcut.charCode)) {
						e.preventDefault();

						if (execute) {
							shortcut.func.call(shortcut.scope);
						}

						return true;
					}
				});
			}
		};

		self.onKeyUp.add(function(ed, e) {
			handleShortcut(e);
		});

		self.onKeyPress.add(function(ed, e) {
			handleShortcut(e);
		});

		self.onKeyDown.add(function(ed, e) {
			handleShortcut(e, true);
		});

		if (tinymce.isOpera) {
			self.onClick.add(function(ed, e) {
				e.preventDefault();
			});
		}
	};
})(tinymce);