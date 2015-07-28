tinymce.PluginManager.add('schematags', function(editor) {
    
    tinymce.ui.CWRCMenuButton = tinymce.ui.MenuButton.extend({

        /**
         * Shows the menu for the button.
         *
         * @method showMenu
         */
        showMenu: function() {
            var self = this, menu;

            if (self.menu && self.menu.visible()) {
                return self.hideMenu();
            }

            if (!self.menu) {
                self.fire('beforecreatemenu');
                
                menu = self.state.get('menu') || [];

                // Is menu array then auto constuct menu control
                if (menu.length) {
                    menu = {
                        type: 'menu',//'cwrcfiltermenu',
                        items: menu
                    };
                } else {
                    menu.type = menu.type || 'menu';
                }

                if (!menu.renderTo) {
                    self.menu = tinymce.ui.Factory.create(menu).parent(self).renderTo();
                } else {
                    self.menu = menu.parent(self).show().renderTo();
                }

                self.fire('createmenu');
                self.menu.reflow();
                self.menu.on('cancel', function(e) {
                    if (e.control.parent() === self.menu) {
                        e.stopPropagation();
                        self.focus();
                        self.hideMenu();
                    }
                });

                // Move focus to button when a menu item is selected/clicked
                self.menu.on('select', function() {
                    self.focus();
                });

                self.menu.on('show hide', function(e) {
                    if (e.control == self.menu) {
                        self.activeMenu(e.type == 'show');
                    }

                    self.aria('expanded', e.type == 'show');
                }).fire('show');
            }

            self.menu.show();
            self.menu.layoutRect({w: self.layoutRect().w});
            self.menu.moveRel(self.getEl(), self.isRtl() ? ['br-tr', 'tr-br'] : ['bl-tl', 'tl-bl']);
        },

        /**
         * Gets invoked after the control has been rendered.
         *
         * @method postRender
         */
        postRender: function() {
            var self = this;

            // self.on('click', function(e) {
                // if (e.control === self && isChildOf(e.target, self.getEl())) {
                    // self.showMenu();

                    // if (e.aria) {
                        // self.menu.items()[0].focus();
                    // }
                // }
            // });

            self.on('mouseenter', function(e) {
                var overCtrl = e.control, parent = self.parent(), hasVisibleSiblingMenu;

                if (overCtrl && parent && overCtrl instanceof tinymce.ui.CWRCMenuButton && overCtrl.parent() == parent) {
                    parent.items().filter('CWRCMenuButton').each(function(ctrl) {
                        if (ctrl.hideMenu && ctrl != overCtrl) {
                            if (ctrl.menu && ctrl.menu.visible()) {
                                hasVisibleSiblingMenu = true;
                            }

                            ctrl.hideMenu();
                        }
                    });

                    if (hasVisibleSiblingMenu) {
                        overCtrl.focus(); // Fix for: #5887
                        overCtrl.showMenu();
                    }
                }
            });

            return self._super();
        }
    });
    
    
    
    
    
    
    var isMenuInitialized = false;
    
    /**
     * Gets the menu items for all tags in the schema.
     * @param menuItems {Array} The array to fill with tags.
     */
    function getTagsMenu(menuItems) {
        var imageUrl = editor.writer.cwrcRootUrl+'img/';
        var schema = editor.writer.schemaManager.schema;
        for (var i = 0; i < schema.elements.length; i++) {
            var key = schema.elements[i];
            menuItems.push({
                type: 'menuitem',
                text: key,
                key: key,
                initialFilterState: null,
                icon: imageUrl+'tag_blue.png',
                onclick: function(e) {
                    var tag = this.settings.key;
                    console.log(tag);
                    editor.writer.dialogManager.schemaTags.addSchemaTag({key: this.key});
                }
            });
        }
        menuItems.push({
            type: 'menuitem',
            text: 'No tags available for current parent tag.',
            category: 'noTags',
            disabled: true,
            hidden: true,
            icon: imageUrl+'cross.png',
            onclick : function() {}
        });
        
        
//        for (var key in menu.items) {
//            var item = menu.items[key];
//            item.destroy();
//            $('#'+item.id).remove();
//            delete menu.items[key];
//        }
    }
    
    /**
     * Hide menu items based on their validity, according to the schema.
     * @param menu {tinymce.ui.Menu} The menu to filter.
     * @param tag {String} The name of the tag with which to filter.
     */
    function filterMenu(menu, tag) {
        var validKeys = [];
        if (tag != editor.writer.header) {
            validKeys = editor.writer.utilities.getChildrenForTag({tag: tag, returnType: 'names'});
        }
        var count = 0, disCount = 0;
        menu.items().each(function(item) {
            count++;
            if (validKeys.indexOf(item.settings.key) != -1) {
                item.settings.initialFilterState = false;
                item.disabled(false);
                item.visible(true);
            } else {
                item.settings.initialFilterState = true;
                item.disabled(true);
                item.visible(false);
                disCount++;
            }
        });
        console.log(tag, disCount);
        if (count == disCount) {
            var len = menu.items().length;
            menu.items()[len-1].disabled(false);
            menu.items()[len-1].visible(true);
//            menu.items['no_tags_'+m.id].disabled(false);
        }
    }
    
    editor.addCommand('getTagsMenu', getTagsMenu);
    
//    editor.addButton('schematags', {
//        type: 'cwrcmenubutton',
//        text: 'XML Tags',
//        icon: false,
//        onbeforeshowmenu: function() {
//            var tag = editor.currentNode.getAttribute('_tag');
//            filterMenu(this.menu, tag);
//        },
//        onbeforecreatemenu: function() {
//            this.menu = null;
//            var menuItems = [];
//            editor.execCommand('getTagsMenu', menuItems);
//            this.settings.menu = menuItems;
//        },
//        onclick: function(e) {
//        },
//        menu: []
//    });
//    
    
    
    editor.addButton('schematags', {
        type: 'cwrcmenubutton',
        text: 'XML Tags',
        menu: [],
        onbeforeshowmenu: function() {
            var tag = editor.currentNode.getAttribute('_tag');
            filterMenu(this.menu, tag);
        },
        onbeforecreatemenu: function(e) {
            this.menu = null;
            var menuItems = [];
            editor.execCommand('getTagsMenu', menuItems);
            this.state.set('menu', menuItems);
        }
    });
    
    editor.addButton('schematags_panel', {
        type: 'panelbutton',
        text: 'XML Tags',
        panel: {
            layout: 'flex',
            direction: 'column',
            align: 'stretch',
            onshow: function(e) {
                var menu = e.control.items()[1];
                console.log(menu);
                menu.show();
            },
            onPostRender: function(e) {
                if (!isMenuInitialized) {
                    isMenuInitialized = true;
                    var menuItems = [];
                    editor.execCommand('getTagsMenu', menuItems);
                    var placeHolder = e.control.items()[1];
//                    placeHolder.add(menuItems);
//                    var menu = e.control.add({
//                        type: 'menu',
//                        items: menuItems
//                    });
//                    menu.renderTo(e.control.getContainerElm());
//                    menu.reflow();
                }
            },
            items : [{
                type: 'textbox'
            },{
                type: 'menu',
                items: [{
                    type: 'menuitem',
                    text: 'No tags available for current parent tag.',
                    category: 'noTags',
//                    disabled: true,
//                    hidden: true,
                    icon: 'cross.png',
                    onclick : function() {}
                }]
            }]
        }
    });
});