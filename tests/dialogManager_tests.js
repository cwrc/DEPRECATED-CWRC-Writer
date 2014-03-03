define([], function() {

module("dialogManager.js tests", {
	setup : function() {
		
	},
	teardown : function() {
		
	}
});

test('Show message dialog', function() {
	var msgText = '$$$';
	writer.dialogManager.show('message', {
		title: 'QUnit test',
		msg: msgText
	});
	var messageContent = $('#messageDialog .message')[0].innerText;
	ok(messageContent === msgText);
});

test('Hide message dialog', function() {
	writer.dialogManager.message.hide();
	ok($('#messageDialog:visible').length === 0);
});

});