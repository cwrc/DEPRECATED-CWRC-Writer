define(['jquery', 'jquery-ui', 'dialogForm'], function($, jqueryUi, DialogForm) {
    
return function(id, writer) {
    var w = writer;
    
    var html = ''+
    '<div id="'+id+'Dialog" class="annotationDialog">'+
        '<div>'+
            '<label for="'+id+'_input">Standard name</label>'+
            '<input type="text" id="'+id+'_input" data-type="textbox" data-mapping="STANDARD" />'+
        '</div>'+
        '<div id="'+id+'_level" data-type="radio" data-mapping="TITLETYPE">'+
            '<p>This title is:</p>'+
            '<input type="radio" value="ANALYTIC" name="'+id+'_level" id="'+id+'_level_a"/>'+
            '<label for="'+id+'_level_a">Analytic <span>article, poem, or other item published as part of a larger item</span></label><br/>'+
            '<input type="radio" value="MONOGRAPHIC" name="'+id+'_level" id="'+id+'_level_m" data-default="true" />'+
            '<label for="'+id+'_level_m">Monographic <span>book, collection, single volume, or other item published as a distinct item</span></label><br/>'+
            '<input type="radio" value="JOURNAL" name="'+id+'_level" id="'+id+'_level_j"/>'+
            '<label for="'+id+'_level_j">Journal <span>magazine, newspaper or other periodical publication</span></label><br/>'+
            '<input type="radio" value="SERIES" name="'+id+'_level" id="'+id+'_level_s"/>'+
            '<label for="'+id+'_level_s">Series <span>book, radio, or other series</span></label><br/>'+
            '<input type="radio" value="UNPUBLISHED" name="'+id+'_level" id="'+id+'_level_u"/>'+
            '<label for="'+id+'_level_u">Unpublished <span>thesis, manuscript, letters or other unpublished material</span></label><br/>'+
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
        width: 430,
        height: 490,
        type: 'title',
        title: 'Tag Title',
        html: html
    });
    
    dialog.$el.on('beforeShow', function(e, config, dialog) {
        var cwrcInfo = dialog.currentData.cwrcInfo;
        if (cwrcInfo !== undefined) {
            dialog.attributesWidget.setData({REF: cwrcInfo.id});
            dialog.attributesWidget.expand();
        }
    });
    
    return {
        show: function(config) {
            dialog.show(config);
        }
    };
};

});