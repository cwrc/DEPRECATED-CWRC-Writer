//define(['jquery', 'jquery-ui', 'dialogs/cwrcDialogBridge', 'cwrcDialogs'], function($, jqueryUi, cwrcDialogBridge, cD) {
'use strict';

var $ = require('jquery');
require('jquery-ui-core');
var cD = require('cwrcDialogs');
var cwrcDialogBridge = require('./cwrcDialogBridge.js');

function CwrcPlace(writer) {
    var w = writer;
    
    var schema = null;
    if (w.initialConfig.cwrcDialogs != null && w.initialConfig.cwrcDialogs.schemas != null) {
        schema = w.initialConfig.cwrcDialogs.schemas.place;
    }
    if (schema == null) {
        schema = 'js/cwrcDialogs/schemas/entities.rng';
    }
    cD.setPlaceSchema(schema);
    
    var bridge = new cwrcDialogBridge(w, {
        label: 'Place',
        localDialog: 'place',
        cwrcType: 'place'
    });
    
    return bridge;
};

module.exports = CwrcPlace;
