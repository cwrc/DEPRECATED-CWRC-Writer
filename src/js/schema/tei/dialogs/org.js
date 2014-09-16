define([
    'jquery',
    'jquery-ui',
    'dialogForm'
], function($, jqueryUi, DialogForm) {
	
return function(writer) {
	var w = writer;
	
	var id = 'org';
	
	var html = ''+
	'<div id="'+id+'Dialog" class="annotationDialog">'+
		'<div id="'+id+'_tagAs">'+
			'<p>Tag as:</p>'+
			'<span class="tagAs" data-type="tagAs"></span>'+
		'</div>'+
		'<div id="'+id+'_certainty" data-transform="buttonset" data-type="radio" data-mapping="certainty">'+
	    	'<p>This identification is:</p>'+
			'<input type="radio" id="'+id+'_definite" name="'+id+'_id_certainty" value="definite" data-default="true" /><label for="'+id+'_definite">Definite</label>'+
			'<input type="radio" id="'+id+'_reasonable" name="'+id+'_id_certainty" value="reasonably certain" /><label for="'+id+'_reasonable">Reasonably Certain</label>'+
			'<input type="radio" id="'+id+'_probable" name="'+id+'_id_certainty" value="probable" /><label for="'+id+'_probable">Probable</label>'+
			'<input type="radio" id="'+id+'_speculative" name="'+id+'_id_certainty" value="speculative" /><label for="'+id+'_speculative">Speculative</label>'+
	    '</div>'+
	    '<div data-transform="accordion">'+
		    '<h3>Markup options</h3>'+
		    '<div id="'+id+'_teiParent" class="attributes" data-type="attributes" data-mapping="attributes">'+
		    '</div>'+
		'</div>'+
	'</div>';
	
	var dialog = new DialogForm({
		writer: w,
		id: id,
		width: 400,
		height: 450,
		type: 'org',
		tag: 'orgName',
		title: 'Tag Organization',
		html: html
	});
	
	$('#'+id+'_certainty input').change(function() {
		dialog.attributesWidget.setData({persName: {cert: $(this).val()}});
	});
	
	return {
		show: function(config) {
			dialog.show(config);
		}
	};
};

});