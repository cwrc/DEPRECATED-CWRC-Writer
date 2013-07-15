function Delegator(config) {
	var w = config.writer;
	
	var del = {};
	
	del.lookupEntity = function(params, callback) {
		var type = params.type;
		var query = params.query;
		var lookupService = params.lookupService;
		
		if (lookupService == 'project') {
			$.ajax({
				url: cwrc_params.authority_url + type + '/' + query,
				dataType: 'text json',
				success: function(data, status, xhr) {
					if ($.isPlainObject(data)) data = [data];
					if (data != null) {
						callback.call(w, data);
					} else {
						callback.call(w, []);
					}
				},
				error: function(xhr, status, error) {
					if (status == 'parsererror') {
						var lines = xhr.responseText.split(/\n/);
						if (lines[lines.length-1] == '') {
							lines.pop();
						}
						var string = lines.join(',');
						var data = $.parseJSON('['+string+']');
						callback.call(w, data);
					} else {
						callback.call(w, null);
					}
				}
			});
		} else if (lookupService == 'viaf') {
			$.ajax({
				url: 'http://viaf.org/viaf/AutoSuggest',
				data: {
					query: query
				},
				dataType: 'jsonp',
				success: function(data, status, xhr) {
					if (data != null && data.result != null) {
						callback.call(w, data.result);
					} else {
						callback.call(w, []);
					}
				},
				error: function() {
					callback.call(w, null);
				}
			});
		}
	};
	
	del.validate = function(callback) {
		var docText = w.fm.getDocumentContent(false);
		$.ajax({
			url: w.baseUrl+'services/validator/validate.html',
			type: 'POST',
			dataType: 'XML',
			data: {
				sch: 'http://cwrc.ca/'+w.validationSchema,
				type: 'RNG_XML',
				content: docText
			},
			success: function(data, status, xhr) {
				if (callback) {
					var valid = $('status', data).text() == 'pass';
					callback(valid);
				} else {
					w.validation.showValidationResult(data, docText);
				}
			},
			error: function() {
//				 $.ajax({
//					url : 'xml/validation.xml',
//					success : function(data, status, xhr) {
//						if (callback) {
//							var valid = $('status', data).text() == 'pass';
//							callback(valid);
//						} else {
//							w.validation.showValidationResult(data, docText);
//						}
//					}
//				}); 
				w.dialogs.show('message', {
					title: 'Error',
					msg: 'An error occurred while trying to validate the document.',
					type: 'error'
				});
			}
		});
	};
	
	del.getHelp = function(tagName) {
		return w.u.getDocumentationForTag(tagName);
	};
	
	del.annoAdded = function(rdf) {
		
	};
	
	del.annoUpdated = function(rdf) {
		
	};
	
	return del;
};