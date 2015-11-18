define(['jquery', 'jquery-ui', 'cwrcDialogs'], function($, jqueryUi, cD) {

// a bridge between the CWRC-Writer and the cwrcDialogs
return function(writer, config) {
    var w = writer;
    
    var label = config.label;
    var cwrcType = config.cwrcType;
    var localDialog = config.localDialog;
    
    var createEditOpts = {
        success: function(result) {
            if (result.data == null) {
                var error = result.error || 'There was an error creating the entry.';
                w.dialogManager.show('message', {
                    title: 'Error',
                    msg: error,
                    type: 'error'
                });
            } else {
                if (result.response !== undefined && result.response.pid !== undefined) {
                    w.dialogManager.show('schema/'+localDialog, {
                        cwrcInfo: {
                            id: result.response.uri
                        }
                    });
                } else {
                    var error = 'Error creating entity';
                    if (result.response.message  !== undefined) {
                        error += ': '+result.response.message ;
                    }
                    w.dialogManager.show('message', {
                        title: 'Error ', msg: error, modal: true, type: 'error'
                    });
                }
            }
        },
        error: function(errorThrown) {
        }
    };
    
    function doEdit(data) {
        cD.popEdit[cwrcType]($.extend({}, createEditOpts, data));
    }
    
    function doCreate() {
        cD.popCreate[cwrcType](createEditOpts);
    }
    
    return {
        show: function(config) {
            if (config.entry) {
                // EDIT
                var query = config.entry.getContent();
                cD.popSearch[cwrcType]({
                    query: query,
                    success: function(result) {
                        // set id to the uri
                        // assume proper uri passed by the dialogs
                        result.id = result.uri 
                        if ($.isArray(result.name)) {
                            result.name = result.name[0];
                        }                        
                        delete result.data;
                        
                        config.entry.setLookupInfo(result);
                        
                        w.dialogManager.show('schema/'+localDialog, {
                            entry: config.entry
                        });
                    },
                    cancelled: function() {
                        if (config.convertedEntity === true) {
                            var $tag = $('#'+config.entry.id, w.editor.getBody());
                            $tag.removeAttr('_entity _type class name');
                            w.entitiesManager.removeEntity(config.entry.id);
                            var attributes = {};
                            $.each($($tag[0].attributes), function(index, att) {
                                attributes[att.name] = att.value;
                            });
                            w.tagger.editStructureTag($tag, attributes);
                        }
                    },
                    error: function(errorThrown) {
                    },
                    buttons: [{
                        label : 'Edit '+label,
                        isEdit : true,
                        action : doEdit
                    },{
                        label : 'Skip '+label+' Lookup',
                        isEdit : false,
                        action : function() {
                            w.dialogManager.show('schema/'+localDialog, {
                                entry: config.entry
                            });
                        }
                    }]
                });
            } else {
                // ADD
                var query = w.editor.currentBookmark.rng.toString();
                
                cD.popSearch[cwrcType]({
                    query: query,
                    success: function(result) {
                        // set id to the uri
                        // assume proper uri passed by the dialogs
                        result.id = result.uri 
                        
                        if ($.isArray(result.name)) {
                            result.name = result.name[0];
                        }
                        
                        delete result.data;
                        
                        w.dialogManager.show('schema/'+localDialog, {
                            query: query,
                            cwrcInfo: result
                        });
                    },
                    error: function(errorThrown) {
                    },
                    buttons: [{
                        label : 'Create New '+label,
                        isEdit : false,
                        action : doCreate
                    },{
                        label : 'Edit '+label,
                        isEdit : true,
                        action : doEdit
                    }]
                });
            }
        },
        hide: function() {
        }
    };
};

});
