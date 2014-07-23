define(['jquery', 'jquery-ui', 'dialogs/cwrcDialogBridge'], function($, jqueryUi, cwrcDialogBridge) {
	
return function(writer) {
	var w = writer;
	
	cD.setPersonSchema('js/cwrcDialogs/schemas/entities.rng');
	
	var bridge = new cwrcDialogBridge(w, {
		label: 'Person',
		localDialog: 'tagPerson',
		cwrcType: 'person'
	});
	
	return bridge;
};

});