define(['jquery', 'jquery-ui', 'dialogs/cwrcDialogBridge'], function($, jqueryUi, cwrcDialogBridge) {

return function(writer) {
	var w = writer;
	
	cD.setPlaceSchema('js/cwrcDialogs/schemas/entities.rng');
	
	var bridge = new cwrcDialogBridge(w, {
		label: 'Place',
		localDialog: 'tagPlace',
		cwrcType: 'place'
	});
	
	return bridge;
};

});