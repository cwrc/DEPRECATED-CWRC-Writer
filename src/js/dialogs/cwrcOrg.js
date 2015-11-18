define(['jquery', 'jquery-ui', 'dialogs/cwrcDialogBridge', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogBridge, cD) {

return function(writer) {
    var w = writer;
    
    var schema = null;
    if (w.initialConfig.cwrcDialogs != null && w.initialConfig.cwrcDialogs.schemas != null) {
        schema = w.initialConfig.cwrcDialogs.schemas.organization;
    }
    if (schema == null) {
        schema = 'js/cwrcDialogs/schemas/entities.rng';
    }
    cD.setOrganizationSchema(schema);
    
    var bridge = new cwrcDialogBridge(w, {
        label: 'Organization',
        localDialog: 'org',
        cwrcType: 'organization'
    });
    
    return bridge;
};

});