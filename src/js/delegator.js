define(['jquery'], function($) {
	
return function(writer) {
	var w = writer;
	
	var del = {};
	
	/**
	 * @memberOf del
	 * @param params
	 * @param callback
	 */
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
			var queryPrefix = '';
			var querySuffix = '"';
			var specificQuery = '';
			if (type) {
				switch (type) {
					case 'person':
						queryPrefix += 'local.personalNames+all+"';
						break;
					case 'place':
						queryPrefix += 'local.geographicNames+all+"';
						break;
					case 'org':
						queryPrefix += 'local.corporateNames+all+"';
						break;
					default:
						queryPrefix += 'cql.any+all+"';
				}
				specificQuery = queryPrefix + encodeURIComponent(query) + querySuffix;
			} else {
				specificQuery = encodeURIComponent(query);
			}
			$.ajax({
				url: w.baseUrl+'services/viaf/search',
				data: {
					query: specificQuery,
					httpAccept: 'text/xml'
				},
				dataType: 'xml',
				success: function(data, status, xhr) {
					var processed = [];
					$('searchRetrieveResponse record', data).each(function(index, el) {
						var mainEl = $('mainHeadingEl', el).first();
						var name = $('subfield[code="a"]', mainEl).text();
						var date = $('subfield[code="d"]', mainEl).text();
						var gender = $('gender', el).text();
						switch (gender) {
							case 'a':
								gender = 'f';
								break;
							case 'b':
								gender = 'm';
								break;
							default:
								gender = 'u';
						}
						processed.push({
							name: name,
							date: date,
							gender: gender
						});
					});
					callback.call(w, processed);
				},
				error: function() {
					$.ajax({
						url: 'http://viaf.org/viaf/AutoSuggest',
						data: {
							query: query
						},
						dataType: 'jsonp',
						success: function(data, status, xhr) {
							if (data != null && data.result != null) {
								var processed = $.map(data.result, function(val, index) {
									return {name: val.term};
								});
								callback.call(w, processed);
							} else {
								callback.call(w, []);
							}
						},
						error: function() {
							callback.call(w, null);
						}
					});
				}
			});
		} else if (lookupService == 'geonames') {
			$.ajax({
					url: 'http://ws.geonames.org/searchJSON',
					data: {
						q: encodeURIComponent(query),
						maxRows: 25,
						username: 'cwrcwriter'
					},
					dataType: 'json',
					success: function(data, status, xhr) {
						callback.call(w, data.geonames);
					}
			});
		}
	};
	
	/**
	 * Gets the URI for the entity
	 * @param {Object} entity The entity object
	 * @returns {Promise} The promise object
	 */
	del.getUriForEntity = function(entity) {
		var guid = createGuid();
		var uri = 'http://id.cwrc.ca/'+entity.props.type+'/'+guid;
		var dfd = new $.Deferred();
		dfd.resolve(uri);
		return dfd.promise();
	};
	
	/**
	 * Gets the URI for the annotation
	 * @param {Object} entity The entity object
	 * @returns {Promise} The promise object
	 */
	del.getUriForAnnotation = function() {
		var guid = createGuid();
		var uri = 'http://id.cwrc.ca/annotation/'+guid;
		var dfd = new $.Deferred();
		dfd.resolve(uri);
		return dfd.promise();
	};
	
	/**
	 * Gets the URI for the document
	 * @param {Object} entity The entity object
	 * @returns {Promise} The promise object
	 */
	del.getUriForDocument = function() {
		var guid = createGuid();
		var uri = 'http://id.cwrc.ca/doc/'+guid;
		var dfd = new $.Deferred();
		dfd.resolve(uri);
		return dfd.promise();
	};
	
	/**
	 * Gets the URI for the selector
	 * @param {Object} entity The entity object
	 * @returns {Promise} The promise object
	 */
	del.getUriForSelector = function() {
		var guid = createGuid();
		var uri = 'http://id.cwrc.ca/selector/'+guid;
		var dfd = new $.Deferred();
		dfd.resolve(uri);
		return dfd.promise();
	};
	
	/**
	 * Gets the URI for the user
	 * @param {Object} entity The entity object
	 * @returns {Promise} The promise object
	 */
	del.getUriForUser = function() {
		var guid = createGuid();
		var uri = 'http://id.cwrc.ca/user/'+guid;
		var dfd = new $.Deferred();
		dfd.resolve(uri);
		return dfd.promise();
	};
	
	function createGuid() {
	    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
	        return v.toString(16);
	    });
	}
	
	del.validate = function(callback) {
		var docText = w.converter.getDocumentContent(false);
		var schemaUrl = w.schemaManager.schemas[w.schemaManager.schemaId].url;
		
		$.ajax({
			url: w.baseUrl+'services/validator/validate.html',
			type: 'POST',
			dataType: 'xml',
			data: {
				sch: schemaUrl,
				type: 'RNG_XML',
				content: docText
			},
			success: function(data, status, xhr) {
				var valid = $('status', data).text() == 'pass';
				if (callback) {
					callback.call(w, valid);
				} else {
					w.event('documentValidated').publish(valid, data, docText);
				}
			},
			error: function() {
				if (callback) {
					callback.call(w, null);
				} else {
					w.dialogManager.show('message', {
						title: 'Error',
						msg: 'An error occurred while trying to validate the document.',
						type: 'error'
					});
				}
			}
		});
	};
	
	/**
	 * Loads a document based on the currentDocId
	 * TODO Move currentDocId system out of CWRCWriter
	 * @param docName
	 */
	del.loadDocument = function(callback) {
		$.ajax({
			url: w.baseUrl+'editor/documents/'+w.currentDocId,
			type: 'GET',
			success: function(doc, status, xhr) {
				window.location.hash = '#'+w.currentDocId;
				callback.call(w, doc);
			},
			error: function(xhr, status, error) {
				w.dialogManager.show('message', {
					title: 'Error',
					msg: 'An error ('+status+') occurred and '+w.currentDocId+' was not loaded.',
					type: 'error'
				});
				w.currentDocId = null;
			},
			dataType: 'xml'
		});
	};
	
	/**
	 * Performs the server call to save the document.
	 * @param callback Called with one boolean parameter: true for successful save, false otherwise
	 */
	del.saveDocument = function(callback) {
		var docText = w.converter.getDocumentContent(true);
		$.ajax({
			url : w.baseUrl+'editor/documents/'+w.currentDocId,
			type: 'PUT',
			dataType: 'json',
			data: docText,
			success: function(data, status, xhr) {
				w.editor.isNotDirty = 1; // force clean state
				w.dialogManager.show('message', {
					title: 'Document Saved',
					msg: w.currentDocId+' was saved successfully.'
				});
				window.location.hash = '#'+w.currentDocId;
				if (callback) {
					callback.call(w, true);
				}
				
				w.event('documentSaved').publish();
			},
			error: function() {
				w.dialogManager.show('message', {
					title: 'Error',
					msg: 'An error occurred and '+w.currentDocId+' was not saved.',
					type: 'error'
				});
				if (callback) {
					callback.call(w, false);
				}
			}
		});
	};
	
	del.getHelp = function(tagName) {
		return w.utilities.getDocumentationForTag(tagName);
	};
	
	return del;
};

});