var $ = require('jquery');
var DialogForm = require('../../../dialogs/dialogForm.js');

module.exports = function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<p>Correction</p><textarea data-type="textbox" data-mapping="CORR"></textarea>'+
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
        width: 385,
        height: 400,
        type: 'correction',
        title: 'Tag Correction',
        html: html
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};
