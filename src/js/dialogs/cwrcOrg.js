define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogs) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer) {
	var w = writer;
	
	cD.setOrganizationSchema('js/cwrcDialogs/schemas/entities.rng');
	
	function createNewOrg(data) {
		cD.popCreateOrganization({
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
						id: result.response.pid,
						data: result.data
					};
					w.dialogManager.show('tagOrg', {
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
				w.dialogManager.show('tagOrg', {
					entry: config.entry
				});
			} else {
				var query = w.editor.currentBookmark.rng.toString();
				$('#searchEntityInput').val(query);
				
				cD.popSearchOrganization({
					success: function(result) {
						if (result.id == null) {
							result = {
								id: 'cwrc:3b92364f-0e16-4599-bd8c-92c95a409a00',
								name: ['Test Org'],
								repository: 'cwrc'
							};
						}
						if ($.isArray(result.name)) {
							result.name = result.name[0];
						}
						w.dialogManager.show('tagOrg', {
							cwrcInfo: result
						});
					},
					error: function(errorThrown) {
					},
					buttons: [{
						label : "Create New Organization",
						action : createNewOrg
					}]
				});
			}
		},
		hide: function() {
		}
	};
};

});