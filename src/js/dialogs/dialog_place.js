var PlaceDialog = function(config) {
	var w = config.writer;
	
	var id = 'place';
	
	var SAVE_LABEL = 'Save';
	var SAVE_ADD_LABEL = 'Save & add further info';
	var ADD_LABEL = 'Add new place';
	
	var mode = null;
	var ADD = 0;
	var EDIT = 1;
	
	var currentId = null;
	var currentData = null;
	
	var mapWidget = null;
	
	var processData = function() {
		function processDate(dateString) {
			var dateParts = dateString.split('-');
			switch (dateParts.length) {
				case 1:
					currentData.birthDate = dateString;
					break;
				case 2:
					currentData.birthDate = dateParts[0];
					currentData.deathDate = dateParts[1];
					break;
			}
		}
		
		var nameParts = currentData.name.split(/,\s*/);
		switch (nameParts.length) {
			case 1:
				currentData.lastName = currentData.name;
				break;
			case 2:
				if (nameParts[1].match(/\d+-/) != null) {
					processDate(nameParts[1]);
					nameParts = nameParts[0].split(/\s/);
					currentData.firstName = nameParts[0];
					currentData.lastName = nameParts[1];
				} else {
					currentData.lastName = nameParts[0];
					currentData.firstName = nameParts[1];
				}
				break;
			case 3:
				currentData.lastName = nameParts[0];
				currentData.firstName = nameParts[1];
				var date = nameParts[2];
				processDate(date);
				break;
		}
		if (currentData.date) {
			processDate(currentData.date);
		}
		
		currentData.certainty = $('#'+id+'_certainty input:checked').val();
		
		for (var key in currentData) {
			if (currentData[key] == undefined || currentData[key] == '') {
				delete currentData[key];
			}
		}
	};
	
	var onSearchClick = function(data, source, selected) {
		var tagAs = $('#'+id+'_tagAs span');
		var label = '';
		if (selected) {
			currentData = data;
			if (source == 'cwrc') {
				label = SAVE_LABEL;
			} else {
				label = SAVE_ADD_LABEL;
			}
			tagAs.html(data.name);
		} else {
			currentData = null;
			label = ADD_LABEL;
			tagAs.empty();
		}
		$('#'+id+'SaveButton').button('option', 'label', label);
		
		var point = new google.maps.LatLng(data.lat, data.lng);
		mapWidget.setCenter(point);
		mapWidget.setZoom(10);
	};
	
	var onSaveClick = function() {
		var buttonLabel = $('#'+id+'SaveButton').button('option', 'label');
		switch (buttonLabel) {
			case SAVE_LABEL:
				processData();
				dialog.dialog('close');
				break;
			case SAVE_ADD_LABEL:
				processData();
				dialog.dialog('close');
				w.dialogs.show('addplace', {writer: w, data: currentData});
				break;
			case ADD_LABEL:
				dialog.dialog('close');
				w.dialogs.show('addplace', {writer: w});
				break;
		}
		
		if (mode == EDIT && currentData != null) {
			w.tagger.editEntity(currentId, currentData);
		} else {
			w.tagger.finalizeEntity('person', currentData);
		}
		currentId = null;
		currentData = null;
	};
	
	$(document.body).append(''+
	'<div id="'+id+'Dialog" class="annotationDialog">'+
		'<div class="leftPanel">'+
			'<div id="'+id+'_searchParent" style="height: 450px;"></div>'+
			'<div id="'+id+'_certainty">'+
		    	'<p>This identification is:</p>'+
				'<input type="radio" id="'+id+'_definite" name="'+id+'_id_certainty" value="definite" /><label for="'+id+'_definite">Definite</label>'+
				'<input type="radio" id="'+id+'_reasonable" name="'+id+'_id_certainty" value="reasonable" /><label for="'+id+'_reasonable">Reasonably Certain</label>'+
				'<input type="radio" id="'+id+'_speculative" name="'+id+'_id_certainty" value="speculative" /><label for="'+id+'_speculative">Speculative</label>'+
		    '</div>'+
	//	    '<div>'+
	//		    '<h3>TEI options</h3>'+
	//		    '<div id="'+id+'_teiParent" style="position: relative; height: 200px;">'+
	//		    '</div>'+
	//		'</div>'+
	    '</div>'+
	    '<div class="rightPanel">'+
	    	'<div id="'+id+'_gmap" style="width: 100%; height: 50%;"></div>'+
	    	'<div id="'+id+'_tagAs">'+
		    	'<p>Tag as:</p>'+
		    	'<span></span>'+
		    '</div>'+
	    '</div>'+
	'</div>'+
	'<script src="http://maps.googleapis.com/maps/api/js?sensor=false&callback=writer.dialogs.place.initMap"></script>'+
	'');
	
	var dialog = $('#'+id+'Dialog');
	dialog.dialog({
		title: 'Tag Place',
		modal: true,
		resizable: true,
		dialogClass: 'splitButtons',
		closeOnEscape: false,
		open: function(event, ui) {
			dialog.parent().find('.ui-dialog-titlebar-close').hide();
			var doc = $(document);
			dialog.dialog('option', 'width', doc.width() - 100);
			dialog.dialog('option', 'height', doc.height() - 100);
			dialog.dialog('option', 'position', { my: "center", at: "center", of: window });
		},
		resizeStop: function(event, ui) {
			google.maps.event.trigger(mapWidget, 'resize');
		},
		height: 650,
		width: 400,
		autoOpen: false,
		buttons: [{
			text: 'Cancel',
			click: function() {
				currentData = null;
				currentId = null;
				dialog.dialog('close');
			}
		},{
			text: ADD_LABEL,
			id: id+'SaveButton',
			click: onSaveClick
		}]
	});
	
	var searchWidget = new SearchWidget({
		writer: w, parentId: id+'_searchParent', type: 'place', title: 'Places',
		datasource: {
			name: 'geonames',
			tmpl: '<span>${name}, ${countryName}<br/><span style="color: #777;">${fcodeName}</span></span>'
		},
		clickHandler: onSearchClick
	});
	
	$('#'+id+'_certainty').buttonset();
	
	return {
		show: function(config) {
			mode = config.entry ? EDIT : ADD;
			
			// reset the form
			$('#'+id+'_certainty input:checked').prop('checked', false).button('refresh');
			$('#'+id+'SaveButton').button('option', 'label', 'Add new place');
			
			var query;
			if (mode == EDIT) {
				var data = config.entry.info;
				currentId = config.entry.props.id;
				query = data.name;
				$('#'+id+'_certainty input[value="'+data.certainty+'"]').prop('checked', true).button('refresh');
			} else {
				query = w.editor.currentBookmark.rng.toString();
			}
			searchWidget.populateSearch(query);
			
			dialog.dialog('open');
			
			google.maps.event.trigger(mapWidget, 'resize');
		},
		initMap: function() {
			mapWidget = new google.maps.Map($('#'+id+'_gmap')[0], {
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				streetViewControl: false,
				mapTypeControl: false,
				zoom: 3,
			    center: new google.maps.LatLng(43.700, 79.400)
			});
		}
	};
};