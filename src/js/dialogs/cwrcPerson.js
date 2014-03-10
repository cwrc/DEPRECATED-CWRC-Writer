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
			},
		});
	}
	
	return {
		show: function(config) {
			cD.popSearchPerson({
				success: function(result) {
					var r = JSON.stringify(result);
					console.log(r);
				},
				error: function(errorThrown) {
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