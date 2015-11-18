tinymce.PluginManager.add('cwrc_contextmenu', function(editor) {
    var menu, items, contextmenuNeverUseNative = editor.settings.contextmenu_never_use_native;
    
    editor.plugins.cwrc_contextmenu = {
            disabled: false,
            entityTagsOnly: false
    };
    
    editor.on('contextmenu', function(e) {

        // Block TinyMCE menu on ctrlKey
        if (e.ctrlKey && !contextmenuNeverUseNative) {
            return;
        }

        e.preventDefault();
        
        if (editor.plugins.cwrc_contextmenu.disabled === true) {
            return;
        }

        // render menu
        if (!menu) {
            // get the filtered tag menus and add them
            var filterPanel = {};
            editor.execCommand('getFilterMenu', filterPanel);
            items.splice(11, 0, {
                text: 'Structural Tags',
                category: 'xmlTags',
                type: 'cwrcpanelbutton',
                popoverAlign: ['tr-tl', 'br-bl'],
                panel: filterPanel,
                classes: 'cwrc',
                icon: 'cwrc',
                image: editor.writer.cwrcRootUrl+'img/tag.png',
                onPostRender: function(e) {
                    e.control.on('mouseover', function(e2) {
                        e2.control.parent().items().each(function(ctrl) {
                            if (ctrl !== e2.control) {
                                ctrl.hideMenu();
                            }
                        });
                        e2.control.showPanel(); 
                    });
                }
            },{
                text: '|'
            },{
                text: 'Change Tag',
                category: 'modifyTag',
                type: 'cwrcpanelbutton',
                popoverAlign: ['tr-tl', 'br-bl'],
                panel: filterPanel,
                classes: 'cwrc',
                icon: 'cwrc',
                image: editor.writer.cwrcRootUrl+'img/tag_blue_edit.png',
                onPostRender: function(e) {
                    e.control.on('mouseover', function(e2) {
                        e2.control.parent().items().each(function(ctrl) {
                            if (ctrl !== e2.control) {
                                ctrl.hideMenu();
                            }
                        });
                        e2.control.showPanel(); 
                    });
                }
            });
            
            menu = new tinymce.ui.Menu({
                style: 'max-height: none !important;',
                items: items,
                context: 'contextmenu'
            });
            
            // allow css to target this special menu
            // FIXME
//            menu.addClass('contextmenu');

            menu.renderTo(document.body);
            
            editor.on('remove', function() {
                menu.remove();
                menu = null;
            });
        }
        
        // enable/disable items based on current editor state
        var currentTag = editor.writer.tagger.getCurrentTag();
        
        if (tinymce.isMac) {
            // fix for when user right clicks on a tag that doesn't already have focus
            if (currentTag.struct != null) {
                if (currentTag.struct[0] != e.target) {
                    currentTag.struct = $(e.target);
                }
            } else if (currentTag.entity != null) {
                if (currentTag.entity[0] != e.target) {
                    currentTag.entity = $(e.target);
                }
            }
        }
        
        var isTagEntity = false;
        if (currentTag.struct != null) {
            var tagName = currentTag.struct.attr('_tag');
            if (tagName) {
                isTagEntity = editor.writer.utilities.isTagEntity(tagName);
            }
        }
        menu.items().each(function(item) {
            item.disabled(false);
            if (item.settings.category != 'tagEntity' && editor.plugins.cwrc_contextmenu.entityTagsOnly === true) {
                item.hide();
            } else {
                item.show();
            }
            if (item.settings.category == 'modifyTag' && currentTag.entity == null && currentTag.struct == null) {
                item.disabled(true);
            }
            if (item.settings.category == 'pasteTag' && editor.copiedElement.element == null) {
                item.disabled(true);
            }
            if (item.settings.category == 'convertEntity' && isTagEntity === false) {
                item.disabled(true);
            }
            if (item.settings.category == 'copyEntity' && currentTag.entity == null) {
                item.disabled(true);
            }
            if (item.settings.category == 'pasteEntity' && editor.entityCopy == null) {
                item.disabled(true);
            }
        });
        
        menu.show();

        // Position menu
        var pos = {x: e.pageX, y: e.pageY};

        if (!editor.inline) {
            pos = tinymce.DOM.getPos(editor.getContentAreaContainer());
            pos.x += e.clientX;
            pos.y += e.clientY;
        }

        menu.moveTo(pos.x, pos.y);
    });
    
    items = [{
        text: 'Tag Person',
        icon: 'icon', // need an icon entry for any of the images to show
        image: editor.writer.cwrcRootUrl+'img/user.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('person');
        }
    },{
        text: 'Tag Place',
        image: editor.writer.cwrcRootUrl+'img/world.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('place');
        }
    },{
        text: 'Tag Date',
        image: editor.writer.cwrcRootUrl+'img/calendar.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('date');
        }
    },{
        text: 'Tag Organization',
        image: editor.writer.cwrcRootUrl+'img/group.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('org');
        }
    },{
        text: 'Tag Citation',
        image: editor.writer.cwrcRootUrl+'img/vcard.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('citation');
        }
    },{
        text: 'Tag Note',
        image: editor.writer.cwrcRootUrl+'img/note.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('note');
        }
    },{
        text: 'Tag Text/Title',
        image: editor.writer.cwrcRootUrl+'img/book.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('title');
        }
    },{
        text: 'Tag Correction',
        image: editor.writer.cwrcRootUrl+'img/error.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('correction');
        }
    },{
        text: 'Tag Keyword',
        image: editor.writer.cwrcRootUrl+'img/key.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('keyword');
        }
    },{
        text: 'Tag Link',
        image: editor.writer.cwrcRootUrl+'img/link.png',
        category: 'tagEntity',
        onclick : function() {
            editor.writer.tagger.addEntity('link');
        }
    },{
        text: '|'
    },{
        text: 'Edit Tag',
        image: editor.writer.cwrcRootUrl+'img/tag_blue_edit.png',
        category: 'modifyTag',
        onclick : function() {
            editor.execCommand('editTag', null);
        }
    },{
        text: 'Remove Tag',
        image: editor.writer.cwrcRootUrl+'img/tag_blue_delete.png',
        category: 'modifyTag',
        onclick : function() {
            editor.execCommand('removeTag');
        }
    },{
        text: 'Copy Tag & Contents',
        image: editor.writer.cwrcRootUrl+'img/tag_blue_copy.png',
        category: 'modifyTag',
        onclick : function() {
            editor.execCommand('copyTag');
        }
    },{
        text: 'Paste Tag',
        image: editor.writer.cwrcRootUrl+'img/tag_blue_paste.png',
        category: 'pasteTag',
        onclick : function() {
            editor.execCommand('pasteTag');
        }
    },{
        text: '|'
    },{
        text: 'Convert to Entity',
        image: editor.writer.cwrcRootUrl+'img/tag_blue_edit.png',
        category: 'convertEntity',
        onclick : function() {
            var currentTag = editor.writer.tagger.getCurrentTag();
            editor.writer.tagger.convertTagToEntity(currentTag.struct);
        }
    },{
        text: 'Copy Entity',
        image: editor.writer.cwrcRootUrl+'img/tag_blue_copy.png',
        category: 'copyEntity',
        onclick : function() {
            editor.execCommand('copyEntity');
        }
    },{
        text: 'Paste Entity',
        image: editor.writer.cwrcRootUrl+'img/tag_blue_paste.png',
        category: 'pasteEntity',
        onclick : function() {
            editor.execCommand('pasteEntity');
        }
    }];
});