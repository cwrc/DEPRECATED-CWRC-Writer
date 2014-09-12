define(['jquery', 'jquery-ui', 'dialogForm'], function($, jqueryUi, DialogForm) {
	
return function(writer) {
	var w = writer;
	
	var id = 'link';
	
	var html = ''+
	'<div id="'+id+'Dialog">'+
		'<div>'+
			'<label for="'+id+'_input">HTTP Link</label>'+
			'<input type="text" id="'+id+'_input" data-type="textbox" data-mapping="url" style="margin-right: 10px;"/>'+
			'<button>Check Link</button>'+
		'</div>'+
	'</div>';
	
	var dialog = new DialogForm({
		writer: w,
		id: id,
		width: 345,
		height: 125,
		type: 'link',
		title: 'Tag Link',
		html: html
	});
	
	$('#'+id+'Dialog button').button().click(function() {
		var src = $('#'+id+'_input').val();
		if (src != '') {
			if (src.match(/^https?:\/\//) == null) {
				src = 'http://'+src;
			}
			try {
				window.open(src, 'linkTestWindow');
			} catch(e) {
				alert(e);
			}
		}
	});
	
	return {
		show: function(config) {
			dialog.show(config);
		}
	};
};

});