function setupLayoutAndModules(w, EntitiesList, StructureTree, Relations) {
    var $ = require('jquery');
    
    var mode = 'reader';
    
    w.layout = $('#cwrc_wrapper').layout({
        defaults: {
            maskIframesOnResize: true,
            resizable: true,
            slidable: false,
            fxName: 'none'
        },
        north: {
            size: 35,
            spacing_open: 0,
            minSize: 35,
            maxSize: 60,
            closable: false
        },
        west: {
            size: 'auto',
            minSize: 325,
            onresize: function(region, pane, state, options) {
                var tabsHeight = $('#westTabs > ul').outerHeight();
                $('#westTabsContent').height(state.layoutHeight - tabsHeight);
    //                    $.layout.callbacks.resizeTabLayout(region, pane);
            }
        }
    });
    w.layout.panes.center.layout({
        defaults: {
            maskIframesOnResize: true,
            resizable: true,
            slidable: false
        },
        center: {
            onresize: function(region, pane, state, options) {
                var uiHeight = 4;
                var toolbar = $('.mce-toolbar-grp',writer.editor.getContainer());
                if (toolbar.is(':visible')) {
                    uiHeight += toolbar.outerHeight();
                }
                $('iframe',writer.editor.getContainer()).height(state.layoutHeight - uiHeight);
            }
        },
        south: {
            size: 250,
            resizable: true,
            initClosed: true,
            activate: function(event, ui) {
                $.layout.callbacks.resizeTabLayout(event, ui);
            },
    //                onopen_start: function(region, pane, state, options) {
    //                    var southTabs = $('#southTabs');
    //                    if (!southTabs.hasClass('ui-tabs')) {
    //                        
    //                    }
    //                },
            onresize: function(region, pane, state, options) {
                var tabsHeight = $('#southTabs > ul').outerHeight();
                $('#southTabsContent').height(state.layoutHeight - tabsHeight);
            }
        }
    });
    
    $('#cwrc_header h1').click(function() {
        window.location = 'http://www.cwrc.ca';
    });
    
    new StructureTree({writer: w, parentId: 'westTabsContent'});
    new EntitiesList({writer: w, parentId: 'westTabsContent'});
    new Relations({writer: w, parentId: 'westTabsContent'});
    
    $('#westTabs').tabs({
        active: 0,
        activate: function(event, ui) {
            $.layout.callbacks.resizeTabLayout(event, ui);
        },
        create: function(event, ui) {
            $('#westTabs').parent().find('.ui-corner-all:not(button)').removeClass('ui-corner-all');
        }
    });
    
    
    // Mode switching functionality
    
    var activateReader = function() {
        w.isAnnotator = false;
        w.layout.close('west');
        w.hideToolbar();
        
        w.editor.plugins.cwrc_contextmenu.disabled = true;
        
        mode = 'reader';
    }
    
    var activateAnnotator = function() {
        w.isAnnotator = true;
        w.layout.open('west');
        w.showToolbar();
        
        w.editor.plugins.cwrc_contextmenu.disabled = false;
        w.editor.plugins.cwrc_contextmenu.entityTagsOnly = true;
        
        mode = 'annotator';
    }
    
    $('#headerButtons').append(''+
    '<div id="annotateLink"><h2>Annotate</h2></div>');
    $('#annotateLink').click(function() {
        if (mode === 'reader') {
            // TODO check credentials
            activateAnnotator();
            $('h2', this).text('Read');
        } else {
            activateReader();
            $('h2', this).text('Annotate');
        }
    });
    
    activateReader();
    
    
    
    var isLoading = false;
    var doneLayout = false;
    var onLoad = function() {
        isLoading = true;
    };
    var onLoadDone = function() {
        isLoading = false;
        
        // force mode
        w.mode = w.RDF;
        w.allowOverlap = true;
        
        if (doneLayout) {
            $('#cwrc_loadingMask').fadeOut();
            w.event('documentLoaded').unsubscribe(onLoadDone);
        }
    };
    w.event('loadingDocument').subscribe(onLoad);
    w.event('documentLoaded').subscribe(onLoadDone);
    
    setTimeout(function() {
        w.layout.options.onresizeall_end = function() {
            doneLayout = true;
            if (isLoading === false) {
                $('#cwrc_loadingMask').fadeOut();
                w.layout.options.onresizeall_end = null;
            }
        };
        w.layout.resizeAll(); // now that the editor is loaded, set proper sizing
    }, 250);
}