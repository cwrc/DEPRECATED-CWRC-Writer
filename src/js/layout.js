function setupLayoutAndModules(w, EntitiesList, Relations, Selection, StructureTree, Validation) {
    var $ = require('jquery');
    
    w.layout = $('#cwrc_wrapper').layout({
        defaults: {
            maskIframesOnResize: true,
            resizable: true,
            slidable: false
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
                var toolbar = $('.mce-toolbar-grp', w.editor.getContainer());
                if (toolbar.is(':visible')) {
                    uiHeight += toolbar.outerHeight();
                }
                $('iframe', w.editor.getContainer()).height(state.layoutHeight - uiHeight);
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
    new Validation({writer: w, parentId: 'southTabsContent'});
    new Selection({writer: w, parentId: 'southTabsContent'});
    
    $('#westTabs').tabs({
        active: 1,
        activate: function(event, ui) {
            $.layout.callbacks.resizeTabLayout(event, ui);
        },
        create: function(event, ui) {
            $('#westTabs').parent().find('.ui-corner-all:not(button)').removeClass('ui-corner-all');
        }
    });
    $('#southTabs').tabs({
        active: 1,
        activate: function(event, ui) {
            $.layout.callbacks.resizeTabLayout(event, ui);
        },
        create: function(event, ui) {
            $('#southTabs').parent().find('.ui-corner-all:not(button)').removeClass('ui-corner-all');
        }
    });
    
    var isLoading = false;
    var doneLayout = false;
    var onLoad = function() {
        isLoading = true;
    };
    var onLoadDone = function() {
        isLoading = false;
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