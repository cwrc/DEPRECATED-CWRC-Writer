define(['jquery', 'jquery-ui', 'jquery.contextmenu'], function($, jqueryUi, jqueryContextMenu) {
    
/**
 * @class EntitiesList
 * @fires Writer#entitiesListInitialized
 * @param {Object} config
 * @param {Writer} config.writer
 * @param {String} config.parentId
 */
return function(config) {
    
    var w = config.writer;
    
    var metaKeys = ['_id', '_ref'];
    var showMetaKeys = false;
    
    $('#'+config.parentId).append('<div id="entities" class="tabWithLayout">'+
            '<ul class="entitiesList ui-layout-center"></ul>'+
            '<div id="entitiesOptions" class="ui-layout-south tabButtons">'+
            '<div id="sortBy"><span>Sort By</span> '+
            '<input type="radio" id="sequence" name="sortBy" checked="checked" /><label for="sequence">Sequence</label>'+
            '<input type="radio" id="category" name="sortBy" /><label for="category">Category</label></div>'+
            '<!--<div><input type="checkbox" id="metaKeys" /><label for="metaKeys">Show Metadata</label></div>-->'+
            '</div></div>');
    $(document.body).append(''+
        '<div id="entitiesMenu" class="contextMenu" style="display: none;"><ul>'+
        '<li id="editEntity"><ins style="background:url('+w.cwrcRootUrl+'img/tag_blue_edit.png) center center no-repeat;" />Edit Entity</li>'+
        '<li id="removeEntity"><ins style="background:url('+w.cwrcRootUrl+'img/cross.png) center center no-repeat;" />Remove Entity</li>'+
        '<li class="separator" id="copyEntity"><ins style="background:url('+w.cwrcRootUrl+'img/tag_blue_copy.png) center center no-repeat;" />Copy Entity</li>'+
        '</ul></div>'
    );
    
    $('#sequence').button().click(function() {
        w.entitiesList.update('sequence');
        w.entitiesManager.highlightEntity(w.entitiesManager.getCurrentEntity());
    });
    $('#category').button().click(function() {
        w.entitiesList.update('category');
        w.entitiesManager.highlightEntity(w.entitiesManager.getCurrentEntity());
    });
    $('#sortBy').buttonset();
//    $('#metaKeys').button().click(function() {
//        showMetaKeys = !showMetaKeys;
//        w.entitiesList.update();
//        w.entitiesManager.highlightEntity(w.entitiesManager.getCurrentEntity());
//    });
    
    /**
     * @lends EntitiesList.prototype
     */
    var pm = {};
    
    pm.layout = $('#entities').layout({
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
    
    w.event('documentLoaded').subscribe(function() {
        pm.update();
    });
    w.event('schemaLoaded').subscribe(function() {
        pm.update();
    });
    w.event('contentChanged').subscribe(function() {
        pm.update();
    });
    w.event('contentPasted').subscribe(function() {
        pm.update();
    });
    w.event('entityAdded').subscribe(function(entityId) {
        pm.update();
    });
    w.event('entityEdited').subscribe(function(entityId) {
        pm.update();
    });
    w.event('entityRemoved').subscribe(function(entityId) {
        pm.remove(entityId);
    });
    w.event('entityFocused').subscribe(function(entityId) {
        $('#entities > ul > li[name="'+entityId+'"]').addClass('selected').find('div[class="info"]').show();
    });
    w.event('entityUnfocused').subscribe(function(entityId) {
        $('#entities > ul > li').each(function(index, el) {
            $(this).removeClass('selected').css('background-color', '').find('div[class="info"]').hide();
        });
    });
    w.event('entityPasted').subscribe(function(entityId) {
        pm.update();
    });
    
    /**
     * @param sort
     */
    pm.update = function(sort) {
        if (sort == null) {
            if ($('#sequence').prop('checked')) {
                sort = 'sequence';
            } else {
                sort = 'category';
            }
        }
        
        $('#entities > ul').empty(); // remove previous nodes and event handlers
        
        var id, entry, i;
        var entitiesString = '';
        
        var entityTags = $('[_entity][class~=start]', w.editor.getBody());
        if (sort == 'category') {
            var categories = {};
            entityTags.each(function(index, el) {
                id = $(el).attr('name');
                if (w.entitiesManager.getEntity(id) === undefined) {
                    var deleted = w.deletedEntities[id];
                    if (deleted != null) {
                        w.entitiesManager.setEntity(id, deleted);
                        entry = deleted;
                        delete w.deletedEntities[id];
                    } else {
                        w.tagger.removeEntity(id);
                        return;
                    }
                } else {
                    entry = w.entitiesManager.getEntity(id);
                }
                if (categories[entry.getType()] == null) {
                    categories[entry.getType()] = [];
                }
                categories[entry.getType()].push(entry);
            });
            var category;
            for (id in categories) {
                category = categories[id];
                for (i = 0; i < category.length; i++) {
                    entry = category[i];
                    entitiesString += _buildEntity(entry);
                }
            }
        } else if (sort == 'sequence') {
            entityTags.each(function(index, el) {
                id = $(this).attr('name');
                if (w.entitiesManager.getEntity(id) === undefined) {
                    var deleted = w.deletedEntities[id];
                    if (deleted != null) {
                        w.entitiesManager.setEntity(id, deleted);
                        entry = deleted;
                        delete w.deletedEntities[id];
                    } else {
                        w.tagger.removeEntity(id);
                        return;
                    }
                } else {
                    entry = w.entitiesManager.getEntity(id);
                }
                if (entry) {
                    entitiesString += _buildEntity(entry);
                }
            });
        }
        
        $('#entities > ul').html(entitiesString);
        $('#entities > ul > li').hover(function() {
            if (!$(this).hasClass('selected')) {
                $(this).addClass('over');
            }
        }, function() {
            if (!$(this).hasClass('selected')) {
                $(this).removeClass('over');
            }
        }).mousedown(function(event) {
            $(this).removeClass('over');
            w.entitiesManager.highlightEntity(this.getAttribute('name'), null, true);
        }).contextMenu('entitiesMenu', {
            bindings: {
                'editEntity': function(tag) {
                    w.tagger.editTag($(tag).attr('name'));
                },
                'removeEntity': function(tag) {
                    w.tagger.removeEntity($(tag).attr('name'));
                },
                'copyEntity': function(tag) {
                    w.tagger.copyEntity($(tag).attr('name'));
                }
            },
            shadow: false,
            menuStyle: {
                backgroundColor: '#FFFFFF',
                border: '1px solid #D4D0C8',
                boxShadow: '1px 1px 2px #CCCCCC',
                padding: '0px'
            },
            itemStyle: {
                fontFamily: 'Tahoma,Verdana,Arial,Helvetica',
                fontSize: '11px',
                color: '#000',
                lineHeight: '20px',
                padding: '0px',
                cursor: 'pointer',
                textDecoration: 'none',
                border: 'none'
            },
            itemHoverStyle: {
                color: '#000',
                backgroundColor: '#DBECF3',
                border: 'none'
            }
        });
        
        if (w.entitiesManager.getCurrentEntity()) {
            $('#entities > ul > li[name="'+w.entitiesManager.getCurrentEntity()+'"]').addClass('selected').find('div[class="info"]').show();
        }
    };
    
    function _buildEntity(entity) {
        var infoString = '<ul>';
        var buildString = function(infoObject) {
            for (var infoKey in infoObject) {
                if (showMetaKeys || metaKeys.indexOf(infoKey) == -1) {
                    var info = infoObject[infoKey];
                    if ($.isPlainObject(info)) {
                        buildString(info);
                    } else {
                        infoString += '<li><strong>'+infoKey+'</strong>: '+info+'</li>';
                    }
                }
            }
        };
        buildString(entity.getAttributes());
        infoString += '</ul>';
        return '<li class="'+entity.getType()+'" name="'+entity.getId()+'">'+
            '<span class="box"/><span class="entityTitle">'+entity.getTitle()+'</span><div class="info">'+infoString+'</div>'+
        '</li>';
    };
    
    pm.remove = function(id) {
        $('#entities li[name="'+id+'"]').remove();
    };
    
    // add to writer
    w.entitiesList = pm;
    
    w.event('entitiesListInitialized').publish(pm);
    
    return pm;
};

});