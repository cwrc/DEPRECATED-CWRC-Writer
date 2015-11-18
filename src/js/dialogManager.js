define([
    'jquery',
    'jquery-ui',
    'cwrcDialogs',
    'dialogs/addSchema','dialogs/fileManager','dialogs/header','dialogs/message','dialogs/triple',
    'dialogs/cwrcPerson','dialogs/cwrcOrg','dialogs/cwrcPlace','dialogs/cwrcTitle','dialogs/cwrcCitation',
    'dialogs/schemaTags','dialogs/help','dialogs/copyPaste'
], function($, jqueryui, cD,
        AddSchema, FileManager, Header, Message, Triple,
        CwrcPerson, CwrcOrg, CwrcPlace, CwrcTitle, CwrcCitation,
        SchemaTags, Help, CopyPaste
) {

function handleResize(dialogEl) {
    if (dialogEl.is(':visible')) {
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
    
// add event listeners to all of our jquery ui dialogs
$.extend($.ui.dialog.prototype.options, {
    create: function(e) {
        $(e.target).on('dialogopen', function(event) {
            // wrap our dialogs in the cwrc css scope
            $(event.target).parent('.ui-dialog').prev('.ui-widget-overlay').andSelf().wrapAll('<div class="cwrc" />');
            
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

/**
 * @class DialogManager
 * @param {Writer} writer
 */
return function(writer) {
    var w = writer;

    var dialogs = {
        message: new Message(w),
        help: new Help(w),
        copyPaste: new CopyPaste(w),
        triple: new Triple(w),
        header: new Header(w),
        filemanager: new FileManager(w),
        addschema: new AddSchema(w),
        person: new CwrcPerson(w),
        org: new CwrcOrg(w),
        title: new CwrcTitle(w),
        citation: new CwrcCitation(w),
        place: new CwrcPlace(w),
        schemaTags: new SchemaTags(w)
    };

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

    /**
     * @lends DialogManager.prototype
     */
    var pm = {
        show: function(type, config) {
            if (type.indexOf('schema/') === 0) {
                var typeParts = type.split('/');
                var type = typeParts[1];
                schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type].show(config);
            } else {
                if (dialogs[type]) {
                    dialogs[type].show(config);
                } else if (schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type]) {
                    schemaDialogs[w.schemaManager.getCurrentSchema().schemaMappingsId][type].show(config);
                }
            }
        },
        confirm: function(config) {
            dialogs.message.confirm(config);
        }
    };

    $.extend(pm, dialogs);

    return pm;
};

});
