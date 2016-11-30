'use strict';

var $ = require('jquery');
var jqueryUi = require('jquery-ui');
var cwrcDialogBridge = require('./cwrcDialogBridge.js');
    
function CwrcCitation(writer) {
    var w = writer;
    
    var bridge = new cwrcDialogBridge(w, {
        label: 'Citation',
        localDialog: 'citation',
        cwrcType: 'title'
    });
    
    return bridge;
};

module.exports = CwrcCitation;
