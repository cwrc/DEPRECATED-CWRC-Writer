define([], function() {

module("entitiesModel.js tests", {
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

asyncTest('Entities type lookups', function() {
	function test() {
		start();
		ok(writer.entitiesModel.isEntity('person') === true, 'isEntity test');
		ok(writer.entitiesModel.getTitle('person') === 'Person', 'getTitle test');
		writer.event('documentLoaded').unsubscribe(test);
	}
	writer.event('documentLoaded').subscribe(test);
});

asyncTest('Mapping tags', function() {
	function test() {
		start();
		
		var entity = {
			info: {
				birthDate: "1909",
				deathDate: "2003",
				firstName: "Miquel",
				lastName: "Batllori",
				name: "Miquel Batllori"
			},
			props: {
				type: 'person'
			}
		};
		var tags = writer.entitiesModel.getMappingTags(entity, 'tei');
		ok(tags[0].indexOf('<person>') !== -1);
		writer.event('documentLoaded').unsubscribe(test);
	}
	writer.event('documentLoaded').subscribe(test);
});

});