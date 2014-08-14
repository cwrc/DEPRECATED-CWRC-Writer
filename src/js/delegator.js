define(['jquery', 'octokit'], function($, Octokit) {

/**
 * @class Delegator
 * @param {Writer} writer
 */
return function(writer) {
	var w = writer;
	
	/**
	 * @lends Delegator.prototype
	 */
	var del = {};
	
	/**
	 * Lookup an entity
	 * @deprecated Superseded by CWRC-Dialogs
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
					case 'title':
						queryPrefix += 'local.uniformTitleWorks+all+"';
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
		var guid = w.utilities.createGuid();
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
		var guid = w.utilities.createGuid();
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
		var guid = w.utilities.createGuid();
		var uri = 'http://id.cwrc.ca/doc/'+guid;
		var dfd = new $.Deferred();
		dfd.resolve(uri);
		return dfd.promise();
	};
	
	/**
	 * Gets the URI for the target
	 * @param {Object} entity The entity object
	 * @returns {Promise} The promise object
	 */
	del.getUriForTarget = function() {
		var guid = w.utilities.createGuid();
		var uri = 'http://id.cwrc.ca/target/'+guid;
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
		var guid = w.utilities.createGuid();
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
		var guid = w.utilities.createGuid();
		var uri = 'http://id.cwrc.ca/user/'+guid;
		var dfd = new $.Deferred();
		dfd.resolve(uri);
		return dfd.promise();
	};
	
	/**
	 * Validate the document against the current schema
	 * @fires Writer#validationInitiated
	 * @fires Writer#documentValidated
	 * @param {Delegator~validateCallback} callback
	 */
	del.validate = function(callback) {
		var docText = w.converter.getDocumentContent(false);
		var schemaUrl = w.schemaManager.schemas[w.schemaManager.schemaId].url;
		
		w.event('validationInitiated').publish();
		
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
				w.event('documentValidated').publish(valid, data, docText);
				if (callback) {
					callback.call(w, valid);
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
	 * @callback Delegator~validateCallback
	 * @param {Boolean} isValid
	 */
	
	function _getTemplateBranch() {
		var octo = new Octokit({token: '15286e8222a7bc13504996e8b451d82be1cba397'});
		var templateRepo = octo.getRepo('cwrc', 'CWRC-Writer-Templates');
		var branch = templateRepo.getBranch('master');
		return branch;
	}
	
	/**
	 * Gets the list of templates
	 * @param {Delegator~getTemplatesCallback} callback
	 */
	del.getTemplates = function(callback) {
		var branch = _getTemplateBranch();
		branch.contents('templates').then(function(contents) {
			contents = $.parseJSON(contents);
			var templates = [];
			for (var i = 0; i < contents.length; i++) {
				var c = contents[i];
				var path = c.path;
				var name = c.name;
				name = name.replace(/_/g, ' ').replace('.xml', '');
				name = w.utilities.getCamelCase(name);
				templates.push({name: name, path: path});
			}
			callback.call(w, templates);
		});
	};
	
	/**
	 * @callback Delegator~getTemplatesCallback
	 * @param {Array} templates The list of templates
	 * @property {String} name The template name
	 * @property {String} path The path to the template, relative to the parent branch
	 * 
	 */
	
	/**
	 * Loads a template
	 * @param {String} path The path to the template, relative to the templates repo
	 * @param {Delegator~loadTemplateCallback} callback
	 */
	del.loadTemplate = function(path, callback) {
		var branch = _getTemplateBranch();
		branch.contents(path).then(function(template) {
			path = path.replace('.xml', '');
			window.location.hash = '#'+path;
			var xml = $.parseXML(template);
			callback.call(w, xml);
		});
	};
	
	/**
	 * @callback Delegator~loadTemplateCallback
	 * @param {Document} The template document
	 */
	
	/**
	 * Loads a document
	 * @param {String} docId The document ID
	 * @param {Delegator~loadDocumentCallback} callback
	 */
	del.loadDocument = function(docId, callback) {
		$.ajax({
			url: w.baseUrl+'editor/documents/'+docId,
			type: 'GET',
			success: function(doc, status, xhr) {
				window.location.hash = '#'+docId;
				callback.call(w, doc);
			},
			error: function(xhr, status, error) {
				w.dialogManager.show('message', {
					title: 'Error',
					msg: 'An error ('+status+') occurred and '+docId+' was not loaded.',
					type: 'error'
				});
				callback.call(w, null);
			},
			dataType: 'xml'
		});
	};
	
	/**
	 * @callback Delegator~loadDocumentCallback
	 * @param {(Document|null)} document Returns the document or null if there was an error
	 */
	
	/**
	 * Performs the server call to save the document.
	 * @fires Writer#documentSaved
	 * @param {String} docId The document ID
	 * @param {Delegator~saveDocumentCallback} callback
	 */
	del.saveDocument = function(docId, callback) {
		var docText = w.converter.getDocumentContent(true);
		$.ajax({
			url : w.baseUrl+'editor/documents/'+docId,
			type: 'PUT',
			dataType: 'json',
			data: docText,
			success: function(data, status, xhr) {
				w.editor.isNotDirty = 1; // force clean state
				w.dialogManager.show('message', {
					title: 'Document Saved',
					msg: docId+' was saved successfully.'
				});
				window.location.hash = '#'+docId;
				if (callback) {
					callback.call(w, true);
				}
				
				w.event('documentSaved').publish();
			},
			error: function() {
				w.dialogManager.show('message', {
					title: 'Error',
					msg: 'An error occurred and '+docId+' was not saved.',
					type: 'error'
				});
				if (callback) {
					callback.call(w, false);
				}
			}
		});
	};
	
	/**
	 * @callback Delegator~saveDocumentCallback
	 * @param {Boolean} savedSuccessfully
	 */
	
	del.getHelp = function(tagName) {
		return w.utilities.getDocumentationForTag(tagName);
	};
	
	return del;
};

});