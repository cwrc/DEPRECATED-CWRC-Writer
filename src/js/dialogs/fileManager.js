define(['jquery', 'jquery-ui'], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    var dfm = {};
    
    var docNames = [];
    
    $(document.body).append(''+
    '<div id="loaderDialog">'+
        '<div id="files">'+
        '<div data-type="document" class="column" style="left: 10px;">'+
        '<h2>Documents</h2><ul class="searchResults"></ul>'+
        '</div>'+
        '<div data-type="template" class="column" style="right: 10px;">'+
        '<h2>Templates</h2><ul class="searchResults"></ul>'+
        '</div>'+
        '</div>'+
    '</div>'+
    '<div id="saverDialog">'+
        '<label for="filename">Name</label>'+
        '<input type="text" name="filename"/>'+
        '<p>Please enter letters only.</p>'+
    '</div>'+
    '<div id="unsavedDialog">'+
        '<p>You have unsaved changes.  Would you like to save?</p>'+
    '</div>');
    
    var $files = $('#files');
    
    var loader = $('#loaderDialog');
    loader.dialog({
        title: 'Load Document',
        modal: true,
        height: 450,
        width: 450,
        autoOpen: false,
        buttons: [{
            text: 'Load',
            id: 'cwrc_loaderDialog_loadButton',
            click : function() {
                var selected = $files.find('ul li.selected');
                var name = selected.data('uri');
                var docType = selected.parents('div').data('type');
                if (selected.length === 1) {
                    _doLoad(name, docType);
                    loader.dialog('close');
                } else {
                    $('#files ul').css({borderColor: 'red'});
                }
            }
        },{
            text: 'Cancel',
            id: 'cwrc_loaderDialog_cancelButton',
            click: function() {
                loader.dialog('close');
            }
        }]
    });
    
    var saver = $('#saverDialog');
    saver.dialog({
        title: 'Save Document As',
        modal: true,
        resizable: false,
        height: 160,
        width: 300,
        autoOpen: false,
        buttons: {
            'Save': function() {
                var name = $('input', saver).val();
                
                if (!_isNameValid(name)) {
                    w.dialogManager.show('message', {
                        title: 'Invalid Name',
                        msg: 'You may only enter upper or lowercase letters; no numbers, spaces, or punctuation.',
                        type: 'error'
                    });
                    return;
                } else if (name == 'info') {
                    w.dialogManager.show('message', {
                        title: 'Invalid Name',
                        msg: 'This name is reserved, please choose a different one.',
                        type: 'error'
                    });
                    return;
                }
                
                if ($.inArray(name, docNames) != -1) {
                    // TODO add overwrite confirmation
                    w.dialogManager.show('message', {
                        title: 'Invalid Name',
                        msg: 'This name already exists, please choose a different one.',
                        type: 'error'
                    });
                    return;
                } else {
                    w.currentDocId = name;
                    w.fileManager.saveDocument();
                    saver.dialog('close');
                }
            },
            'Cancel': function() {
                saver.dialog('close');
            }
        }
    });
    
    var unsaved = $('#unsavedDialog');
    unsaved.dialog({
        title: 'Unsaved Changes',
        modal: true,
        resizable: false,
        height: 150,
        width: 300,
        autoOpen: false,
        buttons: {
            'Save': function() {
                unsaved.dialog('close');
                w.fileManager.saveDocument();
            },
            'New Document': function() {
                window.location = 'index.htm';
            }
        }
    });
    
    $files.on('click', 'li', function() {
        $files.find('ul').css({borderColor: '#fff'});
        var remove = $(this).hasClass('selected');
        $files.find('li').removeClass('selected');
        if (!remove) $(this).addClass('selected');
    });
    $files.on('dblclick', 'li', function() {
        var $this = $(this);
        $files.find('li').removeClass('selected');
        $this.addClass('selected');
        loader.dialog('close');
        var fileName = $this.data('uri');
        var docType = $this.parents('div').data('type');
        _doLoad(fileName, docType);
    });
    
    /**
     * @memberOf dfm
     */
    dfm.showLoader = function() {
        $files.css({borderColor: '#fff'});
        $files.find('li').removeClass('selected');
        $files.find('ul').html('<li class="unselectable last"><span class="loading" /></li>');
        loader.dialog('open');
        w.delegator.getDocuments(function(docs) {
            docNames = docs;
            _populateLoader(docs, 0);
        });
        w.delegator.getTemplates(function(docs) {
            _populateLoader(docs, 1);
        });
    };
    
    dfm.showSaver = function() {
        w.delegator.getDocuments(function(docs) {
            docNames = docs;
        });
        saver.dialog('open');
    };
    
    dfm.showUnsaved = function() {
        unsaved.dialog('open');
    };
    
    function _doLoad(filename, type) {
        if (type === 'template') {
            w.fileManager.loadTemplate(filename);
        } else {
            w.fileManager.loadDocument(filename);
        }
    }
    
    function _populateLoader(data, columnIndex) {
        var formattedResults = '';
        var last = '';
        var d, i;
        for (i = 0; i < data.length; i++) {
            d = data[i];
            
            if (i == data.length - 1) last = 'last';
            else last = '';
            
            var uri, label;
            if ($.isPlainObject(d)) {
                uri = d.path;
                label = d.name;
            } else {
                uri = label = d;
            }
            
            formattedResults += '<li class="unselectable '+last+'" data-uri="'+uri+'">';
            formattedResults += '<span>'+label+'</span>';
            formattedResults += '</li>';
        }
        
        $files.find('ul').eq(columnIndex).html(formattedResults);
    };
    
    function _isNameValid(name) {
        return name.match(/[^A-Za-z]+/) == null;
    };
    
    return dfm;
};

});