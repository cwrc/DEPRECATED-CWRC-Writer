define([], function() {

module("eventManager.js tests", {
	setup : function() {
		
	},
	teardown : function() {
		
	}
});

test('Create event', function() {
	var event = writer.event('testEvent');
	ok(event.event === 'testEvent');
});

test('Pub/Sub test', function() {
	function subTest(msg) {
		ok(msg === 'pubSubOk');
	}
	writer.event('testEvent').subscribe(subTest);
	writer.event('testEvent').publish('pubSubOk');
});

});