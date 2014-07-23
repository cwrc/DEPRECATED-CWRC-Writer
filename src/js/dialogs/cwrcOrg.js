define(['jquery', 'jquery-ui', 'dialogs/cwrcDialogBridge'], function($, jqueryUi, cwrcDialogBridge) {

return function(writer) {
	var w = writer;
	
	cD.setOrganizationSchema('js/cwrcDialogs/schemas/entities.rng');
	
	var bridge = new cwrcDialogBridge(w, {
		label: 'Organization',
		localDialog: 'tagOrg',
		cwrcType: 'organization'
	});
	
	return bridge;
};

});