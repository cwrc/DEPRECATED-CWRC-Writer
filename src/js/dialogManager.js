define([
    'jquery',
    'jquery-ui',
    'dialogs/addEvent','dialogs/addOrg','dialogs/addPerson','dialogs/addPlace',
    'dialogs/citation','dialogs/correction','dialogs/date','dialogs/fileManager',
    'dialogs/header','dialogs/keyword','dialogs/link','dialogs/message',
    'dialogs/note','dialogs/person','dialogs/place','dialogs/search','dialogs/title','dialogs/triple'
], function($, jqueryui,
		AddEvent, AddOrg, AddPerson, AddPlace, Citation, Correction, DateDialog, FileManager,
		Header, Keyword, Link, Message, Note, Person, Place, Search, Title, Triple
) {

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

return function(writer) {	
	var currentType = null;
	
	var dialogs = {
		message: new Message(writer),
		search: new Search(writer),
		note: new Note(writer),
		citation: new Citation(writer),
		correction: new Correction(writer),
		keyword: new Keyword(writer),
		title: new Title(writer),
		date: new DateDialog(writer),
		link: new Link(writer),
		addperson: new AddPerson(writer),
		addplace: new AddPlace(writer),
		addevent: new AddEvent(writer),
		addorg: new AddOrg(writer),
		triple: new Triple(writer),
		header: new Header(writer),
		filemanager: new FileManager(writer),
		person: new Person(writer),
		place: new Place(writer)
	};
	
//	dialogs.person = dialogs.search;
//	dialogs.place = dialogs.search;
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

});