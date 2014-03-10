define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogs) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer) {
	var w = writer;
	
	return {
		show: function(config) {
			cD.popSearchOrganization({
				success: function(result) {
					var r = JSON.stringify(result);
					console.log(r);
				},
				error : function(errorThrown) {
				}
			});
		},
		hide: function() {
		}
	};
};

});