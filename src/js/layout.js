function setupLayoutAndModules(w, EntitiesList, Relations, Selection, StructureTree, Validation) {
	w.layout = $('#cwrc_wrapper').layout({
		defaults: {
			maskIframesOnResize: true,
			resizable: true,
			slidable: false
		},
	//			east: {
	//				onresize: function() {
	//					// TODO: Move this out of the editor somehow.
	//					// Accessing 'writer.layout.east.onresize does no
	//					// work.
	//					resizeCanvas();
	//				},
	//			},
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
				var tabsHeight = $('#westTabs > ul').outerHeight();
				$('#westTabsContent').height(state.layoutHeight - tabsHeight);
	//					$.layout.callbacks.resizeTabLayout(region, pane);
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
	//				onopen_start: function(region, pane, state, options) {
	//					var southTabs = $('#southTabs');
	//					if (!southTabs.hasClass('ui-tabs')) {
	//						
	//					}
	//				},
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
			$('#westTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
		}
	});
	$('#southTabs').tabs({
		active: 1,
		activate: function(event, ui) {
			$.layout.callbacks.resizeTabLayout(event, ui);
		},
		create: function(event, ui) {
			$('#southTabs').parent().find('.ui-corner-all').removeClass('ui-corner-all');
		}
	});
	
	setTimeout(function() {
		w.layout.resizeAll(); // now that the editor is loaded, set proper sizing
	}, 250);
}