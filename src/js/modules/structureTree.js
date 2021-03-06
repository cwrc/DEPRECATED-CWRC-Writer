define(['jquery', 'jquery-ui', 'jquery.jstree'], function($, jqueryUi, jsTree) {

// overwrite show submenu, add our custom filter input
$.vakata.context._show_submenu = function (o) {
    o = $(o);
    o.parent().find('.filterParent').hide();
    if(!o.length || !o.children("ul").length) { return; }
    var e = o.children("ul"),
        x = o.offset().left + o.outerWidth(),
        y = o.offset().top,
        w = e.width(),
        h = e.height(),
        dw = $(window).width() + $(window).scrollLeft(),
        dh = $(window).height() + $(window).scrollTop();
    o[x + w + 10 > dw ? "addClass" : "removeClass"]("vakata-context-right");
    if(y + h + 10 > dh) {
        e.css("bottom","-1px");
    }
    var filterParent = o.find('.filterParent');
    if (filterParent.length === 0) {
        filterParent = $('<div class="filterParent"><span>Filter</span> <input type="text"/></div>').insertBefore(e);
        filterParent.find('input').on('keydown', function(e) {
            e.stopPropagation(); // stop context menu from cancelling event
        }).on('keyup', function(e) {
            if (e.which == 40) {
                // down arrow
                // TODO not working yet
                $(this).blur();
                var menu = $(this).parent().next('ul');
                var li = menu.find('li.vakata-context-hover').removeClass('vakata-context-hover').end().find('li:first');
                li.addClass('vakata-context-hover').focus();
            } else {
                var query = $(this).val().toLowerCase();
                $(this).parent().next('ul').children('li').each(function(index, el) {
                    if (query == '' || $(el).find('span:last').text().toLowerCase().indexOf(query) != -1) {
                        $(el).show();
                    } else {
                        $(el).hide();
                    }
                });
                // call in order to re-position filter 
                $.vakata.context._show_submenu(o);
            }
        });
    }
    e.show();
    filterParent.show().offset({
        left: e.offset().left,
        top: (e.offset().top-22)
    }).width(e.outerWidth()-2);
};
$(document).on('context_hide.vakata', function(e) {
    var filterParent = $('.filterParent', e.element);
    filterParent.hide();
});

// resize submenus to fit document height
$(document).on('context_show.vakata', function(e, data) {
    var menuBottom = data.element.outerHeight() + data.element.position().top;
    var maxHeight = Math.min(500, menuBottom - 50);
    var submenus = data.element.find('.submenu ul');
    submenus.css('max-height', maxHeight+'px');
});

/**
 * @class StructureTree
 * @fires Writer#structureTreeInitialized
 * @param {Object} config
 * @param {Writer} config.writer
 * @param {String} config.parentId
 */
return function(config) {
    var w = config.writer;
    
    var id = 'tree';
    
    /**
     * @lends StructureTree.prototype
     */
    var tree = {
        currentlySelectedNode: null, // id of the currently selected node
        currentlySelectedEntity: null, // id of the currently selected entity (as opposed to node, ie. struct tag)
        selectionType: null, // is the node or the just the contents of the node selected?
        NODE_SELECTED: 0,
        CONTENTS_SELECTED: 1,
        tagFilter: ['head','heading'] // array of tag names to filter tree by
    };
    
    // 2 uses, 1) we want to highlight a node in the tree without selecting it's counterpart in the editor
    // 2) a tree node has been clicked and we want to avoid re-running the selectNode function triggered by the editor's onNodeChange handler
    var ignoreSelect = false;
    // used in conjunction with ignoreSelect
    var nodeSelected = false;
    
    var $tree; // tree reference
    
    w.event('documentLoaded').subscribe(function() {
        tree.update();
    });
    w.event('schemaLoaded').subscribe(function() {
        tree.update();
    });
    w.event('nodeChanged').subscribe(function(currentNode) {
        tree.highlightNode(currentNode);
    });
    w.event('contentChanged').subscribe(function() {
        tree.update();
    });
    w.event('contentCopied').subscribe(function() {
        if (tree.currentlySelectedNode != null) {
            var clone = $('#'+tree.currentlySelectedNode, w.editor.getBody()).clone();
            w.editor.copiedElement.element = clone.wrapAll('<div />').parent()[0];
            w.editor.copiedElement.selectionType = tree.selectionType;
        }
    });
    w.event('contentPasted').subscribe(function() {
        tree.update();
    });
    w.event('writerKeydown').subscribe(function(evt) {
        if (tree.currentlySelectedNode != null) {
            // browsers have trouble deleting divs, so use the tree and jquery as a workaround
            if (evt.which == 8 || evt.which == 46) {
                    // cancel keyboard delete
                    tinymce.dom.Event.cancel(evt);
                    if (tree.selectionType == tree.NODE_SELECTED) {
                        w.tagger.removeStructureTag(tree.currentlySelectedNode, true);
                    } else {
                        var id = tree.currentlySelectedNode;
                        w.tagger.removeStructureTagContents(tree.currentlySelectedNode);
                        w.selectStructureTag(id, true);
                    }
            } else if (evt.ctrlKey == false && evt.metaKey == false && evt.which >= 48 && evt.which <= 90) {
                // handle alphanumeric characters when whole tree node is selected
                // remove the selected node and set the focus to the closest node
                if (tree.selectionType == tree.NODE_SELECTED) {
                    var currNode = $('#'+tree.currentlySelectedNode, w.editor.getBody());
                    var collapseToStart = true;
                    var newCurrentNode = currNode.nextAll('[_tag]')[0];
                    if (newCurrentNode == null) {
                        newCurrentNode = currNode.parent().nextAll('[_tag]')[0];
                        if (newCurrentNode == null) {
                            collapseToStart = false;
                            newCurrentNode = currNode.prevAll('[_tag]')[0];
                        }
                    }
                    w.tagger.removeStructureTag(tree.currentlySelectedNode, true);
                    if (newCurrentNode != null) {
                        var rng = w.editor.selection.getRng(true);
                        rng.selectNodeContents(newCurrentNode);
                        rng.collapse(collapseToStart);
                        w.editor.selection.setRng(rng);
                    }
                }
            }
        }
    });
    w.event('writerKeyup').subscribe(function(evt) {
        // if the user's typing we don't want the currentlySelectedNode to be set
        // calling highlightNode will clear currentlySelectedNode
        if (tree.currentlySelectedNode != null) {
            var currNode = $('#'+tree.currentlySelectedNode, w.editor.getBody())[0];
            tree.highlightNode(currNode);
        }
    });
    
    w.event('entityAdded').subscribe(function(entityId) {
        tree.update();
    });
    w.event('entityRemoved').subscribe(function(entityId) {
        tree.update();
    });
    w.event('entityFocused').subscribe(function(entityId) {
        tree.highlightNode($('#entityHighlight', w.editor.getBody())[0]);
    });
    w.event('entityPasted').subscribe(function(entityId) {
        tree.update();
    });
    w.event('tagAdded').subscribe(function(tag) {
        tree.update();
    });
    w.event('tagEdited').subscribe(function(tag) {
        tree.update();
    });
    w.event('tagRemoved').subscribe(function(tagId) {
        tree.update();
    });
    w.event('tagContentsRemoved').subscribe(function(tagId) {
        tree.update();
    });
    w.event('tagSelected').subscribe(function(tagId) {
        nodeSelected = false;
    });
    
    
    /**
     * Updates the tree to reflect the document structure.
     */
    tree.update = function() {
        var treeRef = $.jstree.reference('#'+id);
        // store open nodes to re-open after updating
        var openNodes = [];
        $('#cwrc_tree_root', $tree).find('li.jstree-open').each(function () {
            var id = $(this).attr('name');
            openNodes.push(id);
        });
        treeRef.delete_node('#cwrc_tree_root');
        var rootNode = $('[_tag="'+w.root+'"]', w.editor.getBody());
        if (rootNode.length === 0) {
            // fallback if schema/root has changed
            rootNode = $('[_tag]', w.editor.getBody()).first();
        }
        var rootData = _processNode(rootNode, 0);
        if (rootData != null) {
            rootData.li_attr.id = 'cwrc_tree_root';
            _doUpdate(rootNode.children(), rootData, 0, rootData);
            treeRef.create_node(null, rootData);
//            treeRef._themeroller();
            _onNodeLoad($('#cwrc_tree_root', $tree).first());
            
            $.each(openNodes, function (i, val) {
                treeRef.open_node($('li[name='+val+']', $tree), false, true); 
            });
        }
    };
    
    /**
     * Expands the parents of a particular node
     * @param {element} node A node that exists in the editor
     */
    function _expandParentsForNode(node) {
        // get the actual parent nodes in the editor
        var parents = [];
        $(node).parentsUntil('#tinymce').each(function(index, el) {
            parents.push(el.id);
        });
        parents.reverse();
        // expand the corresponding nodes in the tree
        for (var i = 0; i < parents.length; i++) {
            var parentId = parents[i];
            var parentNode = $('[name="'+parentId+'"]', $tree);
            var isOpen = $tree.jstree('is_open', parentNode);
            if (!isOpen) {
                $tree.jstree('open_node', parentNode, null, false);
            }
        }
    }
    
    /**
     * Displays (if collapsed) and highlights a node in the tree based on a node in the editor
     * @param {element} node A node that exists in the editor
     */
    tree.highlightNode = function(node) {
        if (node) {
            var id = node.id;
            if (id && !ignoreSelect && !nodeSelected) {
                ignoreSelect = true;
                if (id === 'entityHighlight') {
                    id = $(node).find('[_entity]').first().attr('name');
                }
                var treeNode = $('[name="'+id+'"]', $tree);
                if (treeNode.length === 0) {
                    _expandParentsForNode(node);
                    treeNode = $('[name="'+id+'"]', $tree);
                }
                $tree.jstree('deselect_all');
                _onNodeDeselect(); // manually trigger deselect behaviour, primarily to clear currentlySelectedNode
                var result = $tree.jstree('select_node', treeNode);
                //if (result === false || result.attr('id') == 'tree') {
                    ignoreSelect = false;
                //}

                _scrollIntoView(treeNode);
            }
        } else {
            _onNodeDeselect();
        }
    };
    
    function _scrollIntoView($node) {
        if ($node.length === 1) {
            var o = $node.offset().top - $tree.offset().top;
            var t = o + $tree.scrollTop();
            var b = t + $node.outerHeight();
            var ch = $tree.innerHeight();
            var ct = parseInt($tree.scrollTop(), 10);
            var cb = ct + ch;
            
            if ($node.outerHeight() > ch || t < ct) {
                $tree.scrollTop(t);
            } else if (b > cb) {
                $tree.scrollTop(b - ch);
            }
        }
    }
    
    /**
     * Selects a node in the tree based on a node in the editor
     * @param {element} node A node that exists in the editor
     * @param {integer} selectionType The type of selection to do, should match NODE_SELECTED or CONTENTS_SELECTED
     */
    tree.selectNode = function(node, selectionType) {
        if (node) {
            var id = node.id;
            if (id) {
                if (id == 'entityHighlight') {
                    id = $(node).find('[_entity]').first().attr('name');
                }
                var treeNode = $('[name="'+id+'"]', $tree);
                if (treeNode.length === 0) {
                    _expandParentsForNode(node);
                    treeNode = $('[name="'+id+'"]', $tree);
                }
                selectNode(treeNode, selectionType);
            }
        }
    };
    
    /**
     * Performs actual selection of a tree node
     * @param {element} node A node (LI) in the tree
     * @param {integer} selectionType NODE_SELECTED or CONTENTS_SELECTED
     */
    function selectNode(node, selectionType) {
        _removeCustomClasses();
        var activeNode = $('a[class*=ui-state-active]', '#'+id);
        activeNode.removeClass('jstree-clicked ui-state-active');
        
        var aChildren = node.children('a');
        var id = node.attr('name');
        
        var selectContents = selectionType == tree.CONTENTS_SELECTED;
        if (selectContents) {
            aChildren.addClass('contentsSelected').removeClass('nodeSelected');
        } else {
            aChildren.addClass('nodeSelected').removeClass('contentsSelected');
        }
        aChildren.addClass('jstree-clicked ui-state-active');
        
        tree.currentlySelectedNode = id;
        tree.selectionType = selectionType;
        
        if (w.structs[id] != null) {
            tree.currentlySelectedEntity = null;
            if (w.structs[id]._tag == w.header) {
                w.dialogManager.show('header');
            } else {
                ignoreSelect = true; // set to true so tree.highlightNode code isn't run by editor's onNodeChange handler
                w.selectStructureTag(id, selectContents);
            }
        } else if (w.entitiesManager.getEntity(id) !== undefined) {
            tree.currentlySelectedEntity = id;
            tree.currentlySelectedNode = null;
            tree.selectionType = null;
            aChildren.addClass('nodeSelected').removeClass('contentsSelected');
//            ignoreSelect = true;
            w.entitiesManager.highlightEntity(id, null, true);
        }
        ignoreSelect = false;
    }
    
    /**
     * Processes an element in the editor and returns relevant data for the tree
     * @param node A jQuery object
     * @param level The current tree depth
     */
    function _processNode(node, level) {
        var nodeData = null;
        
        // entity tag
        if (w.isReadOnly === false && node.attr('_entity') && (node.attr('_tag') || node.attr('_note'))) {
            var id = node.attr('name');
            var entity = w.entitiesManager.getEntity(id);
            var type = node.attr('_type');
            var tag = node.attr('_tag');
            if (tag == null) {
                tag = w.schemaManager.mapper.getParentTag(type);
            }
            
            nodeData = {
                text: tag,
                li_attr: {name: id}, // 'class': type}
                state: {opened: level < 3}
            };
            
            if (w.schemaManager.mapper.isEntityTypeNote(type)) {
                var content = w.schemaManager.mapper.getNoteContentForEntity(entity);
                switch($.type(content)) {
                    case 'array':
                        nodeData.children = [];
                        for (var i = 0; i < content.length; i++) {
                            nodeData.children.push({
                                text: content[i],
                                li_attr: {name: id}
                            });
                        }
                        break;
                    case 'string':
                        nodeData.children = [];
                        nodeData.children.push({
                            text: content,
                            li_attr: {name: id}
                        });
                        break;
                    case 'object':
                        if (content.nodeType !== undefined) {
                            var root = $(tag, content).first();
                            
                            function processChildren(children, parent, id) {
                                children.each(function(index, el) {
                                    if (parent.children == null) parent.children = [];
                                    var childData = {
                                        text: el.nodeName,
                                        li_attr: {name: id}
                                    };
                                    parent.children.push(childData);
                                    
                                    processChildren($(el).children(), childData, id);
                                });
                            }
                            
                            processChildren(root.children(), nodeData, id);
                        }
                }
            }
            
        // structure tag
        } else if (node.attr('_tag')) {
            var id = node.attr('id');
            var tag = node.attr('_tag');
            
            if (w.isReadOnly === false || (w.isReadOnly && (tag === w.root || tree.tagFilter.indexOf(tag.toLowerCase()) !== -1))) {
                
                
    //            var isLeaf = node.find('[_tag]').length > 0 ? 'open' : null;
    //            if (tag == w.header) isLeaf = false;
                
                // TODO move this out of here
                // new struct check
                if (id == '' || id == null) {
                    id = w.getUniqueId('struct_');
                    if (w.schemaManager.schema.elements.indexOf(tag) != -1) {
                        node.attr('id', id).attr('_tag', tag);
                        w.structs[id] = {
                            id: id,
                            _tag: tag
                        };
                    }                    
                // duplicate struct check
                } else {
                    var match = $('[id='+id+']', w.editor.getBody());
                    if (match.length > 1) {
                        match.each(function(index, el) {
                            if (index > 0) {
                                var newStruct = $(el);
                                var newId = w.getUniqueId('struct_');
                                newStruct.attr('id', newId);
                                w.structs[newId] = {};
                                for (var key in w.structs[id]) {
                                    w.structs[newId][key] = w.structs[id][key];
                                }
                                w.structs[newId].id = newId;
                            }
                        });
                    }
                }
                
                var info = w.structs[id];
                if (info == undefined) {
                    // redo/undo re-added a struct check
                    info = w.deletedStructs[id];
                    if (info != undefined) {
                        w.structs[id] = info;
                        delete w.deletedStructs[id];
                    }
                }
                if (info) {
                    var text = info._tag;
                    if (w.isReadOnly) {
                        if (tag === w.root) {
                            text = w.currentDocId || w.root;
                        } else {
                            text = w.utilities.getTitleFromContent(node.text());
                        }
                    }
                    nodeData = {
                        text: text,
                        li_attr: {name: id},
                        state: {opened: level < 3}
                    };
                }
            }
        }
        if (nodeData !== null) {
            nodeData.level = level;
            // FIXME we really shouldn't have this hardcoded here
            // manually set the level for CWRC schema to have proper sorting in readOnly mode
            if (w.schemaManager.schemaId === 'cwrcEntry') {
                var subtype = node.attr('subtype');
                if (subtype !== undefined) {
                    nodeData.level = parseInt(subtype);
                }
            }
        }
        
        return nodeData;
    }
    
    /**
     * Recursively work through all elements in the editor and create the data for the tree.
     */
    function _doUpdate(children, nodeParent, level, lastEntry) {
        children.each(function(index, el) {
            var node = $(this);
            var newNodeParent = nodeParent;
            
            var nodeData = _processNode(node, level);
            if (nodeData) {
                if (w.isReadOnly && lastEntry != null) {
                    while (lastEntry.level >= nodeData.level) {
                        lastEntry = lastEntry.parent;
                    }
                    if (lastEntry.children == null) {
                        lastEntry.children = [];
                    }
                    nodeData.parent = lastEntry;
                    lastEntry.children.push(nodeData);
                } else {
                    if (nodeParent.children == null) {
                        nodeParent.children = [];
                    }
                    nodeParent.children.push(nodeData);
                    newNodeParent = nodeParent.children[nodeParent.children.length-1];
                }
                lastEntry = nodeData;
            }
            
            if (node.attr('_tag') != w.header) {
                _doUpdate(node.children(), newNodeParent, level+1, lastEntry);
            }
        });
    }
    
    function _onNodeLoad(context) {
        $('li', context).each(function(index, el) {
            var li = $(this);
            var indent = (li.parents('ul').length - 1) * 16;
            li.prepend("<span class='jstree-indent' style='width: "+indent+"px;'/>");
        });
    }
    
    function _onNodeSelect(event, data) {
        if (!ignoreSelect) {
            nodeSelected = true;
            var id = data.node.li_attr.name;
            var $target = $(data.event.currentTarget);
            var selectContents = $target.hasClass('contentsSelected');
            _removeCustomClasses();
            if (id) {
                // already selected node, toggle selection type
                if (id == tree.currentlySelectedNode) {
                    selectContents = !selectContents;
                }
                
                if (selectContents) {
                    $target.addClass('contentsSelected').removeClass('nodeSelected');
                } else {
                    $target.addClass('nodeSelected').removeClass('contentsSelected');
                }
                
                tree.currentlySelectedNode = id;
                tree.selectionType = selectContents ? tree.CONTENTS_SELECTED : tree.NODE_SELECTED;
                
                if (w.entitiesManager.getEntity(id) !== undefined) {
                    tree.currentlySelectedEntity = id;
                    tree.currentlySelectedNode = null;
                    tree.selectionType = null;
                    $target.addClass('nodeSelected').removeClass('contentsSelected');
                    ignoreSelect = true;
                    w.entitiesManager.highlightEntity(id, null, true);
                } else if (w.structs[id] != null) {
                    tree.currentlySelectedEntity = null;
                    if (w.structs[id]._tag == w.header) {
                        w.dialogManager.show('header');
                    } else {
                        ignoreSelect = true; // set to true so tree.highlightNode code isn't run by editor's onNodeChange handler
                        w.selectStructureTag(id, selectContents);
                    }
                } 
            }
        }
        ignoreSelect = false;
    }
    
    function _onNodeDeselect() {
        _removeCustomClasses();
        tree.currentlySelectedNode = null;
        tree.currentlySelectedEntity = null;
        tree.selectionType = null;
    }
    
    function _onDragDrop(data, isCopy) {
        var dragNode = data.node;
        var dropNode = $tree.jstree('get_node', data.parent);
        
        var dragNodeEditor = $('#'+dragNode.li_attr.name, w.editor.getBody());
        var dropNodeEditor = $('#'+dropNode.li_attr.name, w.editor.getBody());
        
        if (isCopy) {
            dragNodeEditor = dragNodeEditor.clone();
        }
        
        if (data.position === 0) {
            dropNodeEditor.prepend(dragNodeEditor);
        } else {
            var prevSiblingId = dropNode.children[data.position - 1];
            var prevSibling = $tree.jstree('get_node', prevSiblingId);
            dropNodeEditor = $('#'+prevSibling.li_attr.name, w.editor.getBody());
            dropNodeEditor.after(dragNodeEditor);
        }

        tree.update();
        if (isCopy) {
            w.tagger.findDuplicateTags();
            w.entitiesList.update();
        }
    }
    
    function _removeCustomClasses() {
        var nodes = $('a[class*=Selected]', '#'+id);
        nodes.removeClass('nodeSelected contentsSelected');
    }
    
    function _showPopup(content) {
        $('#tree_popup').html(content).show();
    }
    
    function _hidePopup() {
        $('#tree_popup').hide();
    }
    
    function _getSubmenu(tags, tagId) {
        var inserts = {};
        var inserted = false;
        var i, tag, key;
        for (i = 0; i < tags.length; i++) {
            tag = tags[i];
            key = tag.name;
            inserted = true;
            var doc = tag.documentation;
            if (doc == '') {
                doc = key;
            }
            inserts[key] = {
                label: '<span title="'+doc+'">'+key+'</span>',
                icon: w.cwrcRootUrl+'img/tag_blue.png',
                key: key,
                action: function(obj) {
                    // FIXME hack to get actionType
                    var parentText = obj.element.find('.submenu.vakata-context-hover').find('a:first').text();
                    if (parentText.indexOf('Change') !== -1) {
                        var id = obj.reference.parent('li').attr('name');
                        w.tagger.changeTag({key: obj.item.key, id: id});
                    } else {
                        var actionType = parentText.match(/\w+$/)[0].toLowerCase();
                        w.editor.currentBookmark = w.editor.selection.getBookmark(1);
                        w.editor.currentBookmark.tagId = tagId;
                        var parentTag = $('#'+tagId, w.editor.getBody());
                        w.dialogManager.schemaTags.addSchemaTag({key: obj.item.key, action: actionType, parentTag: parentTag});
                    }
                }
            };
        }
        if (!inserted) {
            inserts['no_tags'] = {
                label: 'No tags available.',
                icon: w.cwrcRootUrl+'img/cross.png',
                action: function(obj) {}
            };
        }
        return inserts;
    }
    
    $('#'+config.parentId).append('<div id="structure" class="tabWithLayout">'+
        '<div id="'+id+'" class="ui-layout-center"></div>'+
    '</div>');
    
    $tree = $('#'+id);
    
    $tree.on('loaded.jstree', function(event, data) {
        tree.layout = $('#structure').layout({
            defaults: {
                resizable: false,
                slidable: false,
                closable: false
            },
            south: {
                size: 'auto',
                spacing_open: 0
            }
        });
    });
    
//    $.vakata.dnd.settings.helper_left = 15;
//    $.vakata.dnd.settings.helper_top = 20;
    
    var plugins = ['wholerow','contextmenu'];
    if (w.isReadOnly !== true) {
        plugins.push('dnd');
    }
    
    $tree.jstree({
        plugins: plugins,
        core: {
            check_callback: true, // enable tree modifications
            animation: false,
            themes: {
                name: 'cwrc',
                icons: false,
                url: true,
                dir: w.cwrcRootUrl + 'js/lib/jstree/themes',
                responsive: false
            },
            data: {
                text: 'Tags',
                li_attr: {id: 'cwrc_tree_root'},
                state: {opened: true}
            }
        },
        contextmenu: {
            select_node: false,
            show_at_node: false,
            items: function(node) {
                _hidePopup();
                if (w.isReadOnly) return {};
                if (node.li_attr.id === 'cwrc_tree_root') return {};
                
                var parentNode = $tree.jstree('get_node', node.parents[0]);
                
                var menuConfig = {};
                
                var tagId = node.li_attr.name;
                
                if (w.entitiesManager.getEntity(tagId) !== undefined) {
                    // entity specific actions
                    w.entitiesManager.highlightEntity(tagId); // highlight the entity, otherwise editing will not function
                    
                    menuConfig.editEntity = {
                        label: 'Edit Entity',
                        icon: w.cwrcRootUrl+'img/tag_blue_edit.png',
                        action: function(obj) {
                            var id = obj.reference.parent('li').attr('name');
                            w.tagger.editTag(id);
                        }
                    };
                    menuConfig.copyEntity = {
                        label: 'Copy Entity',
                        icon: w.cwrcRootUrl+'img/tag_blue_copy.png',
                        action: function(obj) {
                            var id = obj.reference.parent('li').attr('name');
                            w.tagger.copyEntity(id);
                        },
                        separator_after: true
                    };
                } else if (w.utilities.isTagEntity(node.text)) {
                    menuConfig.convertEntity = {
                        label: 'Convert to Entity',
                        icon: w.cwrcRootUrl+'img/tag_blue_edit.png',
                        action: function(obj) {
                            var id = obj.reference.parent('li').attr('name');
                            var tag = $('#'+id, w.editor.getBody());
                            w.tagger.convertTagToEntity(tag);
                        },
                        separator_after: true
                    };
                }
                
                // general tag actions;
                var tag = $('#'+tagId, w.editor.getBody())[0];
                if (tag === undefined) return {};                
                var tagName = tag.getAttribute('_tag');
                if (tagName == w.root || tagName == w.header) return {};
                
                var path = w.utilities.getElementXPath(tag);
                var validKeys = w.utilities.getChildrenForTag({tag: tagName, path: path, type: 'element', returnType: 'array'});
                
//              var parentKeys = w.utilities.getParentsForTag({tag: info._tag, returnType: 'array'});
                
                var siblingKeys = {};
                var parentInfo = w.structs[parentNode.li_attr.name];
                if (parentInfo) {
                    tag = $('#'+parentInfo.id, w.editor.getBody())[0];
                    path = w.utilities.getElementXPath(tag);
                    siblingKeys = w.utilities.getChildrenForTag({tag: parentInfo._tag, path: path, type: 'element', returnType: 'array'});
                }
                
                var submenu = _getSubmenu(validKeys, tagId);
//              var parentSubmenu = _getSubmenu(parentKeys, tagId);
                var siblingSubmenu = _getSubmenu(siblingKeys, tagId);
                var items = {
                    'before': {
                        label: 'Insert Tag Before',
                        icon: w.cwrcRootUrl+'img/tag_blue_add.png',
                        actionType: 'before',
                        _class: 'submenu',
                        submenu: siblingSubmenu
                    },
                    'after': {
                        label: 'Insert Tag After',
                        icon: w.cwrcRootUrl+'img/tag_blue_add.png',
                        actionType: 'after',
                        _class: 'submenu',
                        submenu: siblingSubmenu
                    },
//                    'around': {
//                        label: 'Insert Tag Around',
//                        icon: w.cwrcRootUrl+'img/tag_blue_add.png',
//                        _class: 'submenu',
//                        submenu: parentSubmenu
//                    },
                    'inside': {
                        label: 'Insert Tag Inside',
                        icon: w.cwrcRootUrl+'img/tag_blue_add.png',
                        actionType: 'inside',
                        _class: 'submenu',
                        separator_after: true,
                        submenu: submenu
                    },
                    'change': {
                        label: 'Change Tag',
                        icon: w.cwrcRootUrl+'img/tag_blue_edit.png',
                        actionType: 'change',
                        _class: 'submenu',
                        submenu: siblingSubmenu
                    },
                    'edit': {
                        label: 'Edit Tag',
                        icon: w.cwrcRootUrl+'img/tag_blue_edit.png',
                        action: function(obj) {
                            var id = obj.reference.parent('li').attr('name');
                            w.tagger.editTag(id);
                        }
                    },
                    'copy': {
                        label: 'Copy Tag & Contents',
                        icon: w.cwrcRootUrl+'img/tag_blue_copy.png',
                        action: function(obj) {
                            var id = obj.reference.parent('li').attr('name');
                            w.tagger.copyTag(id);
                        }
                    },
                    'delete': {
                        label: 'Remove Tag Only',
                        icon: w.cwrcRootUrl+'img/tag_blue_delete.png',
                        separator_before: true,
                        action: function(obj) {
                            var id = obj.reference.parent('li').attr('name');
                            w.tagger.removeStructureTag(id, false);
                        }
                    },
                    'delete_content': {
                        label: 'Remove Content Only',
                        icon: w.cwrcRootUrl+'img/tag_blue_delete.png',
                        action: function(obj) {
                            var id = obj.reference.parent('li').attr('name');
                            w.tagger.removeStructureTagContents(id);
                        }
                    },
                    'delete_all': {
                        label: 'Remove Tag and All Content',
                        icon: w.cwrcRootUrl+'img/tag_blue_delete.png',
                        action: function(obj) {
                            var id = obj.reference.parent('li').attr('name');
                            w.tagger.removeStructureTag(id, true);
                        }
                    }
                };
                
                $.extend(menuConfig, items);

                return menuConfig;
            }
        }
    });
    
    $tree.on('select_node.jstree', _onNodeSelect);
    $tree.on('deselect_node.jstree', _onNodeDeselect);
    $tree.on('copy_node.jstree', function(e, data) {
        _onDragDrop(data, true);
    });
    $tree.on('move_node.jstree', function(e, data) {
        _onDragDrop(data, false);
    });
    $tree.on('load_node.jstree', function(event, data) {
        _onNodeLoad(data.node);
    });
    $tree.on('keydown.jstree', function(e) {
        //console.log(e.which);
    });
    
    // add to writer
    w.tree = tree;
    
    w.event('structureTreeInitialized').publish(tree);
    
    return tree;
};

});