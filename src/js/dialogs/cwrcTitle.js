'use strict';

var $ = require('jquery');
var jqueryUi = require('jquery-ui');
var cwrcDialogBridge = require('./cwrcDialogBridge.js');
    
function CwrcTitle(writer) {
    var w = writer;
    
    var bridge = new cwrcDialogBridge(w, {
        label: 'Title',
        localDialog: 'title',
        cwrcType: 'title'
    });
    
    return bridge;
};

module.exports = CwrcTitle;
