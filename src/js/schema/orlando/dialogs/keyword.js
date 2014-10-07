define(['jquery', 'jquery-ui', 'dialogForm', 'jquery.watermark'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog">'+
        '<div>'+
            '<input type="text" data-type="textbox" data-mapping="KEYWORDTYPE" />'+
        '</div>'+
    '</div>';
    
    var dialog = new DialogForm({
        writer: w,
        id: id,
        type: 'keyword',
        title: 'Tag Keyword',
        height: 200,
        width: 275,
        html: html
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});