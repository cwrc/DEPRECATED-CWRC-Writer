define(['jquery', 'jquery-ui'], function($, jqueryUi) {

/**
 * @class Relations
 * @param {Object} config
 * @param {Writer} config.writer
 * @param {String} config.parentId
 * @param {jQuery} config.parentElement
 */
return function(config) {
    
    var w = config.writer;
    
    var id = w.getUniqueId('relations_');
    
    var $parent;
    if (config.parentElement !== undefined) {
        $parent = config.parentElement;
    } else if (config.parentId !== undefined) {
        $parent = $('#'+config.parentId);
    }
    
    $parent.append(''+
        '<div id="'+id+'">'+
            '<div class="ui-layout-center"><ul class="relationsList"></ul></div>'+
            '<div class="ui-layout-south tabButtons">'+
            '<button>Add Relation</button><button>Remove Relation</button>'+
            '</div>'+
        '</div>');
    $(document.body).append(''+
        '<div id="'+id+'_relationsMenu" class="contextMenu" style="display: none;"><ul>'+
        '<li id="'+id+'_removeRelation"><ins style="background:url(img/cross.png) center center no-repeat;" />Remove Relation</li>'+
        '</ul></div>'
    );
    
    var $relations = $('#'+id);
    
    $('div.ui-layout-south button:eq(0)', $relations).button().click(function() {
        w.dialogManager.show('triple');
    });
    $('div.ui-layout-south button:eq(1)', $relations).button().click(function() {
        var selected = $('ul li.selected', $relations);
        if (selected.length == 1) {
            var i = selected.data('index');
            w.triples.splice(i, 1);
            pm.update();
        } else {
            w.dialogManager.show('message', {
                title: 'No Relation Selected',
                msg: 'You must first select a relation to remove.',
                type: 'error'
            });
        }
    });
    
    w.event('documentLoaded').subscribe(function() {
        pm.update();
    });
    w.event('schemaLoaded').subscribe(function() {
        pm.update();
    });
    
    /**
     * @lends Relations.prototype
     */
    var pm = {
        currentlySelectedNode: null
    };
    
    pm.getId = function() {
        return id;
    };
    
    pm.layout = $relations.layout({
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
    
    /**
     * Update the list of relations.
     */
    pm.update = function() {
        $('ul', $relations).empty();
        
        var relationsString = '';
        
        for (var i = 0; i < w.triples.length; i++) {
            var triple = w.triples[i];
            relationsString += '<li>'+triple.subject.text+' '+triple.predicate.text+' '+triple.object.text+'</li>';
        }
        
        $('ul', $relations).html(relationsString);
        
        var menuBindings = {};
        menuBindings[id+'_removeRelation'] = function(r) {
            var i = $(r).data('index');
            w.triples.splice(i, 1);
            pm.update();
        };
        
        $('ul li', $relations).each(function(index, el) {
            $(this).data('index', index);
        }).click(function() {
            $(this).addClass('selected').siblings().removeClass('selected');
        }).contextMenu(id+'_relationsMenu', {
            bindings: menuBindings,
            shadow: false,
            menuStyle: {
                backgroundColor: '#FFFFFF',
                border: '1px solid #D4D0C8',
                boxShadow: '1px 1px 2px #CCCCCC',
                padding: '0px',
                width: '105px'
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
    };
    
    // add to writer
    w.relations = pm;
    
    return pm;
};

});