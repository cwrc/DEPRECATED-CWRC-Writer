define([
    'jquery',
    'jquery-ui',
    'dialogs/addEvent','dialogs/addOrg','dialogs/addPerson','dialogs/addPlace','dialogs/addSchema',
    'dialogs/citation','dialogs/correction','dialogs/date','dialogs/fileManager',
    'dialogs/header','dialogs/keyword','dialogs/link','dialogs/message',
    'dialogs/note','dialogs/org','dialogs/person','dialogs/place','dialogs/search','dialogs/title','dialogs/triple',
    'dialogs/cwrcPerson','dialogs/cwrcOrg','dialogs/cwrcPlace','dialogs/cwrcTitle','dialogs/cwrcCitation'
], function($, jqueryui,
		AddEvent, AddOrg, AddPerson, AddPlace, AddSchema, Citation, Correction, DateDialog, FileManager,
		Header, Keyword, Link, Message, Note, Org, Person, Place, Search, Title, Triple,
		CwrcPerson, CwrcOrg, CwrcPlace, CwrcTitle, CwrcCitation
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
// do the same for tooltips
$.extend($.ui.tooltip.prototype.options, {
	create: function(event) {
		$(event.target).on('tooltipopen', function(event, ui) {
			$(ui.tooltip).wrap('<div class="cwrc" />');
		}).on('tooltipclose', function(event, ui) {
			$(ui.tooltip).unwrap();
		});
	}
});

return function(writer) {	
	var currentType = null;
	
	var dialogs = {
		message: new Message(writer),
		search: new Search(writer),
		note: new Note(writer),
		correction: new Correction(writer),
		keyword: new Keyword(writer),
		date: new DateDialog(writer),
		link: new Link(writer),
//		addperson: new AddPerson(writer),
		addplace: new AddPlace(writer),
		addevent: new AddEvent(writer),
//		addorg: new AddOrg(writer),
		triple: new Triple(writer),
		header: new Header(writer),
		filemanager: new FileManager(writer),
		person: new CwrcPerson(writer), // cwrcDialogs lookup
		tagPerson: new Person(writer), // CWRCWriter tagger
		org: new CwrcOrg(writer), // cwrcDialogs lookup
		tagOrg: new Org(writer), // CWRCWriter tagger
		title: new CwrcTitle(writer), // cwrcDialogs lookup
		tagTitle: new Title(writer), // CWRCWriter tagger
		citation: new CwrcCitation(writer), // cwrcDialogs lookup
		tagCitation: new Citation(writer), // CWRCWriter tagger
		place: new CwrcPlace(writer),
		tagPlace: new Place(writer),
		addschema: new AddSchema(writer)
	};
	
	// log in for CWRC-Dialogs
	cD.initializeWithLogin('mark_test', 'P4ssw0rd!');
	
	dialogs.event = dialogs.search;
	
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