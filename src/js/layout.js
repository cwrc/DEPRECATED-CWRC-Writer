'use strict';

var $ = require('jquery');
require('jquery-ui');
require('jquery-layout');

var StructureTree = require('./modules/structureTree.js');
var EntitiesList = require('./modules/entitiesList.js')
var Validation = require('./modules/validation.js');
var Relations = require('./modules/relations.js');
var Selection = require('./modules/selection.js');

function Layout(w, config) {
    this.w = w;
    this.container = config.container;
    this.textareaId = config.textareaId;
    this.ui = null;
}

Layout.prototype = {
    constructor: Layout,
    
    init: function() {
        $(this.container).html(
            '<div id="cwrc_loadingMask" class="cwrc"><div>Loading CWRC-Writer</div></div>'+
            '<div id="cwrc_wrapper">'+
                '<div id="cwrc_header" class="cwrc ui-layout-north">'+
                    '<h1>CWRC-Writer v0.9</h1>'+
                    '<div id="headerButtons"></div>'+
                '</div>'+
                '<div class="cwrc ui-layout-west">'+
                    '<div id="westTabs" class="tabs">'+
                        '<ul>'+
                            '<li><a href="#entities">Entities</a></li>'+
                            '<li><a href="#structure">Structure</a></li>'+
                            '<li><a href="#relations">Relations</a></li>'+
                        '</ul>'+
                        '<div id="westTabsContent" class="ui-layout-content"></div>'+
                    '</div>'+
                '</div>'+
                '<div id="cwrc_main" class="ui-layout-center">'+
                    '<div class="ui-layout-center">'+
                        '<form method="post" action="">'+
                            '<textarea id="'+this.textareaId+'" name="editor" class="tinymce"></textarea>'+
                        '</form>'+
                    '</div>'+
                    '<div class="cwrc ui-layout-south">'+
                        '<div id="southTabs" class="tabs">'+
                            '<ul>'+
                                '<li><a href="#validation">Validation</a></li>'+
                                '<li><a href="#selection">Markup</a></li>'+
                            '</ul>'+
                            '<div id="southTabsContent" class="ui-layout-content"></div>'+
                        '</div>'+
                    '</div>'+
                '</div>'+
            '</div>'
        );
        
        this.ui = $('#cwrc_wrapper', this.container).layout({
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
        
        this.ui.panes.center.layout({
            defaults: {
                maskIframesOnResize: true,
                resizable: true,
                slidable: false
            },
            center: {
                onresize: function(region, pane, state, options) {
                    var uiHeight = 4;
                    var toolbar = $('.mce-toolbar-grp', this.w.editor.getContainer());
                    if (toolbar.is(':visible')) {
                        uiHeight += toolbar.outerHeight();
                    }
                    $('iframe', this.w.editor.getContainer()).height(state.layoutHeight - uiHeight);
                }.bind(this)
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
        
        new StructureTree({writer: this.w, parentId: 'westTabsContent'});
        new EntitiesList({writer: this.w, parentId: 'westTabsContent'});
        new Relations({writer: this.w, parentId: 'westTabsContent'});
        new Validation({writer: this.w, parentId: 'southTabsContent'});
        new Selection({writer: this.w, parentId: 'southTabsContent'});
        
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
            this.w.event('loadingDocument').unsubscribe(onLoad);
        }.bind(this);
        var onLoadDone = function() {
            isLoading = false;
            if (doneLayout) {
                $('#cwrc_loadingMask').fadeOut();
                this.w.event('documentLoaded').unsubscribe(onLoadDone);
                doResize();
            }
        }.bind(this);
        var doResize = function() {
            this.ui.options.onresizeall_end = function() {
                doneLayout = true;
                if (isLoading === false) {
                    $('#cwrc_loadingMask').fadeOut();
                    this.ui.options.onresizeall_end = null;
                }
            }.bind(this);
            this.ui.resizeAll(); // now that the editor is loaded, set proper sizing
        }.bind(this);
        
        this.w.event('loadingDocument').subscribe(onLoad);
        this.w.event('documentLoaded').subscribe(onLoadDone);
        this.w.event('writerInitialized').subscribe(doResize);
        
        return this.ui;
    }
}

module.exports = Layout;
