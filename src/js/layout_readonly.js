function setupLayoutAndModules(w) {
    var $ = require('jquery');
    
    w.layout = $('#cwrc_wrapper').layout({
        defaults: {
            maskIframesOnResize: true,
            resizable: true,
            slidable: false
        },
    //            east: {
    //                onresize: function() {
    //                    // TODO: Move this out of the editor somehow.
    //                    // Accessing 'writer.layout.east.onresize does no
    //                    // work.
    //                    resizeCanvas();
    //                },
    //            },
        north: {
            size: 35,
            minSize: 35,
            maxSize: 60
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
                var uiHeight = $('#'+w.editor.id+'_tbl td.mceToolbar').outerHeight() + 2;
                $('#'+w.editor.id+'_ifr').height(state.layoutHeight - uiHeight);
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