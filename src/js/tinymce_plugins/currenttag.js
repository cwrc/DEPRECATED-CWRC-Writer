(function(tinymce) {
	tinymce.create('tinymce.plugins.CurrentTag', {
		init: function(ed, url) {
			var t = this;
			t.url = url;
			t.editor = ed;
			
			ed.onNodeChange.add(function(ed, cm, n, co, ob) {
				function getParent(name) {
					var i, parents = ob.parents, func = name;

					if (typeof(name) == 'string') {
						func = function(node) {
							return node.nodeName == name;
						};
					}

					for (i = 0; i < parents.length; i++) {
						if (func(parents[i]))
							return parents[i];
					}
				}
				
				$('#currentPath').empty();
				var de = 0;
				getParent(function(n) {
					if (n.getAttribute('data-mce-bogus'))
						return;
					// Ignore non element and hidden elements
					if (n.nodeType != 1 || n.nodeName === 'BR' || (t.editor.dom.hasClass(n, 'mceItemHidden') || t.editor.dom.hasClass(n, 'mceItemRemoved')))
						return;
					
					var tag = n.getAttribute('_tag');
					var id = n.getAttribute('id');
					var title = 'id: '+id;
					if (tag != null) {
						var pi = t.editor.dom.create('a', {name: id, 'href' : "javascript:;", role: 'button', onmousedown : "return false;", title : title, 'class' : 'mcePath_' + (de++)}, tag);
						var p = $('#currentPath')[0];
						if (p.hasChildNodes()) {
							p.insertBefore(t.editor.dom.create('span', {'aria-hidden': 'true'}, '\u00a0\u00bb '), p.firstChild);
							p.insertBefore(pi, p.firstChild);
						} else {
							p.appendChild(pi);
						}
					}
				});
				
				$('#currentPath a').click(function() {
					var id = $(this).attr('name');
					if (id) t.editor.writer.selectStructureTag(id);
				});
			});
			
			ed.addCommand('closeCurrentTag', function() {
				var node = t.editor.currentNode;
				if (node.getAttribute('_tag')) {
					if ($(node).text() == '') {
						var id = node.getAttribute('id');
						t.editor.execCommand('removeTag', id);
					} else {
						var range = t.editor.selection.getRng(true);
						if (node.nextSibling) {
							range.setStart(node.nextSibling, 0);
							range.setEnd(node.nextSibling, 0);
						} else {
							range.setStartAfter(node);
							range.setEndAfter(node);
						}
					}
				}
				// TODO add entity handling
			});
		},
		
		createControl: function(n, cm) {
			if (n == 'currenttag') {
				var c = new tinymce.ui.Label('currentPath');
				return cm.add(c);
			}
	
			return null;
		}
	});
	
	tinymce.PluginManager.add('currenttag', tinymce.plugins.CurrentTag);
})(tinymce);

/**
 * Custom label class, used by this plugin
 */
tinymce.create('tinymce.ui.Label:tinymce.ui.Control', {
	Label : function(id, s) {
		this.parent(id, s);
		this.classPrefix = 'mceLabel';
	},

	renderHTML : function() {
		return tinymce.DOM.createHTML('span', {id : this.id, 'class' : this.classPrefix, role : 'button', tabindex : '-1'});
	}
});