/**
 * Contains the load and save dialogs, as well as file related functions.
 */
define(['jquery', 'jquery-ui'], function($, jqueryUi) {

//cross browser xml node finder
//http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
$.fn.filterNode = function(name) {
    return this.find('*').filter(function() {
        return this.nodeName === name;
    });
};

/**
 * @class FileManager
 * @param {Writer} writer
 */
return function(writer) {
    
    var w = writer;
    
    $(document.body).append(''+
        '<div id="editSourceDialog">'+
            '<textarea></textarea>'+
        '</div>'
        //'<iframe id="editDocLoader" style="display: none;"></iframe>'
    );
    
    var edit = $('#editSourceDialog');
    edit.dialog({
        title: 'Edit Source',
        modal: true,
        resizable: true,
        closeOnEscape: true,
        height: 480,
        width: 640,
        autoOpen: false,
        buttons: {
            'Ok': function() {
                var newDocString = $('textarea', edit).val();
                var xmlDoc = w.utilities.stringToXML(newDocString);
                edit.dialog('close');
                fm.loadDocumentFromXml(xmlDoc);
            },
            'Cancel': function() {
                edit.dialog('close');
            }
        }
    });
    
    /**
     * @lends FileManager.prototype
     */
    var fm = {};
    
    fm.newDocument = function() {
        if (w.editor.isDirty()) {
            w.dialogManager.filemanager.showUnsaved();
        } else {
            window.location = 'index.htm';
        }
    };
    
    fm.saveDocument = function() {
        if (w.currentDocId == null) {
            w.dialogManager.filemanager.showSaver();
        } else {
            w.delegator.validate(function (valid) {
                if (valid) {
                    w.delegator.saveDocument(w.currentDocId);
                } else {
                    var doc = w.currentDocId;
                    if (doc == null) doc = 'The current document';
                    w.dialogManager.confirm({
                        title: 'Document Invalid',
                        msg: doc+' is not valid. <b>Save anyways?</b>',
                        callback: function(yes) {
                            if (yes) {
                                w.delegator.saveDocument(w.currentDocId);
                            }
                        }
                    });
                }
            });
        }
    };
    
    /**
     * Loads a document through the delegator
     * @fires Writer#loadingDocument
     * @param {String} docName The name of the document
     */
    fm.loadDocument = function(docName) {
        w.currentDocId = docName;
        w.event('loadingDocument').publish();
        w.delegator.loadDocument(docName, function(xml) {
            if (xml != null) {
                w.converter.processDocument(xml);
            } else {
                w.currentDocId = null;
            }
        });
    };
    
    /**
     * Loads a document into the editor
     * @fires Writer#loadingDocument
     * @param {String} docUrl An URL pointing to an XML document
     */
    fm.loadDocumentFromUrl = function(docUrl) {
        w.currentDocId = docUrl;
        w.event('loadingDocument').publish();
        $.ajax({
            url: docUrl,
            type: 'GET',
            success: function(doc, status, xhr) {
                window.location.hash = '';
                w.converter.processDocument(doc);
            },
            error: function(xhr, status, error) {
                w.currentDocId = null;
                w.dialogManager.show('message', {
                    title: 'Error',
                    msg: 'An error ('+status+') occurred and '+docUrl+' was not loaded.',
                    type: 'error'
                });
            },
            dataType: 'xml'
        });
    };
    
    /**
     * Loads a document into the editor.
     * @fires Writer#loadingDocument
     * @param docXml An XML DOM
     */
    fm.loadDocumentFromXml = function(docXml) {
        w.event('loadingDocument').publish();
        window.location.hash = '';
        w.converter.processDocument(docXml);
    };
    
    /**
     * Loads a template through the delegator
     * @fires Writer#loadingDocument
     * @param {String} filename The name of the template file
     */
    fm.loadTemplate = function(filename) {
        w.currentDocId = null;
        w.event('loadingDocument').publish();
        w.delegator.loadTemplate(filename, function(xml) {
            w.converter.processDocument(xml);
        });
    };
    
    fm.editSource = function() {
        w.dialogManager.confirm({
            title: 'Edit Source',
            msg: 'Editing the source directly is only recommended for advanced users who know what they\'re doing.<br/><br/>Are you sure you wish to continue?',
            callback: function(yes) {
                if (yes) {
                    var docText = w.converter.getDocumentContent(true);
                    $('textarea', edit).val(docText);
                    edit.dialog('open');
                }
            }
        });
    };
    
    /**
     * Loads the initial document into the editor
     * @fires Writer#loadingDocument
     * @param {String} start The anchor from the editor's URL
     */
    fm.loadInitialDocument = function(start) {
        start = start.substr(1); // remove hash
        if (start === 'load') {
            w.dialogManager.filemanager.showLoader();
        } else if (start.match(/^templates\//) !== null) {
            start += '.xml';
            fm.loadTemplate(start);
        } else if (start !== '') {
            fm.loadDocument(start);
        } else if (w.initialConfig.defaultDocument) {
            fm.loadInitialDocument('#'+w.initialConfig.defaultDocument);
        }
    };
    
    return fm;
};

});