define(['jquery', 'jquery-ui'], function($, jqueryUi) {

/**
 * @class Relations
 * @param {Object} config
 * @param {Writer} config.writer
 * @param {String} config.parentId
 */
return function(config) {
    
    var w = config.writer;
    
    $('#'+config.parentId).append('<div id="relations" class="tabWithLayout" style="height: 100% !important;">'+
            '<div id="relation_alter" class="ui-layout-center"><ul class="relationsList"></ul></div>'+
            '<div class="ui-layout-south tabButtons">'+
            '<button type="button">Add Relation</button><button type="button">Remove Relation</button>'+
            '</div>'+
        '</div>');
    $(document.body).append(''+
        '<div id="relationsMenu" class="contextMenu" style="display: none;"><ul>'+
        '<li id="removeRelation"><ins style="background:url(img/cross.png) center center no-repeat;" />Remove Relation</li>'+
        '</ul></div>'
    );
    
    $('#relations div.ui-layout-south button:eq(0)').button().click(function() {
        w.dialogManager.show('triple');
    });
    $('#relations div.ui-layout-south button:eq(1)').button().click(function() {
        var selected = $('#relations ul li.selected');
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
    
    pm.layout = $('#relations').layout({
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
        $('#relations ul').empty();
        
        var relationsString = '';
        
        for (var i = 0; i < w.triples.length; i++) {
            var triple = w.triples[i];
            relationsString += '<li>'+triple.subject.text+' '+triple.predicate.text+' '+triple.object.text+'</li>';
        }
        
        $('#relations ul').html(relationsString);
        
        $('#relations ul li').each(function(index, el) {
            $(this).data('index', index);
        }).click(function() {
            $(this).addClass('selected').siblings().removeClass('selected');
        }).contextMenu('relationsMenu', {
            bindings: {
                'removeRelation': function(r) {
                    var i = $(r).data('index');
                    w.triples.splice(i, 1);
                    pm.update();
                }
            },
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