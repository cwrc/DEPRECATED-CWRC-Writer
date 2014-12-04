define(['jquery','jquery.snippet'], function($, snippet) {
    
/**
 * @class Selection
 * @param {Object} config
 * @param {Writer} config.writer
 * @param {String} config.parentId
 * @param {jQuery} config.parentElement
 */
return function(config) {
    
    var w = config.writer;
    
    var id = w.getUniqueId('selection_');
    var selContentsId = w.getUniqueId('selectionContents_');
    
    var $parent;
    if (config.parentElement !== undefined) {
        $parent = config.parentElement;
    } else if (config.parentId !== undefined) {
        $parent = $('#'+config.parentId);
    }
    
    $parent.append('<div id="'+id+'" style="margin-left: 10px;"></div>');
    $(document.body).append('<div id="'+selContentsId+'" style="display: none;"></div>');
    
    w.event('nodeChanged').subscribe(function() {
        updateSelection(w.editor);
    });
    
    /**
     * @lends Selection.prototype
     */
    var selection = {};
    
    selection.getId = function() {
        return id;
    };
    
    function updateSelection(ed) {
        var range = ed.selection.getRng(true);
        var contents = range.cloneContents();
        $('#'+selContentsId).html(contents);
        var xmlString = w.converter.buildXMLString($('#'+selContentsId));
        var escapedContents = w.utilities.escapeHTMLString(xmlString);
        if (escapedContents.length < 100000 && escapedContents != '\uFEFF') {
            $('#'+id).html('<pre>'+escapedContents+'</pre>');
            $('#'+id+' > pre').snippet('html', {
                style: 'typical',
                transparent: true,
                showNum: false,
                menu: false
            });
        } else {
            $('#'+id).html('<pre>The selection is too large to display.</pre>');
        }
    }
    
    // add to writer
    w.selection = selection;
    
    return selection;
};

});