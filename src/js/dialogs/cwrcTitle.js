define(['jquery', 'jquery-ui', 'dialogs/cwrcDialogBridge'], function($, jqueryUi, cwrcDialogBridge) {
    
return function(writer) {
    var w = writer;
    
    var bridge = new cwrcDialogBridge(w, {
        label: 'Title',
        localDialog: 'title',
        cwrcType: 'title'
    });
    
    return bridge;
};

});