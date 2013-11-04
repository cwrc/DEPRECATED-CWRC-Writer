var MessageDialog = function(config) {
	var w = config.writer;
	
	$(document.body).append(''+
	'<div id="messageDialog">'+
	    '<p>'+
	    '<span class="ui-state-highlight" style="border: none;"><span style="float: left; margin-right: 4px;" class="ui-icon ui-icon-info"></span></span>'+
	    '<span class="ui-state-error" style="border: none;"><span style="float: left; margin-right: 4px;" class="ui-icon ui-icon-alert"></span></span>'+
	    '<span class="message"></span>'+
	    '</p>'+
	'</div>');
	
	var message = $('#messageDialog');
	message.dialog({
		modal: true,
		resizable: true,
		closeOnEscape: true,
		height: 250,
		width: 300,
		autoOpen: false
	});
	
	return {
		show: function(config) {
			var title = config.title;
			var msg = config.msg;
			var modal = config.modal == null ? true : config.modal;
			var type = config.type;
			
			$('#messageDialog > p > span[class^=ui-state]').hide();
			if (type == 'info') {
				$('#messageDialog > p > span[class=ui-state-highlight]').show();
			} else if (type == 'error') {
				$('#messageDialog > p > span[class=ui-state-error]').show();
			}
			
			message.dialog('option', 'title', title);
			message.dialog('option', 'modal', modal);
			message.dialog('option', 'buttons', {
				'Ok': function() {
					message.dialog('close');
				}
			});
			$('#messageDialog > p > span[class=message]').html(msg);
			
			message.dialog('open');
		},
		confirm: function(config) {
			var title = config.title;
			var msg = config.msg;
			var callback = config.callback;
			
			$('#messageDialog > p > span[class^=ui-state]').hide();
			
			message.dialog('option', 'title', title);
			message.dialog('option', 'buttons', {
				'Yes': function() {
					callback(true);
					message.dialog('close');
				},
				'No': function() {
					callback(false);
					message.dialog('close');
				}
			});
			$('#messageDialog > p > span[class=message]').html(msg);
			
			message.dialog('open');
		},
		hide: function() {
			message.dialog('close');
		}
	};
};