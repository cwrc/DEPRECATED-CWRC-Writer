function Selection(config) {
	
	var w = config.writer;
	
	$(config.parentId).append('<div id="selection" style="margin-left: 10px;"></div>');
	$(document.body).append('<div id="selectionContents" style="display: none;"></div>');
	
	var selection = {};
	
	function updateSelection(ed, evt) {
		var range = ed.selection.getRng(true);
		var contents = range.cloneContents();
		$('#selectionContents').html(contents);
		var html = '<pre>'+w.u.escapeHTMLString($('#selectionContents')[0].innerHTML)+'</pre>';
		$('#selection').html(html);
		$('#selection > pre').snippet('html', {
			style: 'typical',
			transparent: true,
			showNum: false,
			menu: false
		});
	}
	
	selection.init = function() {
		w.editor.onKeyDown.add(updateSelection);
		w.editor.onKeyUp.add(updateSelection);
		w.editor.onMouseUp.add(updateSelection);
		w.editor.onNodeChange.add(updateSelection);
	};
	
	return selection;
}