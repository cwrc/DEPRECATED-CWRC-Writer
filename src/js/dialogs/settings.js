define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer, config) {
    var w = writer;
    
    var settings = {
        fontSize: '11pt',
        fontFamily: 'Book Antiqua',
        showEntityBrackets: false,
        showStructBrackets: false
    };
    
    $.extend(settings, config);
    
    var defaultSettings = {
        mode: w.mode,
        allowOverlap: w.allowOverlap,
        validationSchema: w.schemaManager.schemaId
    };
    $.extend(defaultSettings, settings);
    
    var $settingsDialog;
    
    $('#headerButtons').append(''+
    '<div id="helpLink"><h2>Help</h2></div>'+
    '<div id="settingsLink"><h2>Settings</h2></div>');
    
    $(document.body).append(''+
    '<div id="settingsDialog">'+
    '<div>'+
        '<label>Font Size</label>'+
        '<select name="fontsize">'+
            '<option value="9pt">9pt</option>'+
            '<option value="10pt">10pt</option>'+
            '<option value="11pt">11pt</option>'+
            '<option value="12pt">12pt</option>'+
            '<option value="13pt">13pt</option>'+
        '</select>'+
    '</div>'+
    '<div style="margin-top: 10px;">'+
        '<label>Font Type</label>'+
        '<select name="fonttype">'+
            '<option value="Arial" style="font-family: Arial; font-size: 12px;">Arial</option>'+
            '<option value="Book Antiqua" style="font-family: Book Antiqua; font-size: 12px;">Book Antiqua</option>'+
            '<option value="Georgia" style="font-family: Georgia; font-size: 12px;">Georgia</option>'+
            '<option value="Helvetica" style="font-family: Helvetica; font-size: 12px;">Helvetica</option>'+
            '<option value="Palatino" style="font-family: Palatino; font-size: 12px;">Palatino</option>'+
            '<option value="Tahoma" style="font-family: Tahoma; font-size: 12px;">Tahoma</option>'+
            '<option value="Times New Roman" style="font-family: Times New Roman; font-size: 12px;">Times New Roman</option>'+
            '<option value="Verdana" style="font-family: Verdana; font-size: 12px;">Verdana</option>'+
        '</select>'+
    '</div>'+
    '<div style="margin-top: 10px;">'+
        '<label for="showentitybrackets">Show Entity Brackets</label>'+
        '<input type="checkbox" id="showentitybrackets" />'+
    '</div>'+
    '<div style="margin-top: 10px;">'+
        '<label for="showstructbrackets">Show Tags</label>'+
        '<input type="checkbox" id="showstructbrackets" />'+
    '</div>'+
    '<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #aaa;">'+
    '<label>Editor Mode</label>'+
        '<select name="editormode">'+
            '<option value="xml">XML only (no overlap)</option>'+
            '<option value="xmlrdf">XML and RDF (no overlap)</option>'+
            '<option value="xmlrdfoverlap">XML and RDF (overlapping entities)</option>'+
        '</select>'+
    '</div>'+
    '<div style="margin-top: 10px;">'+
        '<label>Schema</label>'+
        '<select name="schema">'+
        '</select>'+
        '<br/><button>Add Schema</button>'+
    '</div>'+
    '</div>'+
    '<div id="helpDialog">'+
        '<p>For help with CWRC-Writer click <a href="http://cwrc.ca/CWRC-Writer_Documentation/" target="_blank">here</a>.</p>'+
    '</div>');
    
    $settingsDialog = $('#settingsDialog');
    
    buildSchema();
    $('select[name="schema"]', $settingsDialog).nextAll('button').button().click(function() {
        w.dialogManager.show('addschema');
    });
    
    $('#settingsLink').click(function() {
        $('select[name="fontsize"] > option[value="'+settings.fontSize+'"]', $settingsDialog).attr('selected', true);
        $('select[name="fonttype"] > option[value="'+settings.fontFamily+'"]', $settingsDialog).attr('selected', true);
        $('#showentitybrackets').prop('checked', settings.showEntityBrackets);
        $('#showstructbrackets').prop('checked', settings.showStructBrackets);
        if (w.mode === w.XML) {
            $('select[name="editormode"] > option[value="xml"]', $settingsDialog).attr('selected', true);
        } else if (w.mode === w.XMLRDF){
            if (w.allowOverlap) {
                $('select[name="editormode"] > option[value="xmlrdfoverlap"]', $settingsDialog).attr('selected', true);
            } else {
                $('select[name="editormode"] > option[value="xmlrdf"]', $settingsDialog).attr('selected', true);
            }
        }        
        $('select[name="schema"] > option[value="'+w.schemaManager.schemaId+'"]', $settingsDialog).attr('selected', true);
        $settingsDialog.dialog('open');
    });
    
    $('#helpLink').click(function() {
        $('#helpDialog').dialog('open');
    });
    
    $settingsDialog.dialog({
        title: 'Settings',
        modal: true,
        resizable: false,
        dialogClass: 'splitButtons',
        closeOnEscape: true,
        height: 350,
        width: 350,
        autoOpen: false,
        buttons: [{
            text: 'Revert to Defaults',
            'class': 'left',
            click: function() {
                setDefaults();
                applySettings();
            },
        },{
            text: 'Cancel',
            click: function() {
                $settingsDialog.dialog('close');
            }
        },{
            text: 'Apply',
            click: function() {
                applySettings();
            }
        }]
    });
    
    $('#helpDialog').dialog({
        title: 'Help',
        modal: true,
        resizable: true,
        closeOnEscape: true,
        height: 150,
        width: 250,
        autoOpen: false,
        buttons: {
            'Close': function() {
                $('#helpDialog').dialog('close');
            }
        }
    });
    
    function buildSchema() {
        var schemasHTML;
        for(var schema in w.schemaManager.schemas){
            schemasHTML += '<option value="' + schema + '">' + w.schemaManager.schemas[schema]['name'] + '</option>';
        }
        if(schemasHTML) {
            $('select[name="schema"]', $settingsDialog).html(schemasHTML);
        }
    }
    
    function applySettings() {
        var editorMode = $('select[name="editormode"]', $settingsDialog).val();
        var doModeChange = false;
        if (editorMode === 'xml') {
            if (w.mode !== w.XML) {
                doModeChange = true;
            }
        } else if (editorMode === 'xmlrdf') {
            if (w.mode !== w.XMLRDF || w.allowOverlap === true) {
                doModeChange = true;
            }
        } else if (editorMode === 'xmlrdfoverlap') {
            if (w.mode !== w.XMLRDF || w.allowOverlap === false) {
                doModeChange = true;
            }
        }
        
        if (doModeChange) {
            var message;
            var existingOverlaps = w.utilities.doEntitiesOverlap();
            // overlap currently allowed and we're switching to a non-overlap mode
            if (w.allowOverlap && editorMode !== 'xmlrdfoverlap') {
                if (editorMode === 'xml') {
                    message = 'If you select the XML only mode, no RDF will be created when tagging entities.<br/>Furthermore, the existing RDF annotations will be discarded.<br/><br/>Do you wish to continue?';
                } else if (existingOverlaps) {
                    message = 'You have overlapping entities and are attemping to switch to a mode which prohibits them.<br/>The overlapping entities will be discarded if you continue.<br/><br/>Do you wish to continue?';
                }
                if (message !== undefined) {
                    w.dialogManager.confirm({
                        title: 'Warning',
                        msg: message,
                        callback: function(confirmed) {
                            if (confirmed) {
                                w.utilities.removeOverlappingEntities();
                                w.utilities.convertBoundaryEntitiesToTags();
                                doApplySettings(editorMode);
                            }
                        }
                    });
                } else {
                    doApplySettings(editorMode);
                }
            } else {
                doApplySettings(editorMode);
            }
        } else {
            doApplySettings();
        }
        
        function doApplySettings(editorMode) {
            if (editorMode !== undefined) {
                if (editorMode === 'xml') {
                    w.mode = w.XML;
                    w.allowOverlap = false;
                } else if (editorMode === 'xmlrdf') {
                    w.mode = w.XMLRDF;
                    w.allowOverlap = false;
                } else if (editorMode === 'xmlrdfoverlap') {
                    w.mode = w.XMLRDF;
                    w.allowOverlap = true;
                }
            }
            
            settings.fontSize = $('select[name="fontsize"]', $settingsDialog).val();
            settings.fontFamily = $('select[name="fonttype"]', $settingsDialog).val();
            
            if (settings.showEntityBrackets != $('#showentitybrackets').prop('checked')) {
                w.editor.$('body').toggleClass('showEntityBrackets');
            }
            settings.showEntityBrackets = $('#showentitybrackets').prop('checked');
            
            if (settings.showStructBrackets != $('#showstructbrackets').prop('checked')) {
                w.editor.$('body').toggleClass('showStructBrackets');
            }
            settings.showStructBrackets = $('#showstructbrackets').prop('checked');
            
            // TODO add handling for schemaChanged
            w.schemaManager.schemaId = $('select[name="schema"]', $settingsDialog).val();
            w.event('schemaChanged').publish(w.schemaManager.schemaId);
            
            var styles = {
                fontSize: settings.fontSize,
                fontFamily: settings.fontFamily
            };
            w.editor.dom.setStyles(w.editor.dom.getRoot(), styles);
            
            $settingsDialog.dialog('close');
        }
    };
    
    function setDefaults() {
        $('select[name="fontsize"]', $settingsDialog).val(defaultSettings.fontSize);
        $('select[name="fonttype"]', $settingsDialog).val(defaultSettings.fontFamily);
        $('#showentitybrackets').prop('checked', defaultSettings.showEntityBrackets);
        $('#showstructbrackets').prop('checked', defaultSettings.showStructBrackets);
        
        $('select[name="editormode"]', $settingsDialog).val(defaultSettings.mode);
        $('select[name="schema"]', $settingsDialog).val(defaultSettings.validationSchema);
    };
    
    w.event('schemaAdded').subscribe(buildSchema);
    
    return {
        getSettings: function() {
            return settings;
        }
    };
};

});