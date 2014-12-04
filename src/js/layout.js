function setupLayoutAndModules(w, EntitiesList, Relations, Selection, StructureTree, Validation) {
    var $ = require('jquery');
    
    var editorId = w.getUniqueId('editor_');
    
    var html = ''+
'<div class="cwrc_loadingMask"><div>Loading CWRC-Writer</div></div>'+
'<div class="cwrc_wrapper">'+
    '<div class="cwrc cwrc_header ui-layout-north">'+
        '<h1>CWRC-Writer v0.8</h1>'+
    '</div>'+
    '<div class="cwrc ui-layout-west">'+
        '<div class="westTabs tabs">'+
            '<ul class="ui-layout-north">'+
            '</ul>'+
            '<div class="westTabsContent ui-layout-center">'+
            '</div>'+
        '</div>'+
    '</div>'+
    '<div class="cwrc_main ui-layout-center">'+
        '<div class="ui-layout-center">'+
            '<form method="post" action="">'+
                '<textarea id="'+editorId+'" name="editor" class="tinymce"></textarea>'+
            '</form>'+
        '</div>'+
        '<div class="cwrc ui-layout-south">'+
            '<div class="southTabs tabs">'+
                '<ul>'+
                '</ul>'+
                '<div class="southTabsContent ui-layout-content"></div>'+
            '</div>'+
        '</div>'+
    '</div>'+
'</div>';
    
    var $parentContainer = $('#'+w.getId());
    
    $parentContainer.html(html);
    
    w.init(editorId);
    
    
    var $westTabs = $parentContainer.find('.westTabs');
    var $westTabsContent = $parentContainer.find('.westTabsContent');
    
    var structTree = new StructureTree({writer: w, parentElement: $westTabsContent});
    var structId = structTree.getId();
    $westTabs.children('ul').append('<li><a href="#'+structId+'">Markup</a>');
    
    var entList = new EntitiesList({writer: w, parentElement: $westTabsContent});
    var entId = entList.getId();
    $westTabs.children('ul').append('<li><a href="#'+entId+'">Entities</a>');
    
    var relations = new Relations({writer: w, parentElement: $westTabsContent});
    var relId = relations.getId();
    $westTabs.children('ul').append('<li><a href="#'+relId+'">Relations</a>');
    
    var $southTabs = $parentContainer.find('.southTabs');
    var $southTabsContent = $parentContainer.find('.southTabsContent');
    
    var validation = new Validation({writer: w, parentElement: $southTabsContent});
    var valId = validation.getId();
    $southTabs.children('ul').append('<li><a href="#'+valId+'">Validation</a>');
    
    var selection = new Selection({writer: w, parentElement: $southTabsContent});
    var selId = selection.getId();
    $southTabs.children('ul').append('<li><a href="#'+selId+'">Selection</a>');
    
    
    w.layout = $('.cwrc_wrapper', $parentContainer).layout({
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
        },
        south: {
            size: 34,
            spacing_open: 0,
            spacing_closed: 0
        },
        west: {
            size: 'auto',
            minSize: 325,
            onresize: function(region, pane, state, options) {
                var tabsHeight = $('.westTabs > ul', $parentContainer).outerHeight();
                $('.westTabsContent', $parentContainer).height(state.layoutHeight - tabsHeight);
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
                var uiHeight = $('#'+w.editor.id+'_tbl tr.mceFirst').outerHeight() + 2;
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
                var tabsHeight = $('.southTabs > ul', $parentContainer).outerHeight();
                $('.southTabsContent', $parentContainer).height(state.layoutHeight - tabsHeight);
            }
        }
    });
    
    $('.cwrc_header h1', $parentContainer).click(function() {
        window.location = 'http://www.cwrc.ca';
    });
    
    $('.westTabs', $parentContainer).tabs({
        active: 1,
        activate: function(event, ui) {
            $.layout.callbacks.resizeTabLayout(event, ui);
        },
        create: function(event, ui) {
            $('.westTabs', $parentContainer).parent().find('.ui-corner-all').removeClass('ui-corner-all');
        }
    });
    $('.southTabs', $parentContainer).tabs({
        active: 1,
        activate: function(event, ui) {
            $.layout.callbacks.resizeTabLayout(event, ui);
        },
        create: function(event, ui) {
            $('.southTabs', $parentContainer).parent().find('.ui-corner-all').removeClass('ui-corner-all');
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
            $('.cwrc_loadingMask').fadeOut();
            w.event('documentLoaded').unsubscribe(onLoadDone);
        }
    };
    w.event('loadingDocument').subscribe(onLoad);
    w.event('documentLoaded').subscribe(onLoadDone);
    
    w.event('validationInitiated').subscribe(function() {
        w.layout.center.children.layout1.open('south');
        $southTabs.tabs('option', 'active', 0);
    });
    
    setTimeout(function() {
        w.layout.options.onresizeall_end = function() {
            doneLayout = true;
            if (isLoading === false) {
                $('.cwrc_loadingMask').fadeOut();
                w.layout.options.onresizeall_end = null;
            }
        };
        w.layout.resizeAll(); // now that the editor is loaded, set proper sizing
    }, 250);
}