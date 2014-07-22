define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogs) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer) {
	var w = writer;
	
	function createNewTitle(data) {
		cD.popEditTitle({
			success: function(result) {
				if (result.data == null) {
					var error = result.error || 'There was an error creating the entry.';
					w.dialogManager.show('message', {
						title: 'Error',
						msg: error,
						type: 'error'
					});
				} else {
					result = {
						id: 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/'+result.response.pid
					};
					w.dialogManager.show('tagCitation', {
						cwrcInfo: result
					});
				}
			},
			error: function(errorThrown) {
			},
		});
	}
	
	return {
		show: function(config) {
			if (config.entry) {
				w.dialogManager.show('tagCitation', {
					entry: config.entry
				});
			} else {
				var query = w.editor.currentBookmark.rng.toString();
				
				cD.popSearchTitle({
					query: query,
					success: function(result) {
						if (result.id == null) {
							result = {
								id: w.utilities.createGuid(),
								name: ['Test Citation'],
								repository: 'cwrc'
							};
						}
						
						if (result.repository === 'viaf') {
							result.id = 'http://viaf.org/viaf/'+result.id;
						} else {
							result.id = 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/'+result.id;
						}
						
						if ($.isArray(result.name)) {
							result.name = result.name[0];
						}
						
						delete result.data;
						
						w.dialogManager.show('tagCitation', {
							query: query,
							cwrcInfo: result
						});
					},
					error: function(errorThrown) {
					},
					buttons: [{
						label : 'Edit',
						action : createNewTitle
					}]
				});
			}
		},
		hide: function() {
		}
	};
};

});