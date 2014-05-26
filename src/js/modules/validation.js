define(['jquery', 'jquery-ui'], function($, jqueryUi) {
	
return function(config) {
	
	var w = config.writer;
	
	$('#'+config.parentId).append('<div id="validation">'+
			'<button>Validate</button><button>Clear</button><ul class="validationList"></ul>'+
		'</div>');
	
	w.event('documentLoaded').subscribe(function() {
		validation.clearResult();
	});
	
	w.event('documentValidated').subscribe(function(valid, resultDoc, docString) {
		validation.showValidationResult(resultDoc, docString);
	});
	
	var validation = {};
	
	/**
	 * Processes a validation response from the server.
	 * @memberOf validation
	 * @param resultDoc The actual response
	 * @param docString The doc string sent to the server for validation  
	 */
	validation.showValidationResult = function(resultDoc, docString) {
		var list = $('#validation > ul');
		list.empty();
		
		docString = docString.split('\n')[1]; // remove the xml header
		
		var status = $('status', resultDoc).text();
		
		if (status == 'pass') {
			list.append(''+
				'<li class="ui-state-default">'+
					'<span class="ui-icon ui-icon-check" style="float: left; margin-right: 4px;"></span>Your document is valid!'+
				'</li>');
		}
		
		$('warning', resultDoc).each(function(index, el) {
			var id = '';
			
			var type = el.nodeName;
			var message = $(this).find('message').text();
			var path = $(this).find('path').text();
			var elementId = $(this).find('elementId').text();
			var column = parseInt($(this).find('column').text());
			
			if (elementId != '') {
				id = elementId;
			} else if (!isNaN(column)) {
				var docSubstring = docString.substring(0, column);
				var tags = docSubstring.match(/<.*?>/g);
				if (tags != null) {
					var tag = tags[tags.length-1];
					id = tag.match(/id="(.*?)"/i);
					if (id == null) {
						if (message.search('text not allowed here') != -1) {
							// find the parent tag
							var level = 0;
							for (var i = tags.length-1; i > -1; i--) {
								tag = tags[i];
								if (tag.search('/') != -1) {
									level++; // closing tag, add a level
								} else {
									level--; // opening tag, remove a level
								}
								if (level == -1) {
									var match = tag.match(/id="(.*?)"/i);
									if (match != null && match[1]) id = match[1];
									break;
								}
							}
						} else {
							var tagMatch = tag.match(/<\/(.*)>/);
							if (tagMatch != null) {
								// it's and end tag, so find the matching start tag
								var tagName = tagMatch[1];
								for (var i = tags.length-1; i > -1; i--) {
									tag = tags[i];
									var startTagName = tag.match(/<(.*?)\s/);
									if (startTagName != null && startTagName[1] == tagName) {
										id = tag.match(/id="(.*?)"/i)[1];
										break;
									}
								}
							} else {
								// probably entity tag
							}
						}
					} else {
						id = id[1];
					}
				} else {
					// can't find any tags!
				}
			}
			
			var messageParts;
			var messageDivLoc = message.indexOf(';');
			if (messageDivLoc != -1) {
				messageParts = [message.slice(0, messageDivLoc+1), message.slice(messageDivLoc+2)];
			} else {
				messageParts = [message];
			}
			
			var messageHtml = '<li class="'+(type=='warning'?'ui-state-error':'ui-state-highlight')+'">'+
				'<span class="ui-icon '+(type=='warning'?'ui-icon-alert':'ui-icon-info')+'" style="float: left; margin-right: 4px;"></span>'+
				'Path: '+path+'<br/>'+
				'Message: '+messageParts[0];
			if (messageParts[1] !== undefined) {
				messageHtml += ' <span class="message_more">more...</span><span style="display: none;">'+messageParts[1]+'</span>';
			}
			messageHtml += '</li>';
			
			var item = list.append(messageHtml).find('li:last');
			item.find('[class="message_more"]').click(function() {
				$(this).next('span').show();
				$(this).hide();
			});
			
			item.data('id', id);
		});
		
		list.find('li').click(function() {
			var id = $(this).data('id');
			if (id) {
				w.selectStructureTag(id);
			}
		});
		
		w.layout.center.children.layout1.open('south');
		$('#southTabs').tabs('option', 'active', 0);
	};
	
	validation.clearResult = function() {
		$('#validation > ul').empty();
	};
	

	$('#validation button:eq(0)').button().click(function() {
		w.delegator.validate();
	});
	$('#validation button:eq(1)').button().click(function() {
		validation.clearResult();
	});
	
	// add to writer
	w.validation = validation;
	
	return validation;
};

});