//define(['jquery','jquery.snippet'], function($, snippet) {

var $ = require('jquery');
var Prism = require('prismjs');
    
/**
 * @class Selection
 * @param {Object} config
 * @param {Writer} config.writer
 * @param {String} config.parentId
 */
function Selection(config) {
    
    var w = config.writer;
    
    var lastUpdate = new Date().getTime();
    
    $(document.body).append('<link type="text/css" rel="stylesheet" href="'+w.cwrcRootUrl+'css/prism.css" />');
    $('#'+config.parentId).append('<div id="selection" style="margin-left: 10px; overflow: hidden;"></div>');
    $(document.body).append('<div id="selectionContents" style="display: none;"></div>');
    
    w.event('nodeChanged').subscribe(function() {
        updateSelection();
    });
    w.event('tagSelected').subscribe(function(tagId) {
        updateSelection();
    });
    
    /**
     * @lends Selection.prototype
     */
    var selection = {};
    
    function updateSelection(useDoc) {
        var timestamp = new Date().getTime();
        var timeDiff = timestamp - lastUpdate; // track to avoid double update on nodeChanged/tagSelected combo
        if ($('#selection').is(':visible') && timeDiff > 250) {
            lastUpdate = new Date().getTime();
            
            var contents = '';
            if (w.editor.selection.isCollapsed() && useDoc) {
                contents = w.editor.getBody().firstChild.cloneNode(true);
            } else {
                var range = w.editor.selection.getRng(true);
                contents = range.cloneContents();
            }
            
            $('#selectionContents').html(contents);
            var xmlString = w.converter.buildXMLString($('#selectionContents'));
            var escapedContents = w.utilities.escapeHTMLString(xmlString);   //$('#selectionContents')[0].innerHTML
            if (escapedContents.length < 100000) {
                if (escapedContents != '\uFEFF') {
                    $('#selection').html('<pre><code class="language-markup">'+escapedContents+'</code></pre>');
                    Prism.highlightElement($('#selection code')[0]);
                } else {
                    $('#selection').html('<pre><code>Nothing selected.</code></pre>');
                }
            } else {
                $('#selection').html('<pre><code>The selection is too large to display.</code></pre>');
            }
        }
    }
    
    selection.showSelection = function() {
        w.layout.ui.center.children.layout1.open('south');
        $('#southTabs').tabs('option', 'active', 1);
        updateSelection(true);
    }
    
    // add to writer
    w.selection = selection;
    
    return selection;
};

module.exports = Selection;
