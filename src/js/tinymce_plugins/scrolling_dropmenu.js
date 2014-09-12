(function(tinymce) {
	var DOM = tinymce.DOM, Event = tinymce.dom.Event;
	var $ = require('jquery');
	tinymce.create('tinymce.ui.ScrollingMenuButton:tinymce.ui.MenuButton', {
		ScrollingMenuButton : function(id, s, ed) {
			this.parent(id, s, ed);

			this.beforeShowMenu = new tinymce.util.Dispatcher(this);
			this.onRenderMenu = new tinymce.util.Dispatcher(this);

			s.menu_container = s.menu_container || DOM.doc.body;
		},

		showMenu : function() {
			var t = this, p2, e = DOM.get(t.id), m;

			if (t.isDisabled())
				return;

			t.beforeShowMenu.dispatch(t);
			
			if (!t.isMenuRendered) {
				t.renderMenu();
				t.isMenuRendered = true;
			}

			if (t.isMenuVisible)
				return t.hideMenu();

			p1 = DOM.getPos(t.settings.menu_container);
			p2 = DOM.getPos(e);

			m = t.menu;
			m.settings.offset_x = p2.x;
			m.settings.offset_y = p2.y;
			m.settings.vp_offset_x = p2.x;
			m.settings.vp_offset_y = p2.y;
			m.settings.keyboard_focus = t._focused;
			m.showMenu(0, e.clientHeight);

			Event.add(DOM.doc, 'mousedown', t.hideMenu, t);
			t.setState('Selected', 1);

			t.isMenuVisible = 1;
		},
		
		renderMenu : function() {
			var t = this, m;

			m = t.settings.control_manager.createDropMenu(t.id + '_menu', {
				menu_line : 1,
				'class' : this.classPrefix + 'Menu',
				icons : t.settings.icons,
				menuType : t.settings.menuType
			}, tinymce.ui.ScrollingDropMenu);

			m.onHideMenu.add(function() {
				t.hideMenu();
				t.focus();
			});

			t.onRenderMenu.dispatch(t, m);
			t.menu = m;
		}
	});
})(tinymce);

(function(tinymce) {
	var is = tinymce.is, DOM = tinymce.DOM, each = tinymce.each, Event = tinymce.dom.Event, Element = tinymce.dom.Element;
	var $ = require('jquery');
	tinymce.create('tinymce.ui.ScrollingDropMenu:tinymce.ui.DropMenu', {
		ScrollingDropMenu : function(id, s) {
			s = s || {};
			s.container = s.container || DOM.doc.body;
			s.offset_x = s.offset_x || 0;
			s.offset_y = s.offset_y || 0;
			s.vp_offset_x = s.vp_offset_x || 0;
			s.vp_offset_y = s.vp_offset_y || 0;

			if (is(s.icons) && !s.icons)
				s['class'] += ' mceNoIcons';

			this.parent(id, s);
			this.beforeShowMenu = new tinymce.util.Dispatcher(this);
			this.onShowMenu = new tinymce.util.Dispatcher(this);
			this.onHideMenu = new tinymce.util.Dispatcher(this);
			this.classPrefix = 'mceMenu';
			
			this.scrollbarSize = this.getScrollbarSize();
		},

		getScrollbarSize : function() {
			document.body.style.overflow = 'hidden';
			var width = document.body.clientWidth;
			
			document.body.style.overflow = 'scroll';
			width -= document.body.clientWidth;
			
			if(!width) width = document.body.offsetWidth-document.body.clientWidth;
			
			document.body.style.overflow = '';
			
			return width;
		},
		
		update : function() {
			var t = this, s = t.settings, tb = DOM.get('menu_' + t.id + '_tbl'), co = DOM.get('menu_' + t.id + '_co'), tw, th;

			var max_height = tinyMCE.activeEditor.getContentAreaContainer().offsetHeight - 50;
			
			tw = s.max_width ? Math.min(tb.clientWidth, s.max_width) : tb.clientWidth;
			th = max_height ? Math.min(tb.clientHeight, max_height) : tb.clientHeight;

			var doScroll = tb.clientHeight > max_height;
			if (doScroll) {
				tw += t.scrollbarSize;
			}
			
			if (!DOM.boxModel) {
				t.element.setStyles({width : tw + 2, height : th + 2});
				DOM.setStyle(co, 'height', th + 2);
			} else {
				t.element.setStyles({width : tw, height : th});
				DOM.setStyle(co, 'height', th);
			}

			if (s.max_width)
				DOM.setStyle(co, 'width', tw);

			if (doScroll) {
				DOM.setStyle(co, 'overflow', 'auto');
				DOM.setStyle(co, 'width', tw);
				DOM.setStyle(tb, 'width', tw - t.scrollbarSize);
			} else {
				DOM.setStyle(co, 'overflow', 'hidden');
				DOM.setStyle(co, 'width', tw);
				DOM.setStyle(tb, 'width', tw);
			}
			$(co).scrollTop(0);
		},

		showMenu : function(x, y, px) {
			var t = this, s = t.settings, co, vp = DOM.getViewPort(), w, h, mx, my, ot = 2, dm, cp = t.classPrefix;

			t.collapse(1);

			if (t.isMenuVisible)
				return;

			if (!t.rendered) {
				co = DOM.add(t.settings.container, t.renderNode());

				each(t.items, function(o) {
					o.postRender();
				});

				t.element = new Element('menu_' + t.id, {blocker : 1, container : s.container});
			} else
				co = DOM.get('menu_' + t.id);

			// Move layer out of sight unless it's Opera since it scrolls to top of page due to an bug
			if (!tinymce.isOpera)
				DOM.setStyles(co, {left : -0xFFFF , top : -0xFFFF});

			t.beforeShowMenu.dispatch(t);
			
			DOM.show(co);
			t.update();

			if (s.menuType && s.menuType == 'filterMenu') {
				t.textInput.value = '';
			}
			
			x += s.offset_x || 0;
			y += s.offset_y || 0;
			vp.w -= 4;
			vp.h -= 4;

			// Move inside viewport if not submenu
			if (s.constrain) {
				var size = DOM.getSize(co);
				w = size.w - ot;
				h = size.h - ot;
				mx = vp.x + vp.w;
				my = vp.y + vp.h;

				if ((x + s.vp_offset_x + w) > mx)
					x = px ? px - w : Math.max(0, (mx - s.vp_offset_x) - w);

				if ((y + s.vp_offset_y + h) > my)
					y = Math.max(0, (my - s.vp_offset_y) - h);
			}

			DOM.setStyles(co, {left : x , top : y});
			t.element.update();

			t.isMenuVisible = 1;
			t.mouseClickFunc = Event.add(co, 'click', function(e) {
				var m;

				e = e.target;

				if (e && (e = DOM.getParent(e, 'tr')) && !DOM.hasClass(e, cp + 'ItemSub')) {
					m = t.items[e.id];

					if (m.isDisabled())
						return;

					dm = t;

					while (dm) {
						if (dm.hideMenu)
							dm.hideMenu();

						dm = dm.settings.parent;
					}

					if (m.settings.onclick)
						m.settings.onclick(e);

					return Event.cancel(e); // Cancel to fix onbeforeunload problem
				}
			});

			if (t.hasMenus()) {
				t.mouseOverFunc = Event.add(co, 'mouseover', function(e) {
					var m, r;

					e = e.target;
					if (e && (e = DOM.getParent(e, 'tr'))) {
						m = t.items[e.id];

						if (t.lastMenu)
							t.lastMenu.collapse(1);

						if (m.isDisabled())
							return;

						if (e && DOM.hasClass(e, cp + 'ItemSub')) {
							//p = DOM.getPos(s.container);
							r = DOM.getRect(e);
							m.showMenu((r.x + r.w - ot), r.y - ot, r.x);
							t.lastMenu = m;
							DOM.addClass(DOM.get(m.id).firstChild, cp + 'ItemActive');
						}
					}
				});
			}
			
			Event.add(co, 'keydown', t._keyHandler, t);

			t.onShowMenu.dispatch(t);

//			if (s.keyboard_focus) { 
				t._setupKeyboardNav(); 
//			}
			$(t.textInput).focus();
		},
		
		addMenu : function(o) {
			if (!o.collapse)
				o = this.createMenu(o);

			this.menuCount++;

			return this.add(o);
		},
		
		createMenu : function(s) {
			var t = this, cs = t.settings, m;

			s.container = s.container || cs.container;
			s.parent = t;
			s.constrain = s.constrain || cs.constrain;
			s['class'] = s['class'] || cs['class'];
			s.vp_offset_x = s.vp_offset_x || cs.vp_offset_x;
			s.vp_offset_y = s.vp_offset_y || cs.vp_offset_y;
			s.keyboard_focus = cs.keyboard_focus;
			m = new tinymce.ui.ScrollingDropMenu(s.id || DOM.uniqueId(), s);

			m.onAddItem.add(t.onAddItem.dispatch, t.onAddItem);

			return m;
		},
		
		renderNode : function() {
			var t = this, s = t.settings, n, tb, co, w;

			w = DOM.create('div', {role: 'listbox', id : 'menu_' + t.id, 'class' : s['class'], 'style' : 'position:absolute;left:0;top:0;z-index:200000;outline:0'});
			if (t.settings.parent) {
				DOM.setAttrib(w, 'aria-parent', 'menu_' + t.settings.parent.id);
			}
			
			var containerClass = '';
			if (s.menuType && s.menuType == 'filterMenu') {
				containerClass = 'scrollingMenuContainer ';
				
				// add input box
				var inputDiv = DOM.add(w, 'div', {id : 'menu_' + t.id + '_inputParent', 'class' : 'inputParent '+t.classPrefix + (s['class'] ? ' ' + s['class'] : '')}, '<span>Filter</span>');
				t.textInput = DOM.add(inputDiv, 'input', {id : 'menu_' + t.id + '_input', type: 'text', 'class' : t.classPrefix + (s['class'] ? ' ' + s['class'] : '')});
			
				Event.add(t.textInput, 'keyup', t.filterMenuItems, t);
			}
			
			co = DOM.add(w, 'div', {role: 'presentation', id : 'menu_' + t.id + '_co', 'class' : containerClass + t.classPrefix + (s['class'] ? ' ' + s['class'] : '')});
			t.element = new Element('menu_' + t.id, {blocker : 1, container : s.container});

			if (s.menu_line)
				DOM.add(co, 'span', {'class' : t.classPrefix + 'Line'});

//			n = DOM.add(co, 'div', {id : 'menu_' + t.id + '_co', 'class' : 'mceMenuContainer'});
			n = DOM.add(co, 'table', {role: 'presentation', id : 'menu_' + t.id + '_tbl', border : 0, cellPadding : 0, cellSpacing : 0});
			tb = DOM.add(n, 'tbody');

			each(t.items, function(o) {
				t._add(tb, o);
			});

			t.rendered = true;

			return w;
		},
		
		_setupKeyboardNav : function(){
			var contextMenu, menuItems, t=this; 
			contextMenu = DOM.get('menu_' + t.id);
			menuItems = DOM.select('a[role=option]', 'menu_' + t.id);
			menuItems.splice(0,0,contextMenu);
			t.keyboardNav = new tinymce.ui.FilterMenuKeyboardNav({
				root: 'menu_' + t.id,
				items: menuItems,
				onCancel: function() {
					t.hideMenu();
				},
				onAction: function(id) {
					id = id.replace('_aria', '');
					var item = t.items[id];
					if (item) {
						var dm = t;
						while (dm) {
							if (dm.hideMenu) dm.hideMenu();
							dm = dm.settings.parent;
						}
						item.settings.onclick.call(item.settings);
					}
				},
				// when the user pushes up at the top of the menu
				onMenuTop: function() {
					t.textInput.focus();
				},
				enableUpDown: true
			});
//			contextMenu.focus();
		},
		
		filterMenuItems: function(e) {
			if (e.which == 40) { // down key
				this.keyboardNav.resetFocus();
			} else {
				var query = $(this.textInput).val().toLowerCase();
				var item;
				for (var itemId in this.items) {
					item = this.items[itemId];
					if (query == '') {
						item.setDisabled(item.settings.initialFilterState);
					} else if (!item.settings.initialFilterState && item.settings.key.toLowerCase().indexOf(query) != -1) {
						item.setDisabled(false);
					} else {
						item.setDisabled(true);
					}
				}
				this.update();
			}
		}
	});
})(tinymce);

(function(tinymce) {
	var Event = tinymce.dom.Event, each = tinymce.each;
	var $ = require('jquery');
	tinymce.create('tinymce.ui.FilterMenuKeyboardNav:tinymce.ui.KeyboardNavigation', {
		FilterMenuKeyboardNav : function(settings, dom) {
			var t = this, root = settings.root, items = settings.items,
			enableUpDown = settings.enableUpDown, enableLeftRight = settings.enableLeftRight || !settings.enableUpDown,
			excludeFromTabOrder = settings.excludeFromTabOrder,
			itemFocussed, itemBlurred, rootKeydown, rootFocussed, focussedId;
			
			dom = dom || tinymce.DOM;
		
			itemFocussed = function(evt) {
				focussedId = evt.target.id;
			};
			
			itemBlurred = function(evt) {
				dom.setAttrib(evt.target.id, 'tabindex', '-1');
			};
			
			rootFocussed = function(evt) {
				var item = dom.get(focussedId);
				dom.setAttrib(item, 'tabindex', '0');
				item.focus();
			};
			
			t.focus = function() {
				dom.get(focussedId).focus();
			};
		
			t.destroy = function() {
				each(items, function(item) {
					var elm = dom.get(item.id);
		
					dom.unbind(elm, 'focus', itemFocussed);
					dom.unbind(elm, 'blur', itemBlurred);
				});
		
				var rootElm = dom.get(root);
				var tableElm = dom.select('#'+root+' table');
				dom.unbind(rootElm, 'focus', rootFocussed);
				dom.unbind(tableElm, 'keydown', rootKeydown);
		
				// FIXME destroying items here makes them unavailable in moveFocus, next time
				
//				items = dom = root = t.focus = itemFocussed = itemBlurred = rootKeydown = rootFocussed = null;
//				t.destroy = function() {};
			};
			
			t.resetFocus = function() {
				// find first enabled item
				for (var i = 0; i < items.length; i++) {
					var item = items[i];
					if ($(item).parents('tr').hasClass('mceMenuItemEnabled')) {
						focussedId = items[i].id;
						break;
					}
				}
				rootFocussed();
			};
			
			t.moveFocus = function(dir, evt) {
				var idx = -1, controls = t.controls, newFocus;
		
				if (!focussedId)
					return;
		
				each(items, function(item, index) {
					if (item.id === focussedId) {
						idx = index;
						return false;
					}
				});
				
				idx += dir;
				if (dir === 1) {
					idx = findNextItem(idx);
				} else {
					idx = findPreviousItem(idx);
				}
				
				if (idx == undefined) {
					if (dir === 1) {
						return;
					} else {
						if (settings.onMenuTop) {
							settings.onMenuTop();
							return;
						} else {
							idx = findNextItem(0);
						}
					}
					
				}
				
				newFocus = items[idx];
				
				doFocus(newFocus.id, focussedId);
		
				if (evt)
					Event.cancel(evt);
			};
			
			findPreviousItem = function(idx) {
				for (idx; idx >= 0; idx--) {
					var item = items[idx];
					if ($(item).parents('tr').hasClass('mceMenuItemEnabled')) {
						return idx;
					}
				}
			};
			
			findNextItem = function(idx) {
				for (idx; idx < items.length; idx++) {
					var item = items[idx];
					if ($(item).parents('tr').hasClass('mceMenuItemEnabled')) {
						return idx;
					}
				}
			};
			
			doFocus = function(newId, oldId) {
				dom.setAttrib(oldId, 'tabindex', '-1');
				dom.setAttrib(newId, 'tabindex', '0');
				dom.get(newId).focus();
			};
			
			rootKeydown = function(evt) {
				var DOM_VK_LEFT = 37, DOM_VK_RIGHT = 39, DOM_VK_UP = 38, DOM_VK_DOWN = 40, DOM_VK_ESCAPE = 27, DOM_VK_ENTER = 14, DOM_VK_RETURN = 13, DOM_VK_SPACE = 32;
				
				switch (evt.keyCode) {
					case DOM_VK_LEFT:
						if (enableLeftRight) t.moveFocus(-1);
						break;
		
					case DOM_VK_RIGHT:
						if (enableLeftRight) t.moveFocus(1);
						break;
		
					case DOM_VK_UP:
						if (enableUpDown) t.moveFocus(-1);
						break;
		
					case DOM_VK_DOWN:
						if (enableUpDown) t.moveFocus(1);
						break;
		
					case DOM_VK_ESCAPE:
						if (settings.onCancel) {
							settings.onCancel();
							Event.cancel(evt);
						}
						break;
		
					case DOM_VK_ENTER:
					case DOM_VK_RETURN:
					case DOM_VK_SPACE:
						if (settings.onAction) {
							settings.onAction(focussedId);
							Event.cancel(evt);
						}
						break;
				}
			};
		
			// Set up state and listeners for each item.
			each(items, function(item, idx) {
				var tabindex, elm;
		
				if (!item.id) {
					item.id = dom.uniqueId('_mce_item_');
				}
		
				elm = dom.get(item.id);
		
				if (excludeFromTabOrder) {
					dom.bind(elm, 'blur', itemBlurred);
					tabindex = '-1';
				} else {
					tabindex = (idx === 0 ? '0' : '-1');
				}
		
				elm.setAttribute('tabindex', tabindex);
				dom.bind(elm, 'focus', itemFocussed);
			});
			
			// Setup initial state for root element.
			if (items[0]){
				focussedId = items[0].id;
			}
		
			dom.setAttrib(root, 'tabindex', '-1');
		
			// Setup listeners for root element.
			var rootElm = dom.get(root);
			var tableElm = dom.select('#'+root+' table'); // use table instead of root so keydown not triggered on filter input
			dom.bind(rootElm, 'focus', rootFocussed);
			dom.bind(tableElm, 'keydown', rootKeydown);
		}
	});
})(tinymce);