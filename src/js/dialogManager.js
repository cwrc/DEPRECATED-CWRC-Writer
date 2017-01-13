'use strict';

var $ = require('jquery');
require('jquery-ui');
require('./lib/jquery/plugins/jquery.popup.js');
var DialogForm = require('./dialogs/dialogForm.js');

var cD = require('cwrcDialogs');

var AddSchema = require('./dialogs/addSchema.js');
var FileManager = require('./dialogs/fileManager.js');
var LoadingIndicator = require('./dialogs/loadingIndicator.js');
var Header = require('./dialogs/header.js');
var Message = require('./dialogs/message.js');
var Triple = require('./dialogs/triple.js');
var SchemaTags = require('./dialogs/schemaTags.js');
var Help = require('./dialogs/help.js');
var CopyPaste = require('./dialogs/copyPaste.js');
var Popup = require('./dialogs/popup.js');
var CwrcPerson = require('./dialogs/cwrcPerson.js');
var CwrcPlace = require('./dialogs/cwrcPlace.js');
var CwrcOrg = require('./dialogs/cwrcOrg.js');
var CwrcTitle = require('./dialogs/cwrcTitle.js');
var CwrcCitation = require('./dialogs/cwrcCitation.js');

function handleResize(dialogEl) {
    if (dialogEl.is(':visible')) {
        if (dialogEl.parent('.ui-dialog').hasClass('linkPopup') == false && dialogEl.parent('.ui-dialog').hasClass('tagPopup') == false) {
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
            var $dialog = $(event.target).parent('.ui-dialog');
            var $overlay = $dialog.parent().find('.ui-widget-overlay').detach();
            $dialog.before($overlay); // need to insert before so dialog is useable
            $dialog.prev('.ui-widget-overlay').addBack().wrapAll('<div class="cwrc" style="position: fixed; top: 0px; left: 0px; z-index: 100;"/>');
            
            handleResize($(event.target));
            $(window).on('resize', $.proxy(handleResize, this, $(event.target)));
        }).on('dialogclose', function(event) {
            var $dialog = $(event.target).parent('.ui-dialog');
            $dialog.find('.ui-widget-overlay').remove();
            $dialog.unwrap();
            
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
            var $dialog = $(event.target).parent('.ui-dialog');
            var $overlay = $dialog.parent().find('.ui-widget-overlay').detach();
            $dialog.before($overlay); // need to insert before so dialog is useable
            $dialog.prev('.ui-widget-overlay').addBack().wrapAll('<div class="cwrc" style="position: fixed; top: 0px; left: 0px; z-index: 100;"/>');
            
            handleResize($(event.target));
            $(window).on('resize', $.proxy(handleResize, this, $(event.target)));
        }).on('popupclose', function(event) {
            var $dialog = $(event.target).parent('.ui-dialog');
            $dialog.find('.ui-widget-overlay').remove();
            $dialog.unwrap();
            
            $(window).off('resize', $.proxy(handleResize, this, $(event.target)));
        });
    }
});

/**
 * @class DialogManager
 * @param {Writer} writer
 */
function DialogManager(writer) {
    var w = writer;

    // dialog name, class map
    var dialogs = {};
    
    var schemaDialogs = {
        tei: require('./schema/tei/dialogs_map.js'),
        orlando: require('./schema/orlando/dialogs_map.js'),
        cwrcEntry: require('./schema/cwrcEntry/dialogs_map.js')
    };
    
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
        popup: Popup,
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
        cD.initialize();
        
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

    var dialogNames = ['citation', 'correction', 'date', 'keyword', 'link', 'note', 'org', 'person', 'place', 'title'];

    var loadSchemaDialogs = function() {
        var schemaMappingsId = w.schemaManager.getCurrentSchema().schemaMappingsId;
        
        // TODO destroy previously loaded dialogs
        for (var dialogName in schemaDialogs[schemaMappingsId]) {
            var dialog = schemaDialogs[schemaMappingsId][dialogName];
            if (dialog.show === undefined) {
                // need to init
                var id = schemaMappingsId+'_'+dialogName+'Form';
                schemaDialogs[schemaMappingsId][dialogName] = new dialog(id, w);
            }
        }
    };

    w.event('schemaLoaded').subscribe(loadSchemaDialogs);

    return dm;
};

module.exports = DialogManager;