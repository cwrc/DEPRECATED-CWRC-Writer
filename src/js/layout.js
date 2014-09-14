// Creates the basic layout of the CWRC-Writer.
function setupLayoutAndModules(writer, EntitiesList, Relations, Selection, StructureTree, Validation) {
  'use strict';
  var $ = require('jquery');
  writer.layout = $('#cwrc_wrapper').layout({
    defaults: {
      maskIframesOnResize: true,
      resizable: true,
      slidable: false
    },
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
      onresize: function (region, pane, state, options) {
        var tabsHeight = $('#westTabs > ul').outerHeight();
        $('#westTabsContent').height(state.layoutHeight - tabsHeight);
      }
    }
  });
  writer.layout.panes.center.layout({
    defaults: {
      maskIframesOnResize: true,
      resizable: true,
      slidable: false
    },
    center: {
      onresize: function (region, pane, state, options) {
        var uiHeight = $('#' + writer.editor.id + '_tbl tr.mceFirst').outerHeight() + 2;
        $('#' + writer.editor.id + '_ifr').height(state.layoutHeight - uiHeight);
      }
    },
    south: {
      size: 250,
      resizable: true,
      initClosed: true,
      activate: function (event, ui) {
        $.layout.callbacks.resizeTabLayout(event, ui);
      },
      onresize: function (region, pane, state, options) {
        var tabsHeight = $('#southTabs > ul').outerHeight();
        $('#southTabsContent').height(state.layoutHeight - tabsHeight);
      }
    }
  });

  $('#cwrc_header h1').click(function () {
    window.location = 'http://www.cwrc.ca';
  });

  new StructureTree({writer: writer, parentId: 'westTabsContent'});
  new EntitiesList({writer: writer, parentId: 'westTabsContent'});
  new Relations({writer: writer, parentId: 'westTabsContent'});
  new Validation({writer: writer, parentId: 'southTabsContent'});
  new Selection({writer: writer, parentId: 'southTabsContent'});

  $('#westTabs').tabs({
    active: 1,
    activate: function (event, ui) {
      $.layout.callbacks.resizeTabLayout(event, ui);
    },
    create: function (event, ui) {
      $('#westTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
    }
  });

  $('#southTabs').tabs({
    active: 1,
    activate: function (event, ui) {
      $.layout.callbacks.resizeTabLayout(event, ui);
    },
    create: function (event, ui) {
      $('#southTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
    }
  });

  setTimeout(function () {
    writer.layout.resizeAll(); // now that the editor is loaded, set proper sizing
  }, 250);
}
