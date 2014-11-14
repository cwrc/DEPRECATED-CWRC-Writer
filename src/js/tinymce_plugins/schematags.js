(function(tinymce) {
    var $ = require('jquery');
    tinymce.create('tinymce.plugins.SchemaTags', {
        init: function(ed, url) {
            var t = this;
            t.url = url;
            //TODO: this needs to be more configurable.
            t.imageUrl = ed.writer.cwrcRootUrl+'img/';
            t.editor = ed;
            
            t.editor.addCommand('createSchemaTagsControl', function(config) {
                var menu = config.menu;
                var mode = config.mode || 'add';
                var node;
                
                menu.beforeShowMenu.add(function(m) {
                    var parentContainer = $(m.element.getParent());
                    if (parentContainer.parent('.cwrc').length == 0) {
                        parentContainer.wrap('<div class="cwrc" />');
                    }
                    
                    var filterKey;
                    // get the node from currentBookmark if available, otherwise use currentNode
                    if (t.editor.currentBookmark != null) {
                        node = t.editor.currentBookmark.rng.commonAncestorContainer;
                        while (node.nodeType === 3) {
                            node = node.parentNode;
                        }
                    } else {
                        node = t.editor.currentNode;
                    }
                    if (node.nodeType === 9) {
                        node = $('body > [_tag]', node)[0]; // we're at the document level so select the root instead
                    }
                    
                    filterKey = node.getAttribute('_tag');
                    
                    if (filterKey == null) {
                        // probably in an entity
                        var id = node.getAttribute('id');
                        if (id === 'entityHighlight') {
                            var w = t.editor.writer;
                            id = w.entitiesManager.getCurrentEntity();
                            filterKey = w.entitiesManager.getEntity(id).getTag();
                        } else {
                            if (window.console) {
                                console.warn('In unknown tag', node);
                            }
                        }
                    }
                    
                    if (mode == 'change') {
                        filterKey = $(node).parent().attr('_tag');
                    }
                    
                    var validKeys = [];
                    if (filterKey != t.editor.writer.header) {
                        var path = t.editor.writer.utilities.getElementXPath(node);
                        validKeys = t.editor.writer.utilities.getChildrenForTag({tag: filterKey, path: path, returnType: 'names'});
                    }
                    var item;
                    var count = 0, disCount = 0;
                    for (var itemId in m.items) {
                        count++;
                        item = m.items[itemId];
                        if (validKeys.indexOf(item.settings.key) != -1) {
                            item.settings.initialFilterState = false;
                            item.setDisabled(false);
                        } else {
                            item.settings.initialFilterState = true;
                            item.setDisabled(true);
                            disCount++;
                        }
                    }
                    if (count == disCount) {
                        m.items['no_tags_'+m.id].setDisabled(false);
                    }
                });
                
//                menu.onHideMenu.add(function(m) {
//                });
                
                t.buildMenu(menu);
                
                return menu;
            });
        },
        
        buildMenu: function(menu) {
            var t = this;
            
            // remove old menu items
            for (var key in menu.items) {
                var item = menu.items[key];
                item.destroy();
                $('#'+item.id).remove();
                delete menu.items[key];
            }
            
            var schema = t.editor.execCommand('getSchema');
            for (var i = 0; i < schema.elements.length; i++) {
                var key = schema.elements[i];
                var menuitem = menu.add({
                    title: key,
                    key: key,
                    initialFilterState: null,
                    icon_src: t.imageUrl + 'tag_blue.png',
                    onclick : function() {
                        t.editor.writer.dialogManager.schemaTags.addSchemaTag({key: this.key});
                    }
                });
            }
            var menuitem = menu.add({
                title: 'No tags available for current parent tag.',
                id: 'no_tags_'+menu.id,
                icon_src: t.imageUrl + 'cross.png',
                onclick : function() {}
            });
            menuitem.setDisabled(true);
        },
        
        
        createControl: function(n, cm) {
            if (n == 'schematags') {
                var t = this;
                
                t.menuButton = cm.createMenuButton('schemaTagsButton', {
                    title: 'Tags',
                    image: t.imageUrl+'tag_text.png',
                    'class': 'wideButton',
                    menuType: 'filterMenu'
                }, tinymce.ui.ScrollingMenuButton);
                t.menuButton.beforeShowMenu.add(function(c) {
                    t.editor.currentBookmark = t.editor.selection.getBookmark(1);
                });
                t.menuButton.onRenderMenu.add(function(c, m) {
                    t.editor.execCommand('createSchemaTagsControl', {menu: m, disabled: false});
                    // link menu to the button
                    t.menuButton.menu = m;
                    
                    t.editor.writer.event('schemaLoaded').subscribe(function() {
                        t.buildMenu(m);
                    });
                });
                
                // link schemaTags to the button
                t.menuButton.parentControl = t;
                
                return t.menuButton;
            }
    
            return null;
        }
    });
    
    tinymce.PluginManager.add('schematags', tinymce.plugins.SchemaTags);
})(tinymce);