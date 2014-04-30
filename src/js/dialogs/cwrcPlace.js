define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogs) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer) {
	var w = writer;
	
	function createNewPlace(data) {
		cD.popCreatePlace({
			success: function(result) {
				var r = JSON.stringify(result);
				console.log(r);
			},
			error: function(errorThrown) {
			},
		});
	}
	
	return {
		show: function(config) {
			if (config.entry) {
				w.dialogManager.show('tagPlace', {
					entry: config.entry
				});
			} else {
				var query = w.editor.currentBookmark.rng.toString();
				$('#searchEntityInput').val(query);
				
				w.dialogManager.show('tagPlace', {
					cwrcInfo: {
						id: 'cwrc:3b92364f-0e16-4599-bd8c-92c95a409a00',
						name: [query],
						repository: 'cwrc'
					}
				});
				/*cD.popSearchPlace({
					success: function(result) {
						if (result.id == null) {
							result = {
								id: 'cwrc:3b92364f-0e16-4599-bd8c-92c95a409a00',
								name: ['Test Place'],
								repository: 'cwrc'
							};
						}
						if ($.isArray(result.name)) {
							result.name = result.name[0];
						}
						w.dialogManager.show('tagPlace', {
							cwrcInfo: result
						});
					},
					error: function(errorThrown) {
					},
					buttons: [{
						label : "Create New Place",
						action : createNewPlace
					}]
				});*/
				
			}
		},
		hide: function() {
		}
	};
};

});