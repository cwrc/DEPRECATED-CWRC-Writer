define([
    'jquery',
    'jquery-ui',
    'attributeWidget'
], function($, jqueryUi, AttributeWidget) {

function DialogForm(config) {
    this.w = config.writer;
    var id = config.id;
    var title = config.title;
    var height = config.height || 650;
    var width = config.width || 400;
    var html = config.html;
    var $writer = $('#cwrc_wrapper');
    
    // set to false to cancel saving
    this.isValid = true;
    
    this.type = config.type;
    this.mode = null;
    this.currentData = {
        attributes: {},
        properties: {},
        customValues: {},
        noteContent: {}
    };;
    this.currentId = null;

    $(document.body).append(html);
    
    this.$el = $('#'+id+'Dialog');
    this.$el.dialog({
        title: title,
        modal: true,
        resizable: true,
        dialogClass: 'splitButtons',
        closeOnEscape: false,
        open: $.proxy(function(event, ui) {
            this.$el.parent().find('.ui-dialog-titlebar-close').hide();
        }, this),
        height: height,
        width: width,
        position: { my: "center", at: "center", of: $writer },
        autoOpen: false,
        buttons: [{
            text: 'Cancel',
            click: $.proxy(function() {
                this.$el.trigger('beforeCancel');
                this.$el.trigger('beforeClose');
                this.$el.dialog('close');
            }, this)
        },{
            text: 'Save',
            id: id+'SaveButton',
            click: $.proxy(function() {
                this.save();
            }, this)
        }]
    });
    
    $('[data-transform]', this.$el).each(function(index, el) {
        var formEl = $(this);
        var transform = formEl.data('transform');
        switch (transform) {
            case 'buttonset':
                formEl.buttonset();
                break;
            case 'accordion':
                formEl.accordion({
                    heightStyle: 'content',
                    animate: false,
                    collapsible: true,
                    active: false
                });
                break;
        }
    });
    $('[data-type="attributes"]', this.$el).first().each($.proxy(function(index, el) {
        this.attributesWidget = new AttributeWidget({writer: this.w, parentId: id+'_attParent', dialogForm: this});
        this.attWidgetInit = false;
    }, this));
}

DialogForm.ADD = 0;
DialogForm.EDIT = 1;

DialogForm.processForm = function(dialogInstance) {
    var data = dialogInstance.currentData;
    
    // process attributes first, since other form elements should override them if there's a discrepancy
    if ($('[data-type="attributes"]', dialogInstance.$el).length === 1) {
        var atts = dialogInstance.attributesWidget.getData();
        $.extend(data.attributes, atts);
    }
    
    $('[data-type]', dialogInstance.$el).not('[data-type="attributes"]').each(function(index, el) {
        var formEl = $(this);
        var type = formEl.data('type');
        var mapping = formEl.data('mapping');
        if (mapping !== undefined) {
            var dataKey = 'attributes';
            var isCustom = mapping.indexOf('custom.') === 0;
            var isProperty = mapping.indexOf('prop.') === 0;
            if (isCustom) {
                mapping = mapping.replace(/^custom\./, '');
                dataKey = 'customValues';
            } else if (isProperty) {
                mapping = mapping.replace(/^prop\./, '');
                dataKey = 'properties';
            }
            switch (type) {
                case 'radio':
                    var val = formEl.find('input:checked').val();
                    data[dataKey][mapping] = val;
                    break;
                case 'textbox':
                case 'hidden':
                case 'select':
                    var val = formEl.val();
                    data[dataKey][mapping] = val;
                    break;
            }
        }
    });
    
    for (var key in data.attributes) {
        if (data.attributes[key] === undefined || data.attributes[key] === '') {
            delete data.attributes[key];
        }
    }
};

function initAttributeWidget(dialogInstance) {
    var tag = dialogInstance.w.schemaManager.mapper.getParentTag(dialogInstance.type);
    var atts = dialogInstance.w.utilities.getChildrenForTag({tag: tag, type: 'attribute', returnType: 'array'});
    dialogInstance.attributesWidget.buildWidget(atts);
    dialogInstance.attWidgetInit = true;
};

DialogForm.prototype = {

    constructor: DialogForm,
    
    show: function(config) {
        this.mode = config.entry ? DialogForm.EDIT : DialogForm.ADD;
        
        if (this.attributesWidget != null) {
            if (this.attWidgetInit === false) {
                initAttributeWidget(this);
            }
            this.attributesWidget.reset();
        }
        
        // reset the form
        $('[data-type]', this.$el).each(function(index, el) {
            var formEl = $(this);
            var type = formEl.data('type');
            switch (type) {
                case 'radio':
                    formEl.find('[data-default]').prop('checked', true);
                    if (formEl.data('transform') === 'buttonset') {
                        formEl.find('[data-default]').button('refresh');
                    }
                    break;
                case 'textbox':
                case 'hidden':
                case 'select':
                    formEl.val('');
                    break;
                case 'tagAs':
                    formEl.empty();
                    break;
            }
        });
        $('[data-transform="accordion"]').each(function(index, el) {
            $(this).accordion('option', 'active', false);
        });
        
        this.currentData = {
            attributes: {},
            properties: {},
            customValues: {},
            noteContent: {}
        };
        
        if (this.mode === DialogForm.ADD) {
            if (config.cwrcInfo != null) {
                $('[data-type="tagAs"]', this.$el).html(config.cwrcInfo.name);
                this.currentData.cwrcInfo = config.cwrcInfo;
            }
        } else if (this.mode === DialogForm.EDIT) {
            this.currentId = config.entry.getId();
            
            var data = config.entry.getAttributes();
            
            var cwrcInfo = config.entry.getLookupInfo();
            
            var customValues = config.entry.getCustomValues();
            
            if (cwrcInfo != null) {
                this.currentData.cwrcInfo = cwrcInfo;
                $('[data-type="tagAs"]', this.$el).html(cwrcInfo.name);
            }
            
            var that = this;
            $('[data-type]', this.$el).each(function(index, el) {
                var formEl = $(this);
                var type = formEl.data('type');
                if (type === 'attributes') {
                    var showWidget = that.attributesWidget.setData(data);
                    if (showWidget) {
                        that.attributesWidget.expand();
                    }
                } else {
                    var mapping = formEl.data('mapping');
                    if (mapping !== undefined) {
                        var value;
                        
                        var isCustom = mapping.indexOf('custom.') === 0;
                        var isProperty = mapping.indexOf('prop.') === 0;
                        if (isCustom) {
                            mapping = mapping.replace(/^custom\./, '');
                            value = customValues[mapping];
                        } else if (isProperty) {
                            mapping = mapping.replace(/^prop\./, '');
                            value = config.entry[mapping];
                        } else {
                            value = data[mapping];
                        }
                        
                        if (value !== undefined) {
                            switch (type) {
                                case 'select':
                                    formEl.val(value);
                                    formEl.parents('[data-transform="accordion"]').accordion('option', 'active', 0);
                                    break;
                                case 'radio':
                                    $('input[value="'+value+'"]', formEl).prop('checked', true);
                                    if (formEl.data('transform') === 'buttonset') {
                                        $('input[value="'+value+'"]', formEl).button('refresh');
                                    }
                                    break;
                                case 'textbox':
                                    formEl.val(value);
                                    break;
                            }
                        }
                    }
                }
            });
        }
        
        this.$el.trigger('beforeShow', [config, this]);
        
        this.$el.dialog('open');
    },
    
    save: function() {
        DialogForm.processForm(this);
        
        this.$el.trigger('beforeSave', [this]);
        if (this.isValid === true) {
            this.$el.trigger('beforeClose');
            this.$el.dialog('close');
            
            if (this.mode === DialogForm.EDIT && this.currentData != null) {
                this.w.tagger.editEntity(this.currentId, this.currentData);
            } else {
                this.w.tagger.finalizeEntity(this.type, this.currentData);
            }
        }
    }
};

return DialogForm;

});
