define(['jquery', 'jquery-ui', 'dialogs/cwrcDialogBridge'], function($, jqueryUi, cwrcDialogBridge) {

return function(writer) {
	var w = writer;
	
	var schema = null;
	if (w.initialConfig.cwrcDialogs != null && w.initialConfig.cwrcDialogs.schemas != null) {
		schema = w.initialConfig.cwrcDialogs.schemas.place;
	}
	if (schema == null) {
		schema = 'js/cwrcDialogs/schemas/entities.rng';
	}
	cD.setPlaceSchema(schema);
	
	var bridge = new cwrcDialogBridge(w, {
		label: 'Place',
		localDialog: 'tagPlace',
		cwrcType: 'place'
	});
	
	return bridge;
};

});