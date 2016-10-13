define([
    'jquery',
    'jquery-ui',
    'jquery.popup',
    'cwrcDialogs',
    'dialogs/addSchema','dialogs/fileManager','dialogs/loadingIndicator','dialogs/header','dialogs/message','dialogs/triple',
    'dialogs/cwrcPerson','dialogs/cwrcOrg','dialogs/cwrcPlace','dialogs/cwrcTitle','dialogs/cwrcCitation',
    'dialogs/schemaTags','dialogs/help','dialogs/copyPaste'
], function($, jqueryui, Popup, cD,
        AddSchema, FileManager, LoadingIndicator, Header, Message, Triple,
        CwrcPerson, CwrcOrg, CwrcPlace, CwrcTitle, CwrcCitation,
        SchemaTags, Help, CopyPaste
) {

function handleResize(dialogEl) {
    if (dialogEl.is(':visible')) {
        if (dialogEl.parent('.ui-dialog').hasClass('linkPopup') == false) {
            var winWidth = $(window).width();
            var winHeight = $(window).height();
            var dialogWidth = dialogEl.dialog('option', 'width');
            var dialogHeight = dialogEl.dialog('option', 'height');
            
            if (dialogWidth > winWidth) {
                dialogEl.dialog('option', 'width', winWidth * 0.8);
            }
            if (dialogHeight > winHeight) {
                dialogEl.dialog('option', 'height', winHeight * 0.8);
            }
            dialogEl.dialog('option', 'position', {my: 'center', at: 'center', of: window});
        }
    }
}

// add event listeners to all of our jquery ui dialogs
$.extend($.ui.dialog.prototype.options, {
    create: function(e) {
        $(e.target).on('dialogopen', function(event) {
            // wrap our dialogs in the cwrc css scope
            $(event.target).parent('.ui-dialog').prev('.ui-widget-overlay').andSelf().wrapAll('<div class="cwrc" style="position: fixed; z-index: 100;"/>');
            
            handleResize($(event.target));
            $(window).on('resize', $.proxy(handleResize, this, $(event.target)));
        }).on('dialogclose', function(event) {
            $(event.target).parent('.ui-dialog').unwrap();
            
            $(window).off('resize', $.proxy(handleResize, this, $(event.target)));
        });
    }
});
// do the same for tooltips
$.extend($.ui.tooltip.prototype.options, {
    create: function(event) {
        $(event.target).on('tooltipopen', function(event, ui) {
            $(ui.tooltip).wrap('<div class="cwrc" />');
        }).on('tooltipclose', function(event, ui) {
            $(ui.tooltip).unwrap();
        });
    }
});
// do the same for popups
$.extend($.custom.popup.prototype.options, {
    create: function(e) {
        $(e.target).on('popupopen', function(event) {
            // wrap our dialogs in the cwrc css scope
            $(event.target).parent('.ui-dialog').prev('.ui-widget-overlay').andSelf().wrapAll('<div class="cwrc" style="position: fixed; z-index: 100;"/>');
            
            handleResize($(event.target));
            $(window).on('resize', $.proxy(handleResize, this, $(event.target)));
        }).on('popupclose', function(event) {
            $(event.target).parent('.ui-dialog').unwrap();
            
            $(window).off('resize', $.proxy(handleResize, this, $(event.target)));
        });
    }
});

/**
 * @class DialogManager
 * @param {Writer} writer
 */
return function(writer) {
    var w = writer;

    // dialog name, class map
    var dialogs = {};
    
    /**
     * @lends DialogManager.prototype
     */
    var dm = {};
    
    dm.addDialog = function(dialogName, DialogClass) {
        var dialog = new DialogClass(w);
        if (dialog.show === undefined) {
            if (window.console) {
                console.warn(dialogName+" doesn't have required method \"show\"!");
            }
        }
        dialogs[dialogName] = dialog;
        return dialog;
    };
    
    dm.getDialog = function(dialogName) {
        return dialogs[dialogName];
    };
    
    dm.show = function(type, config) {
        if (type.indexOf('schema/') === 0) {
            var typeParts = type.split('/');
            type = typeParts[1];
            schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type].show(config);
        } else {
            if (dialogs[type]) {
                dialogs[type].show(config);
            } else if (schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type]) {
                schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type].show(config);
            }
        }
    };
    
    dm.confirm = function(config) {
        dialogs.message.confirm(config);
    };
    
    var defaultDialogs = {
        message: Message,
        help: Help,
        copyPaste: CopyPaste,
        triple: Triple,
        header: Header,
        filemanager: FileManager,
        loadingindicator: LoadingIndicator,
        addschema: AddSchema,
        person: CwrcPerson,
        org: CwrcOrg,
        title: CwrcTitle,
        citation: CwrcCitation,
        place: CwrcPlace,
        schemaTags: SchemaTags
    };
    for (var dialogName in defaultDialogs) {
        dm.addDialog(dialogName, defaultDialogs[dialogName]);
    }

    if (w.initialConfig.cwrcDialogs !== undefined) {
        var conf = w.initialConfig.cwrcDialogs;
        if (conf.cwrcApiUrl) cD.setCwrcApi(conf.cwrcApiUrl);
        if (conf.repositoryBaseObjectUrl) cD.setRepositoryBaseObjectURL(conf.repositoryBaseObjectUrl);
        if (conf.geonameUrl) cD.setGeonameUrl(conf.geonameUrl);
        if (conf.viafUrl) cD.setViafUrl(conf.viafUrl);
        if (conf.googleGeocodeUrl) cD.setGoogleGeocodeUrl(conf.googleGeocodeUrl);
        if (conf.schemas) {
            if (conf.schemas.person) cD.setPersonSchema(conf.schemas.person);
            if (conf.schemas.place) cD.setPlaceSchema(conf.schemas.place);
            if (conf.schemas.organization) cD.setOrganizationSchema(conf.schemas.organization);
        }
    }

    var schemaDialogs = {};
    var dialogNames = ['citation', 'correction', 'date', 'keyword', 'link', 'note', 'org', 'person', 'place', 'title'];

    var loadSchemaDialogs = function() {
        var schemaId = w.schemaManager.schemaId;
        var schemaMappingsId = w.schemaManager.getCurrentSchema().schemaMappingsId;

        // TODO destroy previously loaded dialogs
        if (schemaDialogs[schemaMappingsId] == null) {
            var parent = schemaDialogs[schemaMappingsId] = {};
            var schemaDialogNames = [];
            schemaDialogNames = $.map(dialogNames, function(name, i) {
                return 'schema/'+schemaMappingsId+'/dialogs/'+name;
            });
            require(schemaDialogNames, function() {
                if (arguments.length != schemaDialogNames.length) {
                    alert('error loading schema dialogs');
                } else {
                    for (var i = 0; i < arguments.length; i++) {
                        var name = dialogNames[i];
                        var id = schemaMappingsId+'_'+name+'Form';
                        parent[name] = new arguments[i](id, w);
                    }
                }
            });
        }
    };

    w.event('schemaLoaded').subscribe(loadSchemaDialogs);

    return dm;
};

});
