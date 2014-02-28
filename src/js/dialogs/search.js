define(['jquery', 'jquery-ui'], function($, jqueryUi) {
	
return function(writer) {
	var w = writer;
	
	var currentType = null;
	var currentId = null;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var projectTitle = w.project != null ? w.project.title : '';
	
	$(document.body).append(''+
	'<div id="searchDialog" class="annotationDialog">'+
		// need absolute positioning so accordion height is calculated properly
	    '<div style="position: absolute; top: 10px; left: 10px; right: 10px; height: 31px;">'+
		    '<label for="search_query">Search</label>'+
		    '<input type="text" name="query" id="search_query" />'+
	    '</div>'+
	    '<div style="position: absolute; top: 55px; left: 10px; right: 10px; bottom: 70px;">'+
		    '<div id="lookupServices">'+
		    	'<div id="lookup_project">'+
			    '<h3>Results from '+projectTitle+' Project</h3>'+
			    '<div><div class="searchResultsParent"><ul class="searchResults"></ul></div></div>'+
			    '</div>'+
			    '<div id="lookup_viaf">'+
			    '<h3>Results from Web</h3>'+
			    '<div><div class="searchResultsParent"><ul class="searchResults"></ul></div></div>'+
			    '</div>'+
			    '<div id="lookup_alternate">'+
				    '<h3>Alternate Identifier</h3>'+
				    '<div>'+
					    '<div><input type="radio" name="altLookup" /><label for="search_name">Name</label><ins name="name" class="ui-icon ui-icon-help">&nbsp;</ins><br/><input type="text" name="name" id="search_name" /></div>'+
					    '<div><input type="radio" name="altLookup" /><label for="search_localid">Local Identifier</label><ins name="localid" class="ui-icon ui-icon-help">&nbsp;</ins><br/><input type="text" name="localid" id="search_localid" /></div>'+
					    '<div><input type="radio" name="altLookup" /><label for="search_uri">URI</label><ins name="uri" class="ui-icon ui-icon-help">&nbsp;</ins><br/><input type="text" name="uri" id="search_uri" /></div>'+
				    '</div>'+
			    '</div>'+
		    '</div>'+
	    '</div>'+
	    '<div id="certainty" style="position: absolute; bottom: 0; left: 10px; right: 10px; height: 65px;">'+
	    	'<p>This identification is:</p>'+
			'<input type="radio" id="c_definite" name="search_certainty" value="definite" /><label for="c_definite">Definite</label>'+
			'<input type="radio" id="c_reasonable" name="search_certainty" value="reasonable" /><label for="c_reasonable">Reasonably Certain</label>'+
			'<input type="radio" id="c_speculative" name="search_certainty" value="speculative" /><label for="c_speculative">Speculative</label>'+
	    '</div>'+
	'</div>');
	
	$('#lookup_alternate').hide();
	
	var search = $('#searchDialog');
	search.dialog({
		modal: true,
		resizable: false,
		dialogClass: 'splitButtons',
		closeOnEscape: false,
		open: function(event, ui) {
			$('#searchDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 550,
		width: 400,
		autoOpen: false
	});
	var searchInput = $('#search_query')[0];
	$(searchInput).bind('keyup', function() {
		doQuery();
	});
	
	$('#lookupServices').accordion({
		header: 'div > h3',
		heightStyle: 'fill',
		activate: function(event, ui) {
			if ($('#lookupServices').accordion('option', 'active') < 2) doQuery();
		}
	});
	
	$('#lookup_alternate ins').click(function() {
		var type = $(this).attr('name');
		var msg = '';
		if (type == 'name') {
			msg = 'Enter a first and last name, which will be encoded as a FOAF URN.';
		} else if (type == 'localid') {
			msg = 'Enter the local id that your system uses for this person. It will be encoded as an URN.';
		} else if (type == 'uri') {
			msg = 'Enter a resolvable URI that identifies this person, e.g. their VIAF URI, LOC URI, etc.';
		}
		w.dialogManager.show('message', {
			title: 'Help',
			msg: msg,
			modal: false
		});
	});
	$('#lookup_alternate input[type="text"]').focus(function() {
		$(this).prevAll('input').prop('checked', true);
	}).keyup(function() {
		$(this).css({borderColor: '#ccc'});
	});
	
	$('#certainty').buttonset();
	var doQuery = function() {
		var lookupService = $('#lookupServices div.ui-accordion-content-active').parent()[0].id.replace('lookup_', '');
		
		$('#lookupServices div.ui-accordion-content-active div.searchResultsParent').css({borderColor: '#fff'});
		
		$('#lookupServices div.ui-accordion-content-active ul').first().html('<li class="unselectable last"><span>Searching...</span></li>');
		
		var query = searchInput.value;
		
		w.delegator.lookupEntity({type: currentType, query: query, lookupService: lookupService}, handleResults);
	};
	var handleResults = function(results) {
		var formattedResults = '';
		var last = '';
		
		if (results == null) {
			$('#lookupServices div.ui-accordion-content-active div.searchResultsParent ul').first().html('<li class="unselectable last"><span>Server error.</span></li>');
		} else if (results.length == 0) {
			$('#lookupServices div.ui-accordion-content-active div.searchResultsParent ul').first().html('<li class="unselectable last"><span>No results.</span></li>');
		} else {
			var r, i, label;
			for (i = 0; i < results.length; i++) {
				r = results[i];
				label = r.name || r.identifier || r.term || r[currentType];
				if (i == results.length - 1) last = 'last';
				else last = '';
				
				formattedResults += '<li class="unselectable '+last+'">';
				formattedResults += '<span>'+label+'</span>';
				formattedResults += '</li>';
			}
			
			$('#lookupServices div.ui-accordion-content-active div.searchResultsParent ul').first().html(formattedResults);
			
			$('#lookupServices div.ui-accordion-content-active div.searchResultsParent ul li').each(function(index) {
				$(this).data(results[index]);
			});
			
			$('#lookupServices div.ui-accordion-content-active div.searchResultsParent ul li').click(function(event) {
				$('#lookupServices div.ui-accordion-content-active div.searchResultsParent').css({borderColor: '#fff'});
				var remove = $(this).hasClass('selected');
				$('#lookupServices div.ui-accordion-content-active ul li').removeClass('selected');
				if (!remove ) $(this).addClass('selected');
			});
			
			$('#lookupServices div.ui-accordion-content-active div.searchResultsParent ul li').dblclick(function(event) {
				$('#lookupServices div.ui-accordion-content-active ul li').removeClass('selected');
				$(this).addClass('selected');
				searchResult();
			});
		}
	};
	
	var searchResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			var lookupService = $('#lookupServices div.ui-accordion-content-active').parent()[0].id;
			if (lookupService == 'lookup_alternate') {
				var type = $('#lookup_alternate input[name="altLookup"]:checked');
				if (type.length == 1) {
					var value = type.nextAll('input').val();
					if (value == '') {
						$('#lookup_alternate input[type="text"]').css({borderColor: '#ccc'});
						type.nextAll('input').css({borderColor: 'red'});
						return false;
					} else {
						data = {
							type: 'alt_id',
							typeName: type.nextAll('input').attr('name'),
							value: value
						};
					}
				} else {
					$('#lookup_alternate input[type="text"]').css({borderColor: '#ccc'});
					$('#lookup_alternate input[name="altLookup"]').first().prop('checked', true).nextAll('input').css({borderColor: 'red'});
					return false;
				}
			} else {
				data = $('#lookupServices div.ui-accordion-content-active ul li.selected').data();
				if (data) {
					for (var key in data) {
						if (key.match(/jQuery/)) {
							delete data[key];
						}
					}
				} else {
					$('#lookupServices div.ui-accordion-content-active div.searchResultsParent').css({borderColor: 'red'});
					return false;
				}
			}
			if (data) data.certainty = $('#certainty input:checked').val();
		}
		if (mode == EDIT && data != null) {
			w.tagger.editEntity(currentId, data);
		} else {
			w.tagger.finalizeEntity(currentType, data);
		}
		search.dialog('close');
		currentType = null;
		currentId = null;
	};
	
	var createNew = function() {
		w.dialogManager.show('add'+currentType, {});
	};
	
	return {
		show: function(config) {
			currentType = config.type;
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Tag ';
			var query;
			if (mode == EDIT) {
				prefix = 'Edit ';
				currentId = config.entry.props.id;
				query = config.entry.props.content;
			} else {
				query = w.editor.currentBookmark.rng.toString();
			}
			
			$('#lookupServices div.searchResultsParent').css({borderColor: '#fff'}).children('ul').empty();
			
			$('#lookup_alternate input[type="text"]').css({borderColor: '#ccc'}).val('');
			
			searchInput.value = query;
			
			var title = prefix+config.title;
			search.dialog('option', 'title', title);
			search.dialog('option', 'buttons', [{
				text: 'Cancel',
				click: function() {
					searchResult(true);
				}
			},{
				text: 'Add New '+config.title,
				click: function() {
				  switch(config.type) {
            case 'place':
              window.open(cwrc_params.create_entity_callbacks.places);
              break;
            case 'person':
              window.open(cwrc_params.create_entity_callbacks.people);
              break;
            case 'event':
              window.open(cwrc_params.create_entity_callbacks.events);
              break;
            case 'org':
              window.open(cwrc_params.create_entity_callbacks.organizations);
              break;
				  }
				}
			},{
				text: 'Tag '+config.title,
				click: function() {
					searchResult();
				}
			}]);
			if (config.pos) {
				search.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				search.dialog('option', 'position', 'center');
			}
			search.dialog('open');
			
			$('#lookupServices').accordion('refresh');
			if (mode == EDIT) {
				$('#certainty input[value="'+config.entry.info.certainty+'"]').click();
				if (config.entry.info.type && config.entry.info.type == 'alt_id') {
					$('#lookupServices').accordion('option', 'active', 2);
					$('#lookup_alternate input[name="'+config.entry.info.typeName+'"]').val(config.entry.info.value).prevAll('input').click();
				} else {
					$('#lookupServices').accordion('option', 'active', 0);
				}
			} else {
				$('#c_definite').trigger('click');
				if ($('#lookupServices').accordion('option', 'active') == 0) {
					doQuery();
				} else {
					$('#lookupServices').accordion('option', 'active', 0);
				}
			}
		},
		hide: function() {
			search.dialog('close');
		}
	};
};

});