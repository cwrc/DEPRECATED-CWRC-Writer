define(['jquery', 'jquery-ui', 'dialogForm', 'jquery.watermark'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<input type="text" data-type="textbox" data-mapping="KEYWORDTYPE" />'+
        '</div>'+
        '<div data-transform="accordion">'+
            '<h3>Markup options</h3>'+
            '<div id="'+id+'_attParent" class="attributes" data-type="attributes" data-mapping="attributes">'+
            '</div>'+
        '</div>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        type: 'keyword',
        title: 'Tag Keyword',
        height: 350,
        width: 350,
        html: html
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});