
$(function(){
	//cD.setCwrcApi('http://localhost/cwrc/');
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
			},
			startValue : $("#startValuePerson").val()
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
			},
			startValue : $("#startValueOrganization").val()
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
			},
			startValue : $("#startValuePlace").val()
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
			},
			startValue : $("#startValueTitle").val()
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
				}
					
			],
			query : $("#startValuePerson").val()
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
					
			],
			query : $("#startValueOrganization").val()
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
					
			],
			query : $("#startValuePlace").val()
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
					
			],
			query : $("#startValueTitle").val()
		}

		cD.popSearchTitle(opts);
	});

	$("#searchCustomButton").click(function(){

		var searchName = $("#customSearchSelectionButton").text();
		var searchType = searchName.toLowerCase().trim();
		var searchQuery = $("#searchPersonInput").val();

		$("#resultHeader").text(searchName + " ");
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
					action : cD.popEdit[searchType]
				},
					
			],
			query : searchQuery
		}
	
		cD.popSearch[searchType](opts)

	});


	$('#customSearchSelection li > a').click(function(e){
		$("#customSearchSelectionButton").html(this.innerHTML + ' <span class="caret"></span>');
	});



	$("#clear-button").click(function(){
		$("#entityXMLContainer").text("");
		$("#resultHeader").text("Entity ");
	});

});