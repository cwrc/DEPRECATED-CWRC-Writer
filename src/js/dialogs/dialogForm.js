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
	
	this.type = config.type;
	this.tag = config.tag;
	this.mode = null;
	this.currentData = null;
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
		this.attributesWidget = new AttributeWidget({writer: this.w, parentId: id+'_teiParent'});
		this.attWidgetInit = false;
	}, this));
}

DialogForm.ADD = 0;
DialogForm.EDIT = 1;

DialogForm.processForm = function(dialogInstance) {
	$('[data-type]', dialogInstance.$el).each(function(index, el) {
		var formEl = $(this);
		var type = formEl.data('type');
		var mapping = formEl.data('mapping');
		switch (type) {
			case 'radio':
				dialogInstance.currentData[mapping] = formEl.find('input:checked').val();
				break;
			case 'textbox':
			case 'select':
				dialogInstance.currentData[mapping] = formEl.val();
				break;
			case 'attributes':
				dialogInstance.currentData[mapping] = dialogInstance.attributesWidget.getData();
				break;
		}
	});
	
	for (var key in dialogInstance.currentData) {
		if (dialogInstance.currentData[key] == undefined || dialogInstance.currentData[key] == '') {
			delete dialogInstance.currentData[key];
		}
	}
};

function initAttributeWidget(dialogInstance) {
	var atts = dialogInstance.w.utilities.getChildrenForTag({tag: dialogInstance.tag, type: 'attribute', returnType: 'array'});
	for (var i = 0; i < atts.length; i++) {
		atts[i].parent = dialogInstance.tag;
	}
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
		
		this.currentData = {};
		
		if (this.mode === DialogForm.ADD) {
			if (config.cwrcInfo != null) {
				$('[data-type="tagAs"]', this.$el).html(config.cwrcInfo.name);
				this.currentData.cwrcInfo = config.cwrcInfo;
			}
		} else if (this.mode === DialogForm.EDIT) {
			this.currentId = config.entry.props.id;
			
			var data = config.entry.info;
			
			if (data.cwrcInfo != null) {
				this.currentData.cwrcInfo = data.cwrcInfo;
				$('[data-type="tagAs"]', this.$el).html(data.cwrcInfo.name);
			}
			
			var that = this;
			$('[data-type]', this.$el).each(function(index, el) {
				var formEl = $(this);
				var type = formEl.data('type');
				var mapping = formEl.data('mapping');
				var value = data[mapping];
				if (value != null) {
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
						case 'attributes':
							if (value[that.tag] == null) {
								value[that.tag] = {};
							}
							var showWidget = that.attributesWidget.setData(value);
							if (showWidget) {
								formEl.parents('[data-transform="accordion"]').accordion('option', 'active', 0);
							}
							break;
					}
				}
			});
		}
		
		this.$el.trigger('beforeShow', [config]);
		
		this.$el.dialog('open');
	},
	
	save: function() {
		DialogForm.processForm(this);
		
		this.$el.trigger('beforeSave', [this]);
		this.$el.trigger('beforeClose');
		this.$el.dialog('close');
		
		if (this.mode === DialogForm.EDIT && this.currentData != null) {
			this.w.tagger.editEntity(this.currentId, this.currentData);
		} else {
			this.w.tagger.finalizeEntity(this.type, this.currentData);
		}
	}
};

return DialogForm;

});