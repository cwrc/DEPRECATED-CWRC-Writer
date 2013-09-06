var KeywordDialog = function(config) {
	var w = config.writer;
	
	var currentType = null;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	$(document.body).append(''+
	'<div id="keywordDialog">'+
		'<div id="keyword_choice">'+
			'<div id="keyword_key">'+
			    '<h3>Keyword</h3>'+
			    '<div><label for="keyword_input">Keyword</label><input type="text" id="keyword_input" /></div>'+
		    '</div>'+
		    '<div id="keyword_index">'+
			    '<h3>Index Term</h3>'+
			    '<div>'+
				    '<label for="keyword_lookup">OCLC Lookup</label><input type="text" id="keyword_lookup" />'+
				    '<ul class="searchResults" style="overflow: auto; border: 1px solid #fff;"></ul>'+
			    '</div>'+
			'</div>'+
		'</div>'+
	'</div>');
	
	$('#keyword_choice').accordion({
		header: 'div > h3',
		heightStyle: 'fill'
	});
	
	var keyword = $('#keywordDialog');
	keyword.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#keywordDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 400,
		width: 400,
		autoOpen: false,
		buttons: {
			'Tag Keyword': function() {
				keywordResult();
			},
			'Cancel': function() {
				keywordResult(true);
			}
		}
	});
	
	$('#keyword_lookup').keyup(function() {
		var query = 'oclcts.preferredTerm="'+$(this).val()+'"';
		$.ajax({
			url: w.baseUrl+'services/ts-oclc/lcsh/',
			data: {
				query: query,
				version: '1.1',
				operation: 'searchRetrieve',
				recordSchema: 'http://www.w3.org/2004/02/skos/core',
				recordPacking: 'xml',
				maximumRecords: '15',
				startRecord: '1'
			},
			type: 'GET',
			dataType: 'xml',
			success: function(data, status, xhr) {
				var records = $('record', data);
				showResults(records);
			},
			error: function(xhr, status, error) {
				alert(error);
			}
		});
	});
	
	var showResults = function(records) {
		var list = $('#keyword_index ul');
		list.empty();
		if (records.length == 0) {
			list.html('<li class="unselectable last"><span>No results.</span></li>');
		} else {
			var ids = [];
			var types = [];
			var liString = '';
			records.each(function(index, el) {
				var label = $('skos\\:prefLabel, prefLabel', el).text();
				var id = $('dct\\:identifier, identifier', el).first().text();
				var type = $('dct\\:type, type', el).last().text();
				var last = '';
				if (index == records.length -1) last = 'last';
				ids.push(id);
				types.push(type);
				liString += '<li class="unselectable '+last+'"><span>'+label+'</span></li>';
			});
			
			list.html(liString);
			$('li', list).each(function(index, el) {
				$(this).data('id', ids[index]);
				$(this).data('type', types[index]);
				$(this).data('title', $(this).text());
			});
			
			$('li', list).click(function(event) {
				list.css({borderColor: '#fff'});
				var remove = $(this).hasClass('selected');
				$('li', list).removeClass('selected');
				if (!remove ) $(this).addClass('selected');
			});
			
			$('li', list).dblclick(function(event) {
				$('li', list).removeClass('selected');
				$(this).addClass('selected');
				keywordResult();
			});
		}
		var height = list.parents('div.ui-accordion-content').height();
		list.height(height - 20);
	};
	
	var keywordResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			var tab = $('#keywordDialog div.ui-accordion-content-active').parent()[0].id;
			if (tab == 'keyword_key') {
				data = {
					type: 'keyword',
					keyword: $('#keyword_input').val()
				};
			} else {
				data = $('#keywordDialog div.ui-accordion-content-active ul li.selected').data();
				if (data) {
					for (var key in data) {
						if (key.match(/jQuery/)) {
							delete data[key];
						}
					}
				} else {
					$('#keywordDialog div.ui-accordion-content-active ul').css({borderColor: 'red'});
					return false;
				}
				data.lookup = $('#keyword_lookup').val();
				data.type = 'lookup';
			}
		}
		if (mode == EDIT && data != null) {
			w.editEntity(w.editor.currentEntity, data);
		} else {
			w.finalizeEntity(currentType, data);
		}
		keyword.dialog('close');
		currentType = null;
	};
	
	return {
		show: function(config) {
			currentType = config.type;
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Add ';
			
			var title = prefix+config.title;
			keyword.dialog('option', 'title', title);
			if (config.pos) {
				keyword.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				keyword.dialog('option', 'position', 'center');
			}
			keyword.dialog('open');
			
			$('#keyword_input').val('');
			$('#keyword_lookup').val('');
			$('#keyword_index ul').css({borderColor: '#fff'}).empty();
			$('#keyword_choice').accordion('refresh');
			if (mode == ADD) {
				$('#keyword_choice').accordion('option', 'active', 0);
			} else {
				prefix = 'Edit ';
				if (config.entry.info.type == 'keyword') {
					$('#keyword_choice').accordion('option', 'active', 0);
					$('#keyword_input').val(config.entry.info.keyword);
				} else {
					$('#keyword_choice').accordion('option', 'active', 1);
					$('#keyword_lookup').val(config.entry.info.lookup);
				}
			}
		},
		hide: function() {
			keyword.dialog('close');
		}
	};
};