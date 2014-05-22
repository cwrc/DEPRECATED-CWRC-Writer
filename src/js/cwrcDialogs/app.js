
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
	cD.setPersonSchema("./schemas/entities.rng");
	cD.setOrganizationSchema("./schemas/entities.rng");
	cD.setPlaceSchema("./schemas/entities.rng");
	
	$("#addPerson").click(function(){
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
	});

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

	$("#addPlace").click(function(){
		$("#resultHeader").text("Entity ");
		$("#entityXMLContainer").text("");
		var opts = {
			success: function(result) {
				if(result.response.error){
					alert(result.response.error);
					$("#entityXMLContainer").text("");
				}else{
					$("#resultHeader").text("Place entity " + result.response.pid);
					$("#entityXMLContainer").text(result.data);
				}
			},
			error : function(errorThrown) {
				$("#entityXMLContainer").text("");
				$("#resultHeader").text("Entity ");
			}
		};
		cD.popCreatePlace(opts);
	});
	
	$("#addTitle").click(function(){
		$("#resultHeader").text("Entity ");
		$("#entityXMLContainer").text("");
		var opts = {
			success: function(result) {
				if(result.response.error){
					alert(result.response.error);
					$("#entityXMLContainer").text("");
				}else{
					$("#resultHeader").text("Title entity " + result.response.pid);
					$("#entityXMLContainer").text(result.data);
				}
			},
			error : function(errorThrown) {
				$("#entityXMLContainer").text("");
				$("#resultHeader").text("Entity ");
			}
		};
		cD.popCreateTitle(opts);
	});


	$("#searchPerson").click(function(){
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
				},
				{
					label : "Edit",
					action : cD.popEditPerson
				},
					
			]
		}

		cD.popSearchPerson(opts);
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
			},
			buttons : [				
				{
					label : "Edit",
					action : cD.popEditOrganization
				},
					
			]
		}

		cD.popSearchOrganization(opts);
	});
	
	$("#searchPlace").click(function(){
		$("#resultHeader").text("Place ");
		$("#entityXMLContainer").text("");

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
					label : "Edit",
					action : cD.popEditPlace
				},
					
			]
		}

		cD.popSearchPlace(opts);
	});

	$("#searchTitle").click(function(){
		$("#resultHeader").text("Title ");
		$("#entityXMLContainer").text("");

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
					label : "Edit",
					action : cD.popEditTitle
				},
					
			]
		}

		cD.popSearchTitle(opts);
	});

	$("#clear-button").click(function(){
		$("#entityXMLContainer").text("");
		$("#resultHeader").text("Entity ");
	});

});