define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogs) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer) {
	var w = writer;
	
	function createNewOrg(data) {
		cD.popCreateOrganization({
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
			var query = w.editor.currentBookmark.rng.toString();
			$('#searchEntityInput').val(query);
			
			cD.popSearchOrganization({
				success: function(result) {
					var r = JSON.stringify(result);
					console.log(r);
				},
				error: function(errorThrown) {
				},
				buttons: [{
					label : "Create New Organization",
					action : createNewOrg
				}]
			});
		},
		hide: function() {
		}
	};
};

});