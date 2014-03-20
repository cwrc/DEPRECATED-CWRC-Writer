define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogs) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer) {
	var w = writer;
	
	function createNewPerson(data) {
		cD.popCreatePerson({
			success: function(result) {
				var r = JSON.stringify(result);
				console.log(r);
			},
			error: function(errorThrown) {
				console.log(errorThrown);
			},
		});
	}
	
	return {
		show: function(config) {
			var query = w.editor.currentBookmark.rng.toString();
			$('#searchEntityInput').val(query);
			
			cD.popSearchPerson({
				success: function(result) {
					if (result.id == null) {
						result = {
							id: 'cwrc:3b92364f-0e16-4599-bd8c-92c95a409a00'
						};
					}
					var type = 'person';
					w.dialogManager.show('tagPerson', {
						type: type,
						pid: result.id,
						title: w.entitiesModel.getTitle(type)
					});
				},
				error: function(errorThrown) {
					console.log(errorThrown);
				},
				buttons: [{
					label : "Create New Person",
					action : createNewPerson
				}]
			});
		},
		hide: function() {
		}
	};
};

});