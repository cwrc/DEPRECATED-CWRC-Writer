(function(tinymce) {
// make sure snippet is available
var $ = require('jquery');
var watermark = require('jquery.watermark');
    
tinymce.PluginManager.add('schematags', function(editor) {
    
    // re-implementing tinymce.ui.Menu so that we can set autohide to false
    tinymce.ui.CWRCMenu = tinymce.ui.FloatPanel.extend({
        Defaults: {
            defaultType: 'menuitem',
            border: 1,
            layout: 'stack',
            role: 'application',
            bodyRole: 'menu',
            ariaRoot: true
        },

        init: function(settings) {
            var self = this;

            settings.autohide = false; // don't autohide
            settings.constrainToViewport = true;

            if (settings.itemDefaults) {
                var items = settings.items, i = items.length;

                while (i--) {
                    items[i] = Tools.extend({}, settings.itemDefaults, items[i]);
                }
            }

            self._super(settings);
            self.classes.add('menu');
        },

        repaint: function() {
            this.classes.toggle('menu-align', true);

            this._super();

            this.getEl().style.height = '';
            this.getEl('body').style.height = '';

            return this;
        },

        cancel: function() {
            var self = this;

            self.hideAll();
            self.fire('select');
        },

        hideAll: function() {
            var self = this;

            this.find('menuitem').exec('hideMenu');

            return self._super();
        },

        preRender: function() {
            var self = this;

            self.items().each(function(ctrl) {
                var settings = ctrl.settings;

                if (settings.icon || settings.image || settings.selectable) {
                    self._hasIcons = true;
                    return false;
                }
            });

            return self._super();
        }
    });
    
    tinymce.ui.CWRCPanelButton = tinymce.ui.PanelButton.extend({
        // set popover to false
        showPanel: function() {
            var self = this, settings = self.settings;

            self.active(true);

            if (!self.panel) {
                var panelSettings = settings.panel;

                // Wrap panel in grid layout if type if specified
                // This makes it possible to add forms or other containers directly in the panel option
                if (panelSettings.type) {
                    panelSettings = {
                        layout: 'grid',
                        items: panelSettings
                    };
                }

                panelSettings.role = panelSettings.role || 'dialog';
                panelSettings.popover = false;
                panelSettings.autohide = true;
                panelSettings.ariaRoot = true;

                self.panel = new tinymce.ui.FloatPanel(panelSettings).on('hide', function() {
                    self.active(false);
                }).on('cancel', function(e) {
                    e.stopPropagation();
                    self.focus();
                    self.hidePanel();
                }).parent(self).renderTo(self.getContainerElm());

                self.panel.fire('show');
                self.panel.reflow();
            } else {
                self.panel.show();
            }

            self.panel.moveRel(self.getEl(), settings.popoverAlign || (self.isRtl() ? ['bc-tr', 'bc-tc'] : ['bc-tl', 'bc-tc']));
        },
        // implement hideMenu for when used as menuitem
        hideMenu: function() {
            var self = this;
            self.hidePanel();
        }
    });
    
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
                image: imageUrl+'tag_blue.png',
                onclick: function(e) {
                    var tag = this.settings.key;
                    editor.writer.dialogManager.schemaTags.addSchemaTag({key: tag});
                }
            });
        }
        menuItems.push({
            type: 'menuitem',
            text: 'No tags available for current parent tag.',
            disabled: true,
            hidden: true,
            image: imageUrl+'cross.png',
            onclick : function() {}
        });
    }
    editor.addCommand('getTagsMenu', getTagsMenu);
    
    /**
     * Hide menu items based on their validity, according to the schema.
     * @param menu {tinymce.ui.Menu} The menu to filter.
     */
    function filterMenu(menu) {
        var node, filterKey;
        // get the node from currentBookmark if available, otherwise use currentNode
        if (editor.currentBookmark != null) {
            node = editor.currentBookmark.rng.commonAncestorContainer;
            while (node.nodeType === 3) {
                node = node.parentNode;
            }
        } else {
            node = editor.currentNode;
        }
        if (node.nodeType === 9) {
            node = $('body > [_tag]', node)[0]; // we're at the document level so select the root instead
        }
        
        filterKey = node.getAttribute('_tag');
        
        if (filterKey == null) {
            // probably in an entity
            var id = node.getAttribute('id');
            if (id === 'entityHighlight') {
                var w = editor.writer;
                id = w.entitiesManager.getCurrentEntity();
                filterKey = w.entitiesManager.getEntity(id).getTag();
            } else {
                if (window.console) {
                    console.warn('In unknown tag', node);
                }
            }
        }
        
        var validKeys = [];
        if (filterKey != editor.writer.header) {
            validKeys = editor.writer.utilities.getChildrenForTag({tag: filterKey, returnType: 'names'});
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
//        console.log(node, disCount);
        if (count == disCount) {
            var len = menu.items().length;
            menu.items()[len-1].disabled(false);
            menu.items()[len-1].visible(true);
//            menu.items['no_tags_'+m.id].disabled(false);
        }
        
        menu.parent().reflow();
    }
    
    function resizeMenuParent(menu) {
        var parent = menu.parent();
        var height = 0;
        parent.items().each(function(e) {
            height += $(e.getEl()).height();
        });
        height = Math.min(height, 400);
        parent.layoutRect({h: height, minH: height});
        parent.repaint();
    }
    
    function getFilterMenu(configObj) {
        $.extend(configObj, {
            layout: 'stack',
            classes: 'cwrc',
            onshow: function(e) {
                if (e.control.type != 'menuitem') {
                    var textbox = e.control.items()[0];
                    textbox.value('');
                    var menu = e.control.items()[1];
                    if (menu.type === 'cwrcmenu') {
                        filterMenu(menu);
                        menu.show();
                        resizeMenuParent(menu);
                        menu.getEl().scrollTop = 0;
                    }
                    
                }
            },
            onPostRender: function(e) {
                var textbox = e.control.items()[0];
                $(textbox.getEl()).watermark('Filter');
                var menu = e.control.items()[1];
                var items = [];
                editor.execCommand('getTagsMenu', items);
                menu.append(items);
                menu.reflow();
                
                editor.writer.event('schemaLoaded').subscribe(function() {
                    var oldItems = menu.items().toArray();
                    for (var i = 0; i < oldItems.length; i++) {
                        var item = oldItems[i];
                        if (item !== undefined) {
                            item.remove();
                        }
                    }
                    var items = [];
                    editor.execCommand('getTagsMenu', items);
                    menu.append(items);
                    menu.reflow();
                });
            },
            items: [{
                type: 'textbox',
                onkeyup: function(e) {
                    var query = e.control.value();
                    var menu = e.control.parent().items()[1];
                    menu.items().each(function(item) {
                        if (query == '') {
                            item.disabled(item.settings.initialFilterState);
                            item.visible(!item.settings.initialFilterState);
                        } else if (!item.settings.initialFilterState && item.settings.key && item.settings.key.toLowerCase().indexOf(query) != -1) {
                            item.disabled(false);
                            item.visible(true);
                        } else {
                            item.disabled(true);
                            item.visible(false);
                        }
                    });
                    resizeMenuParent(menu);
                }
            },{
                type: 'cwrcmenu',
                style: 'position: relative !important;',
                items: []
            }]
        });
    }
    editor.addCommand('getFilterMenu', getFilterMenu);
    
    var filterPanel = {}
    getFilterMenu(filterPanel);
    editor.addButton('schematags', {
        type: 'cwrcpanelbutton',
        text: 'Tags',
        popoverAlign: ['bl-tl', 'bl-tc'],
        panel: filterPanel
    });
});

})(tinymce);