define([], function() {

module("delegator.js tests", {
	setup : function() {
		writer.currentDocId = null;
		var url = writer.cwrcRootUrl + 'xml/sample_letter.xml';
		$.ajax({
			url : url,
			dataType : 'xml',
			success : function(data, status, xhr) {
				window.location.hash = '#sample_letter';
				var rdf = data.createElement('rdf:RDF');
				var root;
				if (data.childNodes) {
					root = data.childNodes[data.childNodes.length - 1];
				} else {
					root = data.firstChild;
				}
				$(root).prepend(rdf);
				writer.fileManager.processDocument(data);
			},
			error : function(xhr, status, error) {
				if (console) {
					console.log(status);
				}
			}
		});
	},
	teardown : function() {
		writer.editor.setContent('');
	}
});

asyncTest('VIAF entity lookup', function() {
	function test() {
		writer.delegator.lookupEntity({
			lookupService: "viaf",
			query: "Miquel",
			type: "person"
		}, function(results) {
			start();
			ok(results !== null);
		});
		
		writer.event('documentLoaded').unsubscribe(test);
	}
	writer.event('documentLoaded').subscribe(test);
});

asyncTest('Validation', function() {
	function test() {
		writer.delegator.validate(function(isValid) {
			start();
			ok(isValid !== null);
		});
		
		writer.event('documentLoaded').unsubscribe(test);
	}
	writer.event('documentLoaded').subscribe(test);
});

});