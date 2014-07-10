define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogs) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer) {
	var w = writer;
	
	cD.setPlaceSchema('js/cwrcDialogs/schemas/entities.rng');
	
	function createNewPlace(data) {
		cD.popCreatePlace({
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
					w.dialogManager.show('tagPlace', {
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
				w.dialogManager.show('tagPlace', {
					entry: config.entry
				});
			} else {
				var query = w.editor.currentBookmark.rng.toString();
				$('#searchEntityInput').val(query);
				
				cD.popSearchPlace({
					success: function(result) {
						if (result.id == null) {
							var id = w.utilities.createGuid();
							result = {
								id: id,
								data: '<geoname><name>Hamilton</name><asciiName>Hamilton</asciiName><lat>44.0501200</lat><lng>-78.2328200</lng><countryCode>CA</countryCode><countryName>Canada</countryName><fcl>A</fcl><fcode>ADM2</fcode><geonameid>'+w.utilities.createGuid()+'</geonameid><granularity>Province/State</granularity></geoname>',
								name: 'Test Place',
								repository: 'geonames'
							};
						}
						
						var xmlData = w.utilities.stringToXML(result.data);
						
						if (result.repository === 'geonames') {
							var id = $('geonameid', xmlData).text();
							result.id = 'http://www.geonames.org/'+id;
						} else {
							result.id = 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/'+result.id;
						}
						
						if ($.isArray(result.name)) {
							result.name = result.name[0];
						}
						
						delete result.data;
						
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
				});
			}
		},
		hide: function() {
		}
	};
};

});