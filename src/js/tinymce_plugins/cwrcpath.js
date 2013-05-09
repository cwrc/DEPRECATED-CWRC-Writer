(function(exports, undefined) {
	"use strict";

	var modules = {};

	function require(ids, callback) {
		var module, defs = [];

		for (var i = 0; i < ids.length; ++i) {
			module = modules[ids[i]] || resolve(ids[i]);
			if (!module) {
				throw 'module definition dependecy not found: ' + ids[i];
			}

			defs.push(module);
		}

		callback.apply(null, defs);
	}

	function define(id, dependencies, definition) {
		if (typeof id !== 'string') {
			throw 'invalid module definition, module id must be defined and be a string';
		}

		if (dependencies === undefined) {
			throw 'invalid module definition, dependencies must be specified';
		}

		if (definition === undefined) {
			throw 'invalid module definition, definition function must be specified';
		}

		require(dependencies, function() {
			modules[id] = definition.apply(null, arguments);
		});
	}

	function defined(id) {
		return !!modules[id];
	}

	function resolve(id) {
		var target = exports;
		var fragments = id.split(/[.\/]/);

		for (var fi = 0; fi < fragments.length; ++fi) {
			if (!target[fragments[fi]]) {
				return;
			}

			target = target[fragments[fi]];
		}

		return target;
	}

	function expose(ids) {
		for (var i = 0; i < ids.length; i++) {
			var target = exports;
			var id = ids[i];
			var fragments = id.split(/[.\/]/);

			for (var fi = 0; fi < fragments.length - 1; ++fi) {
				if (target[fragments[fi]] === undefined) {
					target[fragments[fi]] = {};
				}

				target = target[fragments[fi]];
			}

			target[fragments[fragments.length - 1]] = modules[id];
		}
	}
	
define('tinymce/cwrcpath/CWRCPath', [
   'tinymce/ui/Path',
   'tinymce/EditorManager'
], function(Path, EditorManager) {
	return Path.extend({
		postRender: function() {
			var self = this, editor = EditorManager.activeEditor;

			function isBogus(elm) {
				return elm.nodeType === 1 && (elm.nodeName == "BR" || !!elm.getAttribute('data-mce-bogus'));
			}

			self.on('select', function(e) {
				var parents = [], node = editor.selection.getNode(), body = editor.getBody();

				while (node) {
					if (!isBogus(node)) {
						parents.push(node);
					}

					node = node.parentNode;
					if (node == body) {
						break;
					}
				}

				editor.focus();
				editor.selection.select(parents[parents.length - 1 - e.index]);
				editor.nodeChanged();
			});

			editor.on('nodeChange', function(e) {
				var parents = [], selectionParents = e.parents, i = selectionParents.length;

				while (i--) {
					if (!isBogus(selectionParents[i])) {
						var name = $(selectionParents[i]).attr('_tag');//selectionParents[i].nodeName.toLowerCase();
						parents.push({name: name});
					}
				}

				self.data(parents);
			});

			return self._super();
		}
	});
});

define("tinymce/cwrcpath/Plugin", [
	'tinymce/PluginManager',
	'tinymce/cwrcpath/CWRCPath'
], function(PluginManager, CWRCPath) {
	PluginManager.add('cwrcpath', function(editor) {
		var self = this;

		self.path = new CWRCPath(editor);
		
//		editor.add({type: 'panel', name: 'statusbar', classes: 'statusbar', layout: 'flow', border: '1 0 0 0',
//			items: [{type: 'cwrcpath'}]
//		});
	});
});

expose(["tinymce/cwrcpath/CWRCPath", "tinymce/cwrcpath/Plugin"]);
})(this);