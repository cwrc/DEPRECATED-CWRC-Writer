module( "filemanager.js tests", {
  setup: function() {
    writer.currentDocId = null;
	var url = writer.cwrcRootUrl+'xml/sample_letter.xml';
	$.ajax({
			url: writer.cwrcRootUrl+'xml/sample_letter.xml',
			dataType: 'xml',
			success: function(data, status, xhr) {			
				window.location.hash = '#sample_letter';
				var rdf = data.createElement('rdf:RDF');
				var root;
				if (data.childNodes) {
					root = data.childNodes[data.childNodes.length-1];
				} else {
					root = data.firstChild;
				}
				$(root).prepend(rdf);
				writer.fm.processDocument(data);
			},
			error: function(xhr, status, error) {
				if (console) console.log(status);
			}
		});
  }, teardown: function() {
    ok( true, "and one extra assert after each test" );
  }
});

test( "a basic test example", function() {
  ok(writer.editor.getContent().indexOf("Bull") !== -1)
});

test( "a basic test example 2", function() {
  ok(writer.editor.getContent().indexOf("train") !== -1)
});

test( "hello test", function() {
  ok(writer.editor.getContent().indexOf("Bergen") !== -1)
});