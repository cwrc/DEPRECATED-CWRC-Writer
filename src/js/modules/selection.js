define(['jquery','jquery.snippet'], function($, snippet) {
    
/**
 * @class Selection
 * @param {Object} config
 * @param {Writer} config.writer
 * @param {String} config.parentId
 */
return function(config) {
    
    var w = config.writer;
    
    var lastUpdate = new Date().getTime();
    
    $('#'+config.parentId).append('<div id="selection" style="margin-left: 10px;"></div>');
    $(document.body).append('<div id="selectionContents" style="display: none;"></div>');
    
    w.event('nodeChanged').subscribe(function() {
        updateSelection(w.editor);
    });
    w.event('tagSelected').subscribe(function(tagId) {
        updateSelection(w.editor);
    });
    
    /**
     * @lends Selection.prototype
     */
    var selection = {};
    
    function updateSelection(ed) {
        var timestamp = new Date().getTime();
        var timeDiff = timestamp - lastUpdate; // track to avoid double update on nodeChanged/tagSelected combo
        if ($('#selection').is(':visible') && timeDiff > 250) {
            lastUpdate = new Date().getTime();
            var range = ed.selection.getRng(true);
            var contents = range.cloneContents();
            $('#selectionContents').html(contents);
            var xmlString = w.converter.buildXMLString($('#selectionContents'));
            var escapedContents = w.utilities.escapeHTMLString(xmlString);   //$('#selectionContents')[0].innerHTML
            if (escapedContents.length < 100000 && escapedContents != '\uFEFF') {
                $('#selection').html('<pre>'+escapedContents+'</pre>');
                $('#selection > pre').snippet('html', {
                    style: 'typical',
                    transparent: true,
                    showNum: false,
                    menu: false
                });
            } else {
                $('#selection').html('<pre>The selection is too large to display.</pre>');
            }
        }
    }
    
    // add to writer
    w.selection = selection;
    
    return selection;
};

});