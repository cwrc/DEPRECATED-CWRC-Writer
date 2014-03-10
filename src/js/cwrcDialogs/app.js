$(function(){
	
	// var opts = {
	//	success: function(data) {
	//		$("#entityXMLContainer").text(data);
	//	},
	//	error : function(errorThrown) {
	//		$("#entityXMLContainer").text("");
	//	}
	// };

	// cD.popPersonDialog(opts);
	// cD.popOrganizationDialog(opts);

	cD.initializeWithLogin('mark_test', 'P4ssw0rd!');

	
//	$("#addPerson").click(function(){
	
	function addPerson(){
		$("#entityXMLContainer").text("");
		var opts = {
			success: function(result) {
				
				
				if(result.response.error){
					alert(result.response.error);
					$("#entityXMLContainer").text("");
				}else{
					$("#resultHeader").text("Person entity " + result.response.pid);
					$("#entityXMLContainer").text(result.data);
				}
			},
			error : function(errorThrown) {
				$("#entityXMLContainer").text("");
				$("#resultHeader").text("Entity ");
			}
		};
		cD.popCreatePerson(opts);
	}

	function searchPerson() {
		$("#resultHeader").text("Entity ");
		$("#entityXMLContainer").text("");

		var customAction = function(data) {

			var result = "";
			for (var i in data) {
				if (data.hasOwnProperty(i)) {
					result += i + " : " + data[i] + "	";
				}
			}
	
			$("#resultHeader").text("Result");
			$("#entityXMLContainer").text(result);
		};

		var opts = {
			success: function(result) {
				$("#resultHeader").text("Added");
				$("#entityXMLContainer").text(JSON.stringify(result));
			},
			error : function(errorThrown) {
				$("#entityXMLContainer").text("");
				$("#resultHeader").text("Entity ");
			},
			buttons : [
				{
					label : "Show response",
					action : customAction
				}
			]
		};

		cD.popSearchPerson(opts);
	}
	
	writer.event('addPersonClicked').subscribe(searchPerson);


	$("#addOrganization").click(function(){
		$("#resultHeader").text("Entity ");
		$("#entityXMLContainer").text("");
		var opts = {
			success: function(result) {
				if(result.response.error){
					alert(result.response.error);
					$("#entityXMLContainer").text("");
				}else{
					$("#resultHeader").text("Organization entity " + result.response.pid);
					$("#entityXMLContainer").text(result.data);
				}
			},
			error : function(errorThrown) {
				$("#entityXMLContainer").text("");
				$("#resultHeader").text("Entity ");
			}
		};
		cD.popCreateOrganization(opts);
	});
	
	$("#searchOrganization").click(function(){
		$("#resultHeader").text("Organization ");
		$("#entityXMLContainer").text("");

		var opts = {
			success: function(result) {
				$("#resultHeader").text("Added");
				$("#entityXMLContainer").text(JSON.stringify(result));
			},
			error : function(errorThrown) {
				$("#entityXMLContainer").text("");
				$("#resultHeader").text("Entity ");
			}
		}

		cD.popSearchOrganization(opts);
	});

	$("#clear-button").click(function(){
		$("#entityXMLContainer").text("");
		$("#resultHeader").text("Entity ");
	});

});