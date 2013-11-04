var TitleDialog = function(config) {
	var w = config.writer;
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	$(document.body).append(''+
	'<div id="titleDialog">'+
		'<div>'+
			'Type<br/>'+
			'<input type="radio" value="a" name="level" id="level_a"/><label for="level_a">Analytic <span style="font-size: 8px;">(article, poem, or other item published as part of a larger item)</span></label><br/>'+
			'<input type="radio" value="m" name="level" id="level_m" checked="checked"/><label for="level_m">Monographic <span style="font-size: 8px;">(book, collection, single volume, or other item published as a distinct item)</span></label><br/>'+
			'<input type="radio" value="j" name="level" id="level_j"/><label for="level_j">Journal <span style="font-size: 8px;">(magazine, newspaper or other periodical publication)</span></label><br/>'+
			'<input type="radio" value="s" name="level" id="level_s"/><label for="level_s">Series <span style="font-size: 8px;">(book, radio, or other series)</span></label><br/>'+
			'<input type="radio" value="u" name="level" id="level_u"/><label for="level_u">Unpublished <span style="font-size: 8px;">(thesis, manuscript, letters or other unpublished material)</span></label><br/>'+
		'</div>'+
		'<div>'+
			'Equivalent title (optional) <input name="alt" type="text" /> <span style="font-size: 8px;">(standard form of title)</span>'+
		'</div>'+
		'<div>'+
			'Refer to text (optional) <input name="ref" type="text" />'+
		'</div>'+
		'<div>'+
			'<input type="checkbox" name="unformatted" id="unformatted"/>'+
			'<label for="unformatted">Unformatted</label>'+
		'</div>'+
		'<div><b>NB</b>: This popup is not yet functional. Eventually it will let you look up the text to which you want to refer, or to add an entry for a new text.</div>'+
	'</div>');
	
	var title = $('#titleDialog');
	title.dialog({
		modal: true,
		resizable: false,
		closeOnEscape: false,
		open: function(event, ui) {
			$('#titleDialog').parent().find('.ui-dialog-titlebar-close').hide();
		},
		height: 355,
		width: 435,
		autoOpen: false,
		buttons: {
			'Tag Text/Title': function() {
				titleResult();
			},
			'Cancel': function() {
				titleResult(true);
			}
		}
	});
	
	$('#titleDialog input').keyup(function(event) {
		if (event.keyCode == '13') {
			event.preventDefault();
			titleResult();
		}
	});
	
	var titleResult = function(cancelled) {
		var data = null;
		if (!cancelled) {
			var level = $('input[name="level"]:checked', title).val();
			var ref = $('input[name="ref"]', title).val();
			var alt = $('input[name="alt"]', title).val();
			var unformatted = $('input[name="unformatted"]', title).prop('checked');
			
			data = {
				level: level,
				ref: ref,
				alt: alt,
				unformatted: unformatted
			};
			
//			if (level == 'a' || level == 'u') {
//				data['class'] = 'titleTagQuotes';
//			} else if (level == 'm' || level == 'j' || level == 's') {
//				data['class'] = 'titleTagItalics';
//			}
		}
		if (mode == EDIT && data != null) {
			w.editEntity(w.editor.currentEntity, data);
		} else {
			w.finalizeEntity('title', data);
		}
		title.dialog('close');
	};
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			var prefix = 'Tag ';
			
			if (mode == ADD) {
				$('input[value="m"]', title).attr('checked', true);
				$('input[name="ref"]', title).attr('value', '');
				$('input[name="alt"]', title).attr('value', '');
				$('input[name="unformatted"]', title).attr('checked', false);
			} else {
				prefix = 'Edit ';
				var level = config.entry.info.level;
				var ref = config.entry.info.ref;
				var alt = config.entry.info.alt;
				var unformatted = config.entry.info.unformatted;
				
				$('input[value="'+level+'"]', title).attr('checked', true);
				$('input[name="ref"]', title).attr('value', ref);
				$('input[name="alt"]', title).attr('value', alt);
				$('input[name="unformatted"]', title).attr('checked', unformatted);
			}
			
			var t = prefix+config.title;
			title.dialog('option', 'title', t);
			if (config.pos) {
				title.dialog('option', 'position', [config.pos.x, config.pos.y]);
			} else {
				title.dialog('option', 'position', 'center');
			}
			title.dialog('open');
		},
		hide: function() {
			title.dialog('close');
		}
	};
};