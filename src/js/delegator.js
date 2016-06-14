define(['jquery', 'octokit'], function($, Octokit) {

/**
 * @class Delegator
 * @param {Writer} writer
 */
return function(writer) {
    var w = writer;
    
    /**
     * @lends Delegator.prototype
     */
    var del = {};
    
    /**
     * Gets the URI for the entity
     * @param {Object} entity The entity object
     * @returns {Promise} The promise object
     */
    del.getUriForEntity = function(entity) {
        var guid = w.utilities.createGuid();
        var uri = 'http://id.cwrc.ca/'+entity.getType()+'/'+guid;
        var dfd = new $.Deferred();
        dfd.resolve(uri);
        return dfd.promise();
    };
    
    /**
     * Gets the URI for the annotation
     * @param {Object} entity The entity object
     * @returns {Promise} The promise object
     */
    del.getUriForAnnotation = function() {
        var guid = w.utilities.createGuid();
        var uri = 'http://id.cwrc.ca/annotation/'+guid;
        var dfd = new $.Deferred();
        dfd.resolve(uri);
        return dfd.promise();
    };
    
    /**
     * Gets the URI for the document
     * @param {Object} entity The entity object
     * @returns {Promise} The promise object
     */
    del.getUriForDocument = function() {
        var guid = w.utilities.createGuid();
        var uri = 'http://id.cwrc.ca/doc/'+guid;
        var dfd = new $.Deferred();
        dfd.resolve(uri);
        return dfd.promise();
    };
    
    /**
     * Gets the URI for the target
     * @param {Object} entity The entity object
     * @returns {Promise} The promise object
     */
    del.getUriForTarget = function() {
        var guid = w.utilities.createGuid();
        var uri = 'http://id.cwrc.ca/target/'+guid;
        var dfd = new $.Deferred();
        dfd.resolve(uri);
        return dfd.promise();
    };
    
    /**
     * Gets the URI for the selector
     * @param {Object} entity The entity object
     * @returns {Promise} The promise object
     */
    del.getUriForSelector = function() {
        var guid = w.utilities.createGuid();
        var uri = 'http://id.cwrc.ca/selector/'+guid;
        var dfd = new $.Deferred();
        dfd.resolve(uri);
        return dfd.promise();
    };
    
    /**
     * Gets the URI for the user
     * @param {Object} entity The entity object
     * @returns {Promise} The promise object
     */
    del.getUriForUser = function() {
        var guid = w.utilities.createGuid();
        var uri = 'http://id.cwrc.ca/user/'+guid;
        var dfd = new $.Deferred();
        dfd.resolve(uri);
        return dfd.promise();
    };
    
    /**
     * Validate the document against the current schema
     * @fires Writer#validationInitiated
     * @fires Writer#documentValidated
     * @param {Delegator~validateCallback} callback
     */
    del.validate = function(callback) {
        var docText = w.converter.getDocumentContent(false);
        var schemaUrl = w.schemaManager.schemas[w.schemaManager.schemaId].url;
        
        w.event('validationInitiated').publish();
        
        $.ajax({
            url: w.baseUrl+'services/validator/validate.html',
            type: 'POST',
            dataType: 'xml',
            data: {
                sch: schemaUrl,
                type: 'RNG_XML',
                content: docText
            },
            success: function(data, status, xhr) {
                var valid = $('status', data).text() == 'pass';
                w.event('documentValidated').publish(valid, data, docText);
                if (callback) {
                    callback.call(w, valid);
                }
            },
            error: function() {
                if (callback) {
                    callback.call(w, null);
                } else {
                    w.dialogManager.show('message', {
                        title: 'Error',
                        msg: 'An error occurred while trying to validate the document.',
                        type: 'error'
                    });
                }
            }
        });
    };
    
    function _getDocumentationBranch() {
        var octo = new Octokit({token: '15286e8222a7bc13504996e8b451d82be1cba397'});
        var templateRepo = octo.getRepo('cwrc', 'CWRC-Writer-Documentation');
        return templateRepo.getBranch('master');
    }
    
    /**
     * Get a specific documentation file
     * @param {String} fileName The documentation file name.
     * @param {Delegator~getDocumentationCallback} callback
     */
    del.getDocumentation = function(fileName, callback) {
        var branch = _getDocumentationBranch();
        branch.contents('out/xhtml/'+fileName).then(function(contents) {
            var doc = $.parseXML(contents);
            callback.call(w, doc);
        }, function() {
            w.dialogManager.show('message', {
                title: 'Error',
                type: 'error',
                msg: 'There was an error fetching the documentation for: '+fileName
            });
        });
    };
    
    /**
     * @callback Delegator~getTemplatesCallback
     * @param {Document} The XML doc
     */
    
    function _getTemplateBranch() {
        var octo = new Octokit({token: '15286e8222a7bc13504996e8b451d82be1cba397'});
        var templateRepo = octo.getRepo('cwrc', 'CWRC-Writer-Templates');
        // if we're on development then also get the templates development branch
        var forceDev = true;
        var isDev = window.location.pathname.indexOf('/dev/') !== -1;
        if (forceDev || isDev) {
            return templateRepo.getBranch('development');
        } else {
            return templateRepo.getBranch('master');
        }
    }
    
    /**
     * Gets the list of templates
     * @param {Delegator~getTemplatesCallback} callback
     */
    del.getTemplates = function(callback) {
        var branch = _getTemplateBranch();
        branch.contents('templates').then(function(contents) {
            contents = $.parseJSON(contents);
            var templates = [];
            for (var i = 0; i < contents.length; i++) {
                var c = contents[i];
                var path = c.path;
                var name = c.name;
                name = name.replace(/_/g, ' ').replace('.xml', '');
                name = w.utilities.getCamelCase(name);
                templates.push({name: name, path: path});
            }
            callback.call(w, templates);
        });
    };
    
    /**
     * @callback Delegator~getTemplatesCallback
     * @param {Array} templates The list of templates
     * @property {String} name The template name
     * @property {String} path The path to the template, relative to the parent branch
     * 
     */
    
    
    /**
     * Gets the list of documents
     * @param {Delegator~getDocumentsCallback} callback
     */
    del.getDocuments = function() {
        $.ajax({
            url: w.baseUrl+'editor/documents',
            type: 'GET',
            dataType: 'json',
            success: function(docNames, status, xhr) {
                if (callback) {
                    callback.call(w, docNames);
                }
            },
            error: function() {
                if (callback) {
                    callback.call(w, []);
                }
            }
        });
    };
    
    /**
     * @callback Delegator~getDocumentsCallback
     * @param {Array} documents The list of documents
     * @property {String} name The document name
     * 
     */
    
    
    /**
     * Loads a template
     * @param {String} path The path to the template, relative to the templates repo
     * @param {Delegator~loadTemplateCallback} callback
     */
    del.loadTemplate = function(path, callback) {
        var branch = _getTemplateBranch();
        branch.contents(path).then(function(template) {
            path = path.replace('.xml', '');
            window.location.hash = '#'+path;
            var xml = $.parseXML(template);
            callback.call(w, xml);
        });
    };
    
    /**
     * @callback Delegator~loadTemplateCallback
     * @param {Document} The template document
     */
    
    /**
     * Loads a document
     * @param {String} docId The document ID
     * @param {Delegator~loadDocumentCallback} callback
     */
    del.loadDocument = function(docId, callback) {
        $.ajax({
            url: w.baseUrl+'editor/documents/'+docId,
            type: 'GET',
            success: function(doc, status, xhr) {
                window.location.hash = '#'+docId;
                callback.call(w, doc);
            },
            error: function(xhr, status, error) {
                w.dialogManager.show('message', {
                    title: 'Error',
                    msg: 'An error ('+status+') occurred and '+docId+' was not loaded.',
                    type: 'error'
                });
                callback.call(w, null);
            },
            dataType: 'xml'
        });
    };
    
    /**
     * @callback Delegator~loadDocumentCallback
     * @param {(Document|null)} document Returns the document or null if there was an error
     */
    
    /**
     * Performs the server call to save the document.
     * @fires Writer#documentSaved
     * @param {String} docId The document ID
     * @param {Delegator~saveDocumentCallback} callback
     */
    del.saveDocument = function(docId, callback) {
        var docText = w.converter.getDocumentContent(true);
        $.ajax({
            url : w.baseUrl+'editor/documents/'+docId,
            type: 'PUT',
            dataType: 'json',
            data: docText,
            success: function(data, status, xhr) {
                w.editor.isNotDirty = 1; // force clean state
                w.dialogManager.show('message', {
                    title: 'Document Saved',
                    msg: docId+' was saved successfully.'
                });
                window.location.hash = '#'+docId;
                if (callback) {
                    callback.call(w, true);
                }
                
                w.event('documentSaved').publish();
            },
            error: function() {
                w.dialogManager.show('message', {
                    title: 'Error',
                    msg: 'An error occurred and '+docId+' was not saved.',
                    type: 'error'
                });
                if (callback) {
                    callback.call(w, false);
                }
            }
        });
    };
    
    del.saveAndExit = function(callback) {
        var theUrl = '';
        var docText = w.converter.getDocumentContent(true);
        $.ajax({
            url : theUrl,
            type: 'PUT',
            dataType: 'json',
            data: docText,
            success: function(data, status, xhr) {
                if (callback) {
                    callback.call(w, true);
                }
            },
            error: function() {
                w.dialogManager.show('message', {
                    title: 'Error',
                    msg: 'An error occurred and the document was not saved.',
                    type: 'error'
                });
                if (callback) {
                    callback.call(w, false);
                }
            }
        });
    };
    
    /**
     * @callback Delegator~saveDocumentCallback
     * @param {Boolean} savedSuccessfully
     */
    
    del.getHelp = function(tagName) {
        return w.utilities.getDocumentationForTag(tagName);
    };
    
    return del;
};

});