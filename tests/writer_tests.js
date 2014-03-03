define([], function() {

module("writer.js tests", {
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

asyncTest('load file test1', function() {
	function test() {
		start();
		var content = writer.editor.getContent();
		ok(content.indexOf("Bull") !== -1, '"Bull" is present.');
		writer.event('documentLoaded').unsubscribe(test);
	}
	writer.event('documentLoaded').subscribe(test);
});

asyncTest('load file test2', function() {
	function test() {
		start();
		var content = writer.editor.getContent();
		ok(content.indexOf("train") !== -1, '"train" is present.');
		writer.event('documentLoaded').unsubscribe(test);
	}
	writer.event('documentLoaded').subscribe(test);
});

});