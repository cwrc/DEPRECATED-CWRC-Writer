define([
    'jquery',
    'jquery-ui',
], function($, jqueryUi) {
    
return function(writer) {
    var w = writer;
    
    var ADD = 0;
    var EDIT = 1;
    var mode = null;
    
    var tag = null;
    var currentTagName = null;
    var isDirty = false;
    var action = null;
    
    $(document.body).append(''+
    '<div id="schemaDialog" class="attributeWidget">'+
        '<div class="attributeSelector"><h2>Attributes</h2><ul></ul></div>'+
        '<div class="attsContainer">'+
            '<div class="level1Atts"></div>'+
            '<div class="highLevelAtts"></div>'+
        '</div>'+
        '<div class="schemaHelp"></div>'+
    '</div>');
    
    var dialogOpenTimestamp = null;
    
    var schemaDialog = $('#schemaDialog');
    schemaDialog.dialog({
        modal: true,
        resizable: true,
        dialogClass: 'splitButtons',
        closeOnEscape: false,
        height: 460,
        width: 550,
        minHeight: 400,
        minWidth: 510,
        autoOpen: false,
        open: function(event, ui) {
            dialogOpenTimestamp = event.timeStamp;
            schemaDialog.parent().find('.ui-dialog-titlebar-close').hide();
        },
        beforeClose: function(event, ui) {
            if (event.timeStamp - dialogOpenTimestamp < 150) {
                // if the dialog was opened then closed immediately it was unintentional
                return false;
            }
        },
        buttons: [{
            text: 'Cancel',
            click: function() {
                cancel();
            }
        },{
            id: 'schemaOkButton',
            text: 'Ok',
            click: function() {
                formResult();
            }
        }]
    });
    
    var buildForm = function(tagName, tagPath) {
        isDirty = false;
        
        $('.attributeSelector ul, .level1Atts, .highLevelAtts, .schemaHelp', schemaDialog).empty();
        
        var helpText = w.editor.execCommand('getDocumentationForTag', tagName);
        if (helpText != '') {
            $('.schemaHelp', schemaDialog).html('<h3>'+tagName+' Documentation</h3><p>'+helpText+'</p>');
        }
        
        var structsEntry = null;
        if (mode === EDIT) {
            structsEntry = w.structs[$(tag).attr('id')];
        }
        
        var atts = w.utilities.getChildrenForTag({tag: tagName, path: tagPath, type: 'attribute', returnType: 'array'});
        
        // sort by required, then by name
        atts.sort(function(a,b) {
           if (a.required && !b.required) {
               return -1;
           } else if (!a.required && b.required) {
               return 1;
           } else {
               if (a.name > b.name) {
                   return 1;
               } else if (a.name < b.name) {
                   return -1;
               }
           }
           return 0;
        });
        
        // build atts
        var level1Atts = '';
        var highLevelAtts = '';
        var attributeSelector = '';
        var att, currAttString;
        var isRequired = false;
        for (var i = 0; i < atts.length; i++) {
            att = atts[i];
            currAttString = '';
            isRequired = att.required;
            
            if (att.name.toLowerCase() !== 'id' && att.name !== w.idName) {
                var display = 'block';
                var requiredClass = isRequired ? ' required' : '';
                if (mode === EDIT && structsEntry[att.name]) {
                    display = 'block';
                    attributeSelector += '<li id="select_'+att.name+'" class="selected'+requiredClass+'">'+att.name+'</li>';
                } else {
                    display = 'none';
                    attributeSelector += '<li id="select_'+att.name+'" class="'+requiredClass+'">'+att.name+'</li>';
                }
                currAttString += '<div id="form_'+att.name+'" style="display:'+display+';"><label>'+att.name+'</label>';
                if (att.documentation != '') {
                    currAttString += '<ins class="ui-icon ui-icon-help" title="'+att.documentation+'">&nbsp;</ins>';
                }
                currAttString += '<br/>';
                if (mode === EDIT) att.defaultValue = structsEntry[att.name] || '';
                // TODO add list support
//                if ($('list', attDef).length > 0) {
//                    currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
//                } else if ($('choice', attDef).length > 0) {
                if (att.choices) {
                    currAttString += '<select name="'+att.name+'">';
                    var attVal, selected;
                    for (var j = 0; j < att.choices.length; j++) {
                        attVal = att.choices[j];
                        if (typeof attVal === 'object') {
                            attVal = attVal['#text'];
                        }
                        if (attVal !== undefined) {
                            selected = att.defaultValue == attVal ? ' selected="selected"' : '';
                            currAttString += '<option value="'+attVal+'"'+selected+'>'+attVal+'</option>';
                        }
                    }
                    currAttString += '</select>';
//                } else if ($('ref', attDef).length > 0) {
//                    currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
                } else {
                    currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
                }
                if (isRequired) currAttString += ' <span class="required">*</span>';
                currAttString += '</div>';
                
                if (isRequired) {
                    level1Atts += currAttString;
                } else {
                    highLevelAtts += currAttString;
                }
            }
        }
        
        $('.attributeSelector ul', schemaDialog).html(attributeSelector);
        $('.level1Atts', schemaDialog).html(level1Atts);
        $('.highLevelAtts', schemaDialog).html(highLevelAtts);
        
        $('.attributeSelector li', schemaDialog).click(function() {
            var name = $(this).attr('id').split('select_')[1].replace(/:/g, '\\:');
            var div = $('#form_'+name);
            $(this).toggleClass('selected');
            if ($(this).hasClass('selected')) {
                div.show();
            } else {
                div.hide();
            }
        });
        
        $('ins', schemaDialog).tooltip({
            tooltipClass: 'cwrc-tooltip'
        });
        
        $('input, select, option', schemaDialog).change(function(event) {
            isDirty = true;
        }).keyup(function(event) {
            if (event.keyCode == '13') {
                event.preventDefault();
                if (isDirty) formResult();
                else cancel(); 
            }
        });
        
        $('select, option', schemaDialog).click(function(event) {
            isDirty = true;
        });
    };
    
    var formResult = function() {
        var t = this;
        
        // collect values then close dialog
        var attributes = {};
        $('.attsContainer > div > div:visible', schemaDialog).children('input[type!="hidden"], select').each(function(index, el) {
            var val = $(this).val();
            if (val != '') { // ignore blank values
                attributes[$(this).attr('name')] = val;
            }
        });
        
        // validation
        var invalid = [];
        $('.attsContainer span.required', schemaDialog).parent().children('label').each(function(index, el) {
            if (attributes[$(this).text()] == '') {
                invalid.push($(this).text());
            }
        });
        if (invalid.length > 0) {
            for (var i = 0; i < invalid.length; i++) {
                var name = invalid[i];
                $('.attsContainer *[name="'+name+'"]', schemaDialog).css({borderColor: 'red'}).keyup(function(event) {
                    $(this).css({borderColor: '#ccc'});
                });
            }
            return;
        }
        
        attributes._tag = currentTagName;
        
        schemaDialog.dialog('close');
        // check if beforeClose cancelled or not
        if (schemaDialog.is(':hidden')) {
            try {
                $('ins', schemaDialog).tooltip('destroy');
            } catch (e) {
                if (console) console.log('error destroying tooltip');
            }
            
            switch (mode) {
                case ADD:
                    w.editor.execCommand('addStructureTag', {bookmark: w.editor.currentBookmark, attributes: attributes, action: action});
                    break;
                case EDIT:
                    w.editor.execCommand('editStructureTag', tag, attributes);
                    tag = null;
            }
        }
    };
    
    var cancel = function() {
        var t = this;
        schemaDialog.dialog('close');
        // check if beforeClose cancelled or not
        if (schemaDialog.is(':hidden')) {
            w.editor.selection.moveToBookmark(w.editor.currentBookmark);
            w.editor.currentBookmark = null;
            try {
                $('#schemaDialog ins').tooltip('destroy');
            } catch (e) {
                if (console) console.log('error destroying tooltip');
            }
        }
    };
    
    return {
        show: function(config) {
            var tagName = config.tagName;
            var tagPath = config.tagPath;
            
            w.editor.getBody().blur(); // lose keyboard focus in editor
            
            currentTagName = tagName;
            
            buildForm(tagName, tagPath);
            
            schemaDialog.dialog('option', 'title', tagName);
            schemaDialog.dialog('open');
            
            // TODO contradicting focuses
            $('#schemaOkButton').focus();
            $('input, select', schemaDialog).first().focus();
        },
        
        addSchemaTag: function(params) {
            var key = params.key;
            var parentTag = params.parentTag;
            action = params.action;
            
            if (key === w.header) {
                w.dialogManager.show('header');
                return;
            } else {
                var type = w.schemaManager.mapper.getEntityTypeForTag(key);
                if (type != null) {
                    w.tagger.addEntity(type);
                    return;
                }
            }
            
            var tagId = w.editor.currentBookmark.tagId;
            w.editor.selection.moveToBookmark(w.editor.currentBookmark);
            
            var valid = w.utilities.isSelectionValid(true, action);
            if (valid !== w.VALID) {
                w.dialogManager.show('message', {
                    title: 'Error',
                    msg: 'Please ensure that the beginning and end of your selection have a common parent.<br/>For example, your selection cannot begin in one paragraph and end in another, or begin in bolded text and end outside of that text.',
                    type: 'error'
                });
                return;
            }
            
            // reset bookmark after possible modification by isSelectionValid
            w.editor.currentBookmark = w.editor.selection.getBookmark(1);
            if (tagId != null) {
                w.editor.currentBookmark.tagId = tagId;
            }
            
            if (parentTag === undefined || parentTag.length === 0) {
                var selectionParent = w.editor.currentBookmark.rng.commonAncestorContainer;
                if (selectionParent.nodeType === Node.TEXT_NODE) {
                    parentTag = $(selectionParent).parent();
                } else {
                    parentTag = $(selectionParent);
                }
            }
            
            var path = w.editor.writer.utilities.getElementXPath(parentTag[0]);
            path += '/'+key;
            
            mode = ADD;
            this.show({tagName: key, tagPath: path});
        },
        
        editSchemaTag: function($tag) {
            var tagName = $tag.attr('_tag');
            if (tagName == w.header) {
                w.dialogManager.show('header');
                return;
            }
            
            var path = w.utilities.getElementXPath($tag[0]);
            
            currentTagName = tagName;
            tag = $tag;
            mode = EDIT;
            this.show({tagName: tagName, tagPath: path});
        },
        
        changeSchemaTag: function(params) {
            currentTagName = params.key;
            tag = params.tag;
            var path = w.utilities.getElementXPath(params.tag[0]);
            mode = EDIT;
            this.show({tagName: params.key, tagPath: path});
        }
    };
};

});