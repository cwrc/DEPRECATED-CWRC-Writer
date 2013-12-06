// add event listeners to all of our jquery ui dialogs
// wrapping our dialogs in the cwrc css scope

$.extend($.ui.dialog.prototype.options, {
	create: function(event) {
		$(event.target).on('dialogopen', function(event) {
			$(event.target).parent('.ui-dialog').prev('.ui-widget-overlay').andSelf().wrapAll('<div class="cwrc" />');
		}).on('dialogclose', function(event) {
			$(event.target).parent('.ui-dialog').unwrap();
		});
	}
});

function DialogManager(config) {
	var w = config.writer;
	
	var currentType = null;
	
	var dialogs = {
		message: new MessageDialog(config),
		search: new SearchDialog(config),
		note: new NoteDialog(config),
		citation: new CitationDialog(config),
		correction: new CorrectionDialog(config),
		keyword: new KeywordDialog(config),
		title: new TitleDialog(config),
		date: new DateDialog(config),
		link: new LinkDialog(config),
		addperson: new AddPersonDialog(config),
		addplace: new AddPlaceDialog(config),
		addevent: new AddEventDialog(config),
		addorg: new AddOrganizationDialog(config),
		triple: new TripleDialog(config),
		header: new HeaderDialog(config),
		filemanager: new FileManagerDialogs(config),
		person: new PersonDialog(config)
	};
	
//	dialogs.person = dialogs.search;
	dialogs.place = dialogs.search;
	dialogs.event = dialogs.search;
	dialogs.org = dialogs.search;
	
	var pm = {
		/**
		 * @memberOf pm
		 */
		getCurrentType: function() {
			return currentType;
		},
		show: function(type, config) {
			if (dialogs[type]) {
				currentType = type;
				dialogs[type].show(config);
			}
		},
		confirm: function(config) {
			currentType = 'message';
			dialogs.message.confirm(config);
		},
		hideAll: function() {
			for (var key in dialogs) {
				dialogs[key].hide();
			}
		}
	};
	
	$.extend(pm, dialogs);
	
	return pm;
};