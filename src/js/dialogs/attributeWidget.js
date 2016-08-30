define(['jquery'], function($) {

function AttributeWidget(config) {
    this.w = config.writer;
    this.parentId = config.parentId;
    this.dialogForm = config.dialogForm;
    
    this.showSchemaHelp = config.showSchemaHelp === true ? true : false;
    var schemaHelpEl = '';
    if (this.showSchemaHelp) {
        schemaHelpEl = '<div class="schemaHelp"></div>';
    }
    
    this.mode = AttributeWidget.ADD;
    
    this.isDirty = false;
    
    this.$parent = $('#'+this.parentId);
    this.$parent.addClass('attributeWidget');
    this.$parent.append(''+
    '<div class="attributeSelector">'+
        '<h2>Attributes</h2>'+
        '<ul></ul>'+
    '</div>'+
    '<div class="attsContainer">'+
        '<div class="level1Atts"></div>'+
        '<div class="highLevelAtts"></div>'+
        schemaHelpEl+
    '</div>');
    
    // add listeners for other form elements
    $('[data-mapping]', this.dialogForm.$el).each($.proxy(function(index, el) {
        var formEl = $(el);
        var type = formEl.data('type');
        var mapping = formEl.data('mapping');
        var isCustom = mapping.indexOf('custom.') === 0;
        if (!isCustom) {
            var changeEl;
            if (type === 'radio') {
                changeEl = $('input', formEl);
            } else if (type === 'textbox' || type === 'select') {
                changeEl = formEl;
            }
            if (changeEl !== undefined) {
                changeEl.change($.proxy(function(mapping, e) {
                    var dataObj = {};
                    dataObj[mapping] = $(e.target).val();
                    this.setData(dataObj);
                }, this, mapping));
            }
        }
    }, this));
}

AttributeWidget.ADD = 0;
AttributeWidget.EDIT = 1;

AttributeWidget.disallowedAttributes = ['annotationid', 'offsetid'];

AttributeWidget.prototype = {
    constructor: AttributeWidget,
    
    buildWidget: function(atts, previousVals, tag) {
        previousVals = previousVals || {};
        
        $('.attributeSelector ul, .level1Atts, .highLevelAtts, .schemaHelp', this.$parent).empty();
        isDirty = false;
        
        if (this.showSchemaHelp && tag !== undefined) {
            var helpText = this.w.editor.execCommand('getDocumentationForTag', tag);
            if (helpText != '') {
                $('.schemaHelp', this.$parent).html('<h3>'+tag+' Documentation</h3><p>'+helpText+'</p>');
            }
        }
        
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
            
            if (AttributeWidget.disallowedAttributes.indexOf(att.name.toLowerCase()) === -1) {
                var display = 'block';
                var requiredClass = isRequired ? ' required' : '';
                if (this.mode == AttributeWidget.EDIT && previousVals[att.name]) {
                    display = 'block';
                    attributeSelector += '<li data-name="'+att.name+'" class="selected'+requiredClass+'">'+att.name+'</li>';
                } else {
                    display = 'none';
                    attributeSelector += '<li data-name="'+att.name+'" class="'+requiredClass+'">'+att.name+'</li>';
                }
                currAttString += '<div data-name="form_'+att.name+'" style="display:'+display+';"><label>'+att.name+'</label>';
                if (att.documentation != '') {
                    currAttString += '<ins class="ui-icon ui-icon-help" title="'+att.documentation+'">&nbsp;</ins>';
                }
                currAttString += '<br/>';
                if (this.mode == AttributeWidget.EDIT) att.defaultValue = previousVals[att.name] || '';
                // TODO add list support
//                if ($('list', attDef).length > 0) {
//                    currAttString += '<input type="text" name="'+att.name+'" value="'+att.defaultValue+'"/>';
//                } else if ($('choice', attDef).length > 0) {
                if (att.choices) {
                    currAttString += '<select name="'+att.name+'">';
                    var attVal, selected;
                    for (var j = 0; j < att.choices.length; j++) {
                        attVal = att.choices[j];
                        selected = att.defaultValue == attVal ? ' selected="selected"' : '';
                        currAttString += '<option value="'+attVal+'"'+selected+'>'+attVal+'</option>';
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
        
        $('.attributeSelector ul', this.$parent).html(attributeSelector);
        $('.level1Atts', this.$parent).html(level1Atts);
        $('.highLevelAtts', this.$parent).html(highLevelAtts);
        
        $('.attributeSelector li', this.$parent).click(function() {
            var name = $(this).data('name').replace(/:/g, '\\:');
            var div = $('[data-name="form_'+name+'"]', this.$parent);
            $(this).toggleClass('selected');
            if ($(this).hasClass('selected')) {
                div.show();
            } else {
                div.hide();
            }
        });
        
        $('ins', this.$parent).tooltip({
            tooltipClass: 'cwrc-tooltip'
        });
        
        $('input, select, option', this.$parent).change(function(event) {
            isDirty = true;
        });
//        .keyup(function(event) {
//            if (event.keyCode == '13') {
//                event.preventDefault();
//                if (isDirty) t.result();
//                else t.cancel(); 
//            }
//        });
        
        $('select, option', this.$parent).click(function(event) {
            isDirty = true;
        });
    },
    reset: function() {
        $('.attributeSelector li', this.$parent).each(function(el, index) {
            $(this).removeClass('selected');
            var name = $(this).data('name').replace(/:/g, '\\:');
            var div = $('[data-name="form_'+name+'"]', this.$parent);
            div.hide();
        });
        $('.attsContainer input, .attsContainer select', this.$parent).val('');
    },
    setData: function(data) {
        var wasDataSet = false;
        
        for (var key in data) {
            var val = data[key];
            wasDataSet = true;
            $('.attributeSelector li[data-name="'+key+'"]', this.$parent).addClass('selected');
            var div = $('[data-name="form_'+key+'"]', this.$parent);
            $('input, select', div).val(val);
            div.show();
        }
        
        return wasDataSet;
    },
    getData: function() {
        // collect values then close dialog
        var attributes = {};
        $('.attsContainer > div > div:visible', this.$parent).children('input[type!="hidden"], select').each(function(index, el) {
            var val = $(this).val();
            if (val !== '') { // ignore blank values
                attributes[$(this).attr('name')] = val;
            }
        });
        
        // validation
        var invalid = [];
        $('.attsContainer span.required', this.$parent).parent().children('label').each(function(index, el) {
            if (attributes[$(this).text()] == '') {
                invalid.push($(this).text());
            }
        });
        if (invalid.length > 0) {
            for (var i = 0; i < invalid.length; i++) {
                var name = invalid[i];
                $('.attsContainer *[name="'+name+'"]', this.$parent).css({borderColor: 'red'}).keyup(function(event) {
                    $(this).css({borderColor: '#ccc'});
                });
            }
            return;
        }
        
        return attributes;
    },
    expand: function() {
        this.$parent.parent('[data-transform="accordion"]').accordion('option', 'active', 0);
    },
    collapse: function() {
        this.$parent.parent('[data-transform="accordion"]').accordion('option', 'active', false);
    },
    destroy: function() {
        try {
            $('ins', this.$parent).tooltip('destroy');
        } catch (e) {
            if (console) console.log('error destroying tooltip');
        }
    }
};

return AttributeWidget;

});