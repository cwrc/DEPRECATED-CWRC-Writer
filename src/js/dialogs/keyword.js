define(['jquery', 'jquery-ui', 'jquery.watermark'], function($, jqueryUi) {
	
return function(writer) {
	var w = writer;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	$(document.body).append(''+
	'<div id="keywordDialog">'+
		'<div id="keywordRowsParent">'+
		'</div>'+
	'</div>');
	
	function addRow(prevRow) {
		var newRow;
		// TODO add handling for multiple keywords, currently broken when loading a document
		var html = '<div class="keywordRow"><input type="text" value="" />';//<button class="add">Add Keyword</button>';
		if (prevRow == null) {
			html += '</div>';
			newRow = $('#keywordRowsParent').append(html).find('.keywordRow');
		} else {
			html += '<button class="remove">Remove This Keyword</button></div>';
			prevRow.after(html);
			newRow = prevRow.next();
		}
		newRow.find('button:first').button({
			icons: {primary: 'ui-icon-plusthick'},
			text: false
		}).click(function() {
			addRow($(this).parent());
		}).next('button').button({
			icons: {primary: 'ui-icon-minusthick'},
			text: false
		}).click(function() {
			removeRow($(this).parent());
		});
		newRow.find('input').watermark('Keyword');
		return newRow;
	}
	
	function removeRow(row) {
		row.remove();
	}
	
	var keyword = $('#keywordDialog');
	keyword.dialog({
		modal: true,
		resizable: true,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#keywordDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 200,
		width: 275,
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
	
	var keywordResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			data = {
				keywords: []
			};
			$('#keywordDialog .keywordRow').each(function(index, el) {
				var keyword = $('input', el).val();
				data.keywords.push(keyword);
			});
		}
		if (mode == EDIT && data != null) {
			w.tagger.editEntity(w.editor.currentEntity, data);
		} else {
			w.tagger.finalizeEntity('keyword', data);
		}
		keyword.dialog('close');
	};
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Add ';
			
			var title = prefix+config.title;
			keyword.dialog('option', 'title', title);
			if (config.pos) {
				keyword.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				keyword.dialog('option', 'position', 'center');
			}
			
			var keywordsParent = $('#keywordRowsParent');
			keywordsParent.find('.keywordRow').remove();
			if (mode == ADD) {
				addRow();
			} else {
				var data = config.entry.info;
				var prevRow = null;
				$.each(data.keywords, function(index, val) {
					var row = addRow(prevRow);
					row.find('input').val(val);
					prevRow = row;
				});
			}
			
			keyword.dialog('open');
		},
		hide: function() {
			keyword.dialog('close');
		}
	};
};

});