define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogs) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer) {
	var w = writer;
	
	cD.setPersonSchema('js/cwrcDialogs/schemas/entities.rng');
	
	function createNewPerson(data) {
		cD.popCreatePerson({
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
				w.dialogManager.show('tagPerson', {
					entry: config.entry
				});
			} else {
				var query = w.editor.currentBookmark.rng.toString();
				$('#searchEntityInput').val(query);
				
				cD.popSearchPerson({
					success: function(result) {
						if (result.id == null) {
							result = {
								id: 'cwrc:3b92364f-0e16-4599-bd8c-92c95a409a00',
								name: ['Test Name'],
								repository: 'cwrc'
							};
						}
						if ($.isArray(result.name)) {
							result.name = result.name[0];
						}
						w.dialogManager.show('tagPerson', {
							cwrcInfo: result
						});
					},
					error: function(errorThrown) {
					},
					buttons: [{
						label : "Create New Person",
						action : createNewPerson
					}]
				});
			}
		},
		hide: function() {
		}
	};
};

});