(function() {
	var Event = tinymce.dom.Event, each = tinymce.each, DOM = tinymce.DOM;

	/**
	 * This plugin a context menu to TinyMCE editor instances.
	 *
	 * @class tinymce.plugins.ContextMenu
	 */
	tinymce.create('tinymce.plugins.EntityContextMenu', {
		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 * This call is done before the editor instance has finished it's initialization so use the onInit event
		 * of the editor instance to intercept that event.
		 *
		 * @method init
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			var t = this, showMenu, hideMenu, contextmenuNeverUseNative, realCtrlKey;
			t.url = url;
			t.editor = ed;
			t.curPos = {};
			t.showContextMenu = false; // whether to trigger the context menu (needed on mac)

			contextmenuNeverUseNative = ed.settings.contextmenu_never_use_native;

			/**
			 * This event gets fired when the context menu is shown.
			 *
			 * @event onContextMenu
			 * @param {tinymce.plugins.EntityContextMenu} sender Plugin instance sending the event.
			 * @param {tinymce.ui.DropMenu} menu Drop down menu to fill with more items if needed.
			 */
			t.onContextMenu = new tinymce.util.Dispatcher(this);

			hideMenu = function(e) {
				hide(ed, e);
			};
			
			showMenu = ed.onContextMenu.add(function(ed, e) {
				// Block TinyMCE menu on ctrlKey and work around Safari issue
				if ((realCtrlKey !== 0 ? realCtrlKey : e.ctrlKey) && !contextmenuNeverUseNative)
					return;

				Event.cancel(e);
				
				if (tinymce.isMac) {
					t.showContextMenu = true;
				} else {
					show(ed, e);
				}
			});

			ed.onRemove.add(function() {
				if (t._menu) {
					t._menu.removeAll();
				}
			});
			
			function show(ed, e) {
				// Select the image if it's clicked. WebKit would other wise expand the selection
				if (e.target.nodeName == 'IMG') ed.selection.select(e.target);
				
				var x = e.clientX || e.pageX;
				var y = e.clientY || e.pageY;
				
				var editorPos = ed.$(ed.contentAreaContainer).offset();
				t.curPos = ed.contextMenuPos = {x: x + editorPos.left, y: y + editorPos.top};

				ed.currentBookmark = ed.selection.getBookmark(1);
				
				t._getMenu(ed).showMenu(x, y);
//				Event.add(ed.getDoc(), 'click', hideMenu);

				ed.nodeChanged();
			};

			function hide(ed, e) {
				realCtrlKey = 0;

				// Since the contextmenu event moves
				// the selection we need to store it away
				if (e && e.button == 2) {
					realCtrlKey = e.ctrlKey;
//					return; // don't return: if the user right clicks somewhere else, we want this menu to close
				}
				
				if (t._menu) {
					t._menu.removeAll();
					t._menu.destroy();
//					Event.remove(ed.getDoc(), 'click', hideMenu);
					t._menu = null;
				}
			};
			ed.addCommand('hideContextMenu', function(ed, e) {
				hideMenu(e);
			});

			ed.onMouseUp.add(function(ed, e) {
				if (tinymce.isMac && t.showContextMenu) {
					t.showContextMenu = false;
					t.hideDebug = true;
					show(ed, e);
				}
			});
			ed.onMouseDown.add(hide);
			ed.onKeyDown.add(hide);
			ed.onKeyDown.add(function(ed, e) {
				if (e.shiftKey && !e.ctrlKey && !e.altKey && e.keyCode === 121) {
					Event.cancel(e);
					showMenu(ed, e);
				}
			});
		},

		_getMenu : function(ed) {
			var t = this, m = t._menu, se = ed.selection, col = se.isCollapsed(), el = se.getNode() || ed.getBody(), am, p1, p2;

			if (m) {
				m.removeAll();
				m.destroy();
			}

			p1 = DOM.getPos(ed.getContentAreaContainer());
			p2 = DOM.getPos(ed.getContainer());
			
			m = ed.controlManager.createDropMenu('contextmenu', {
				offset_x : p1.x + ed.getParam('contextmenu_offset_x', 0),
				offset_y : p1.y + ed.getParam('contextmenu_offset_y', 0),
				constrain : 1,
				keyboard_focus: true
			}, tinymce.ui.ScrollingDropMenu);
			
			t._menu = m;

			var url = t.url+'/../../img/';
			m.add({
				title: 'Tag Person',
				icon_src: url+'user.png',
				onclick : function() {
					ed.execCommand('addEntity', 'person');
				}
			}).setDisabled(col);
			m.add({
				title: 'Tag Place',
				icon_src: url+'world.png',
				onclick : function() {
					ed.execCommand('addEntity', 'place');
				}
			}).setDisabled(col);
			m.add({
				title: 'Tag Date',
				icon_src: url+'calendar.png',
				onclick : function() {
					ed.execCommand('addEntity', 'date');
				}
			}).setDisabled(col);
//			m.add({
//				title: 'Tag Event',
//				icon_src: url+'cake.png',
//				onclick : function() {
//					ed.execCommand('addEntity', 'event');
//				}
//			}).setDisabled(col);
			m.add({
				title: 'Tag Organization',
				icon_src: url+'group.png',
				onclick : function() {
					ed.execCommand('addEntity', 'org');
				}
			}).setDisabled(col);
			m.add({
				title: 'Tag Citation',
				icon_src: url+'vcard.png',
				onclick : function() {
					ed.execCommand('addEntity', 'citation');
				}
			}).setDisabled(col);
			m.add({
				title: 'Tag Note',
				icon_src: url+'note.png',
				onclick : function() {
					ed.execCommand('addEntity', 'note');
				}
			}).setDisabled(col);
			m.add({
				title: 'Tag Text/Title',
				icon_src: url+'book.png',
				onclick : function() {
					ed.execCommand('addEntity', 'textTitle', t.curPos);
				}
			}).setDisabled(col);
			
			m.addSeparator();
			var tagMenu = m.addMenu({
				id: 'structTagsContextMenu',
				title: 'Structural Tags',
				icon_src: url+'tag.png',
				menuType: 'filterMenu'
			});
			tagMenu.beforeShowMenu.add(function(m) {
				m.element.addClass('defaultSkin');
				m.element.addClass('mceDropDown');
			});
			ed.execCommand('createSchemaTagsControl', {menu: tagMenu, disabled: col, pos: t.curPos});
			m.addSeparator();
			
			col = (ed.currentEntity == null && ed.currentStruct == null);
			
			var changeTagMenu = m.addMenu({
				id: 'changeTagContextMenu',
				title: 'Change Tag',
				icon_src: url+'tag_blue_edit.png',
				menuType: 'filterMenu'
			});
			changeTagMenu.beforeShowMenu.add(function(m) {
				m.element.addClass('defaultSkin');
				m.element.addClass('mceDropDown');
			});
			ed.execCommand('createSchemaTagsControl', {menu: changeTagMenu, disabled: col, pos: t.curPos, mode: 'change'});
			
			m.add({
				title: 'Edit Tag',
				icon_src: url+'tag_blue_edit.png',
				onclick : function() {
					ed.execCommand('editTag', null, t.curPos);
				}
			}).setDisabled(col);
			m.add({
				title: 'Remove Tag',
				icon_src: url+'tag_blue_delete.png',
				onclick : function() {
					ed.execCommand('removeTag');
				}
			}).setDisabled(col);
			m.addSeparator();
			col = ed.currentEntity == null;
			m.add({
				title: 'Copy Entity',
				icon_src: url+'tag_blue_copy.png',
				onclick : function() {
					ed.execCommand('copyEntity', null, t.curPos);
				}
			}).setDisabled(col);
			col = ed.entityCopy == null;
			m.add({
				title: 'Paste Entity',
				icon_src: url+'tag_blue_paste.png',
				onclick : function() {
					ed.execCommand('pasteEntity', null, t.curPos);
				}
			}).setDisabled(col);

			t.onContextMenu.dispatch(t, m, el, col);

			return m;
		}
	});

	// Register plugin
	tinymce.PluginManager.add('entitycontextmenu', tinymce.plugins.EntityContextMenu);
})();
