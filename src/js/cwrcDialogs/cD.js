
// Tree traversal
$(function(){
	cD = {};
	(function(){
		var cwrcApi = new CwrcApi('http://apps.testing.cwrc.ca/services/ccm-api/', $);
		//var cwrcApi = new CwrcApi('http://localhost/cwrc/', $);
		
		var geonameUrl = "http://apps.testing.cwrc.ca/cwrc-mtp/geonames/";
		
		// parameters

		var params = {};
		params.lang = "a:en";
		params.modalOptions = {
			show: false,
			keyboard: true,
			backdrop: false,
			maxHeight: 500,
		}
		var dialogType = "";

		// fix conflicts with jquery ui
		var datepicker = $.fn.datepicker.noConflict();
		$.fn.bsDatepicker = datepicker;
		var button = $.fn.button.noConflict();
		$.fn.bsButton = button;
		var tooltip = $.fn.tooltip.noConflict();
		$.fn.bsTooltip = tooltip;
		
		///////////////////////////////////////////////////////////////////////
		// Helpers
		///////////////////////////////////////////////////////////////////////

		var last = function(array) {	
			return array[array.length-1];
		};
		
		var initialize = function() {
			entity.initialize();
			search.initialize();
		};

		var setHelp = function() {
			$(".cwrc-help").bsTooltip({
				// trigger: "hover",
				placement: 'right',
				trigger: 'click',
				delay: { show: 100, hide: 100 },
			});
			// $('.dpYears').bsDatepicker();

			$('.input-append.date').bsDatepicker({
				format: "yyyy-mm-dd",
				startView: 2,
				autoclose: true
			});
		};


		///////////////////////////////////////////////////////////////////////
		// Entities
		///////////////////////////////////////////////////////////////////////

		// entity
		var entity = {};
		entity.viewModel = ko.observable({});
		entity.viewModel().interfaceFields = ko.observableArray([]);
		entity.viewModel().dialogTitle = ko.observable("");
		entity.viewModel().validated = ko.observable(true);
		entity.selfWorking = $.parseXML('<entity></entity>');
		entity.elementPath = [];
		
		entity.viewModel().modsFields = ko.observable({
			modsTypes: [
			{name:'Audio'},
			{name:'Book (part)'},
			{name:'Book (whole)'},
			{name:'Correspondence'},
			{name:'Journal (part)'},
			{name:'Journal (whole)'},
			{name:'Manuscript'},
			{name:'Video'},
			{name:'Web resource'},
			],
			modsType: ko.observable("Audio"),
			title: ko.observable(),
			author: ko.observableArray([
			]),
			date: ko.observable(),
			project: ko.observable(),
			validation: {
				title: ko.observable(true),
				date: ko.observable(true)
			},
			addNewAuthor: function(){
				var author = {
					name: ko.observable("")
				};
				
				entity.viewModel().modsFields().author.push(author);
				
				return author;
			},
			removeThisAuthor: function(author){
				entity.viewModel().modsFields().author.remove(author);
			}
		}); // Added to create mods entries
		
		entity.person = {};
		entity.person.schema = "";
		entity.person.success = null;

		entity.organization = {};
		entity.organization.schema = "";
		entity.organization.success = null;
		
		entity.place = {};
		entity.place.schema = "";
		entity.place.success = null;
		
		entity.title = {};
		entity.title.schema = "";
		entity.title.success = null;

		entity.editing = false;
		entity.editingPID = "";

		// XXX Add namespace

		entity.setPersonSchema = function(url) {
			$.ajax({
				type: "GET",
				async: false,
				url: url,
				dataType: "xml",
				success: function(xml) {
					entity.person.schema = xml;
				}
			});
		}

		cD.setPersonSchema = entity.setPersonSchema;

		entity.setOrganizationSchema = function(url) {
			$.ajax({
				type: "GET",
				async: false,
				url: url,
				dataType: "xml",
				success: function(xml) {
					entity.organization.schema = xml;
				}
			});
		}

		cD.setOrganizationSchema = entity.setOrganizationSchema;

		entity.setPlaceSchema = function(url) {
			$.ajax({
				type: "GET",
				async: false,
				url: url,
				dataType: "xml",
				success: function(xml) {
					entity.place.schema = xml;
				}
			});
		}

		cD.setPlaceSchema = entity.setPlaceSchema;

		cD.setSchema = {
			person : cD.setPersonSchema,
			organization : cD.setOrganizationSchema,
			place : cD.setPlaceSchema
		};

		entity.initialize = function() {
					
			// entity.setPersonSchema("./schemas/entities.rng");
			// entity.setOrganizationSchema("./schemas/entities.rng");

			var entityTemplates = '' +
			'		<script type="text/htmlify" id="quantifier">' +
			'			<div class="quantifier">' +
			'			<div>' +
			// '				<h2><span data-bind="text: header"></span></h2>' +
			'				<span data-bind="text: label"></span>' +
			'				<span  data-bind="if: isGrowable()">' +
			'					<span data-bind="if: showAddButton()">' +
			'						<button data-bind="click: addGroup" class="btn btn-default btn-xs"><span class="glyphicon glyphicon-plus"</span></button>' +
			'					</span>' +
			'				</span>' +
			'			</div>' +
			'			<div class="interfaceFieldsContainer" data-bind="template:{name: $root.displayMode, foreach: interfaceFields}"> ' +
			'			</div>' +
			'			</div>' +
			'		</script>' +
			'		<script type="text/html" id="seed">' +
			'			<!--seed-->' +
			'			<div>' +
			'				<span data-bind="template:{name: $root.displayMode, foreach: interfaceFields}"></span>' +
			'				<span data-bind="if: $parent.showRemoveThisButton()">' +
			'					<button data-bind="click: $parent.removeThisGroup" class="btn btn-default btn-xs">' +
			'						<span class="glyphicon glyphicon-minus"></span>' +
			'					</button>' +
			'				</span>' +
			'			</div>' +
			'		</script>' +
			'		<script type="text/html" id="textField">' +
			'			<!--textField-->' +
			'			<span>' +
			'				<span data-bind="text: label"></span> ' +
			'				<input data-bind="value: value" /> ' +
			'				<span class="cwrc-help glyphicon glyphicon-question-sign" data-bind="attr:{\'title\': help}"></span>'+
			'				<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
			'			</span>' +
			'		</script>' +
			
			'		<script type="text/html" id="header">' +
			'			<!--header-->' +
			'			<span>' +
			'				<h4><span data-bind="text: label"></span></h4>' +
			'			</span>' +
			'		</script>' +

			'		<script type="text/html" id="datePicker">' +
			'			<!-- datePicker -->' +
			'			<span>' +
			'				<span data-bind="text: label"></span> ' +
			'				<div class="input-append date">' +
			'					<input placeholder="YYYY-MM-DD" type="text" class="span2" data-bind="value: value">' +
			'					<button class=" add-on btn btn-default btn-xs"><span class="glyphicon glyphicon-calendar"></span></button>' +
			'					<span class="cwrc-help glyphicon glyphicon-question-sign" data-bind="attr:{\'title\': help}"></span>'+
			'				</div>' +
			'				<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
			'			</span>' +
			'		</script>' +
			'		<script type="text/html" id="dialogue">' +
			'			<!--dialogue-->' +
			'			<span>' +
			'				<span class="cwrc-help" data-bind="text: label, attr:{\'title\': help}"></span> ' +
			'			</span>' +
			'		</script>' +
			'		<script type="text/html" id="textArea">' +
			'			<!--textArea-->' +
			'			<span>' +
			'				<span data-bind="text: label"></span> ' +
			'				<textarea rows="4" cols="50" data-bind="value: value"></textarea> ' +
			'				<span class="cwrc-help glyphicon glyphicon-question-sign" data-bind="attr:{\'title\': help}"></span>'+
			'				<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
			'			</span>' +
			'		</script>' +
			'		<script type="text/html" id="radioButton">' +
			'			<span>' +
			'				<span data-bind="text: label"></span>' +
			'				<ul data-bind="foreach: options">' +
			'					<li>' +
			'						<input type="radio" data-bind="attr: { value: value, name : $parent.path }, checked: $parent.value"> ' +
			'						<span data-bind="text:content"></span> ' +
			'					</li>' +
			'				</ul>' +
			'				<span class="cwrc-help glyphicon glyphicon-question-sign" data-bind="attr:{\'title\': help}"></span>'+
			'			</span>' +
			'		</script>' +
			'		<script type="text/html" id="dynamicCheckbox">' +
			'			<span>' +
			'				<span data-bind="text: label"></span>' +
			'				<ul data-bind="foreach: options">' +
			'					<li>' +
			'						<input type="checkbox" data-bind="attr: { value: value, name : $parent.path }, checked: $parent.value"> ' +
			'						<span data-bind="text:content"></span> ' +
			'					</li>' +
			'				</ul>' +
			'				<span class="cwrc-help glyphicon glyphicon-question-sign" data-bind="attr:{\'title\': help}"></span>'+
			'			</span>' +
			'		</script>' +
			'		<script type="text/html" id="dropDown">' +
			'			<select data-bind="value: value, options: options, optionsText: \'content\', optionsValue: \'value\'"></select>' +
			'				<span class="cwrc-help glyphicon glyphicon-question-sign" data-bind="attr:{\'title\': help}"></span>'+
			'		</script>';



			var newDialogTemplate = '' +
			'<div id="newDialogue" class="bootstrap-scope cwrcDialog" title="">' +
			'<div class="modal fade" id="cwrcEntityModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
			'	<div class="modal-dialog">' +
			'		<div class="modal-content">' +
			'			<div class="modal-header">' +
			'				<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
			'				<h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
			'			</div>' +
			'			<div class="modal-body modal-body-area">' +
			'				<div data-bind="template: { name: displayMode , foreach: interfaceFields }">'+
			'				</div>' +
			'			</div>' +
			'			<div class="modal-footer">' +
			'				<div class="label label-danger" data-bind="ifnot: validated"> Form is not valid</div>' +
			'				<button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>' +
			'				<button type="button" class="btn btn-primary" onclick="cD.processCallback();">Ok</button>' +
			'			</div>' +
			'		</div>' +
			'	</div>' +
			'</div>' +
			'</div>';
			
			var newTitleDialogTemplate = '' +
			'<div id="newTitleDialogue" class="bootstrap-scope cwrcDialog" title="">' +
			'<div class="modal fade" id="cwrcTitleModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
			'	<div class="modal-dialog">' +
			'		<div class="modal-content">' +
			'			<div class="modal-header">' +
			'				<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
			'				<h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
			'			</div>' +
			'			<div class="modal-body modal-body-area" data-bind="with: modsFields">' +
			//Type of Resource
			'				<div class="quantifier">' +
			'					<div>' +
			'						<span>Type of resource</span>' +
			'					</div>' +
			'					<div class="interfaceFieldsContainer"> ' +
			'						<select data-bind="options: modsTypes, optionsText: \'name\', optionsValue: \'name\', value: modsType">' +
			'						</select>' +
			'					</div>' +
			'				</div>' +
			//Title
			'				<div class="quantifier">' +
			'					<div>' +
			'						<span>Title</span>' +
			'					</div>' +
			'					<div class="interfaceFieldsContainer"> ' +
			'						<input data-bind="value: title">' +	
			'						<div class="label label-info" data-bind="if:validation.title">Required value</div>' +
			'						<div class="label label-danger" data-bind="ifnot:validation.title">Required value</div>' +
			'					</div>' +
			'				</div>' +
			//Authors
			'				<div class="quantifier">' +
			'					<div>' +
			'						<span>Author</span>' +
			'							<span>' +
			'								<span>' +
			'									<button data-bind="click: addNewAuthor" class="btn btn-default btn-xs"><span class="glyphicon glyphicon-plus"</span></button>' +
			'								</span>' +
			'							</span>' +
			'						</div>' +
			'					<div class="interfaceFieldsContainer" data-bind="foreach: author"> ' +
			'						<div>' +
			'							<span>' +
			'								<input data-bind="value: name" /> ' +
			'								<!--<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>-->' +
			'							</span>' +
			'							<span data-bind="if: $index">' +
			'								<button data-bind="click: $parent.removeThisAuthor" class="btn btn-default btn-xs">' +
			'									<span class="glyphicon glyphicon-minus"></span>' +
			'								</button>' +
			'							</span>' +
			'						</div>' +	
			'					</div>' +
			'				</div>' +
			//Date
			'				<div class="quantifier">' +
			'					<div>' +
			'						<span>Date</span>' +
			'					</div>' +
			'					<div class="interfaceFieldsContainer"> ' +
			//'						<div class="input-append date">' +
			'							<input placeholder="YYYY-MM-DD" type="text" class="span2" data-bind="value: date">' +
			//'							<button class=" add-on btn btn-default btn-xs"><span class="glyphicon glyphicon-calendar"></span></button>' +
			'							<span class="cwrc-help glyphicon glyphicon-question-sign" title="Date must be in the form of YYYY, YYYY-MM or YYYY-MM-DD."></span>'+
			//'						</div>' +
			'						<div class="label label-danger" data-bind="ifnot:validation.date">Invalid date</div>' +
			'					</div>' +
			'				</div>' +
			
			//Project
			'				<div class="quantifier">' +
			'					<div>' +
			'						<span>Project</span>' +
			'					</div>' +
			'					<div class="interfaceFieldsContainer"> ' +
			'						<input data-bind="value: project">' +	
			'						<!--<div class="label label-info" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}">Required value</div>-->' +
			'					</div>' +
			'				</div>' +
			
			'			</div>' +
			'			<div class="modal-footer">' +
			'				<div class="label label-danger" data-bind="ifnot: validated"> Form is not valid</div>' +
			'				<button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>' +
			'				<button type="button" class="btn btn-primary" onclick="cD.processCallback();">Ok</button>' +
			'			</div>' +
			'		</div>' +
			'	</div>' +
			'</div>' +
			'</div>';

			$('head').append(entityTemplates);
			$('body').append(newDialogTemplate);
			$('body').append(newTitleDialogTemplate);
			$("#cwrcEntityModal").modal(params.modalOptions);
			$("#cwrcEntityModal").draggable({	
				handle: ".modal-header"
			});
			$("#cwrcTitleModal").modal(params.modalOptions);
			$("#cwrcTitleModal").draggable({	
				handle: ".modal-header"
			});

			ko.applyBindings(entity.viewModel, $("#newDialogue")[0]);
			ko.applyBindings(entity.viewModel, $("#newTitleDialogue")[0]);
		}

		var initializeQuantifiers = function() {
			entity[dialogType].nodeStack = [];
			entity[dialogType].workingContainers = [];
			entity[dialogType].shouldValidate = [];
			entity.viewModel().interfaceFields([]);
			var startingInterleave = interleaveModel();
			startingInterleave.path = "entity";
			entity.viewModel().interfaceFields.push(startingInterleave);
			entity[dialogType].workingContainers.push(startingInterleave);
			entity.viewModel().validated(true);
		};
		
		var completeTitleDialog = function(opts, data) {
			entity[dialogType].success = typeof opts.success === undefined ? function(){} : opts.success;
			entity[dialogType].error = typeof opts.error === undefined ? function(){} : opts.error;
			newTitleDialog(data);
			setHelp();
		};
		
		var newTitleDialog = function(data) {
			initializeQuantifiers();
			
			var modsFields = entity.viewModel().modsFields();
			if(data && data != null){
				modsFields.modsType(data.modsType);
				modsFields.title(data.title);
				modsFields.date(data.date ? data.date : "");
				modsFields.project(data.project ? data.project : "");
				modsFields.author([])
				
				if(data.author && data.author != null && data.author.length > 0){
					data.author.forEach(function(author){
						var a = modsFields.addNewAuthor();
						a.name(author.name);
					})
				}else{
					modsFields.addNewAuthor();
				}
			}else{
				modsFields.modsType("Audio");
				modsFields.title("");
				modsFields.author([]);
				modsFields.date("");
				modsFields.project("");
				
				modsFields.addNewAuthor();
			}
			
			
			modsFields.validation.title(true);
			modsFields.validation.date(true);
		}

		var completeDialog = function(opts) {
			entity[dialogType].success = opts.success ? opts.success : function(){};
			entity[dialogType].error = opts.error ? opts.error : function(){};
			newDialog();
			setHelp();
		};

		var newDialog = function() {
			initializeQuantifiers();
			var interfaceOrder = $(entity['person'].schema).find('interface-order[type='+dialogType+']');
			entity.elementPath = $(interfaceOrder).attr('path').split('/');
			interfaceOrder.children('ref').each(function(){
				var defName = $(this).attr("name");
				$(entity[dialogType].schema).find('define[name='+defName+']')
					.children().each(function(i,child) {
						visit(child);
					});
			});
			// var root = entity[dialogType].workingContainers.last();
			var root = entity[dialogType].workingContainers[0];
			root.interfaceFields.push(root.seed);
			entity.viewModel().interfaceFields(entity[dialogType].workingContainers[0]); // startingIterfaceField
			
		};

		var visit = function(node) {
			if (node.nodeType === 1) { // ELEMENT_NODE
				entity[dialogType].nodeStack.push(node);
				// working with node
				processNode(node);
				entity[dialogType].nodeStack.pop();
			}
		};

		var processNode = function(node) {
			var nodeName = node.nodeName.toLowerCase();
			var visitChildren = true;
			switch(nodeName) {
				case 'element':
					processElement(node);
					break;
				// case 'attribute':
				// 	processAttribute(node);
				// 	break;
				case 'ref':
					processRef(node);
					break;
				case 'xs:annotation':
					processXSAnnotation(node);
					visitChildren = false;
					break;
				case 'choice':
					visitChildren = true;
					break;
				case 'oneormore':
				case 'zeroormore':
				case 'optional':
				case "interleave":
					processQuantifier(node);
					break;
			}
			if (visitChildren) {
				// visit all children
				$(node).children().each(function(i,child){
					visit(child);
				});
			}
			// post process
			switch(nodeName) {
				case 'element':
					postprocessElement(node);
					break;
				// case 'attribute':
				// 	postProcessAttribute(node);
				// 	break;
				case 'oneormore':
				case 'zeroormore':
				case 'optional':
				// case 'interleave':
					postprocessQuantifier();
					break;
				case 'interleave':
					postprocessInterleave();
					break;
			}
		};

		var processElement = function(node){
			entity.elementPath.push($(node).attr('name'));
		};

		var postprocessElement = function(node){
			entity.elementPath.pop();
		};

		// var processAttribute = function(node) {
		// 	// entity.elementPath.push("@test");
		// };

		// var postProcessAttribute = function(node) {
		// 	// entity.elementPath.pop();
		// };

		var processRef = function(node){
			var defName = $(node).attr('name');
			var defNode = $(entity[dialogType].schema).find('define[name='+defName+']')[0];
			visit(defNode);
		};

		var isSamePath = function(currentPath) {
			// var workingPath = currentPath;
			// XXX TESTING
			var len = currentPath.length;
			if (currentPath[len-1].indexOf('@') !== -1) {
				// workingPath.pop();
				len = len - 1;
			}
			if (len !== entity.elementPath.length) {
				return false;
			}
			for (var i=0; i<len; ++i) {
				var orPaths = currentPath[i].split('|');
				var same = false;
				for (var j=0; j< orPaths.length; ++j) {
					if (entity.elementPath[i] === orPaths[j]) {
						same = true;
						break;
					}
				}
				if (!same) {
					return false;
				}
			}
			return true;
		};

		var setQuantifierLabel = function(label) {
			var lastContainer = last(entity[dialogType].workingContainers);
			lastContainer.label = label;
		};

		var addOptions = function(newInput, appInfo) {
			var type = dialogType,
				lang = params.lang;


			var values = $(appInfo).children('values[type='+ type +']')[0];
			
			if (!values) {
				values = $(appInfo).children('values')[0];
			}
			
			if (values) {

				var valuesURL = $(values).attr('url');
				if (valuesURL) {
					addRemoteOptions(newInput, valuesURL);
				}

				$(values).find('value').each(function(i,e){
					newInput.options.push({
						'content': $(e).attr(lang),
						'value': $(e).text()
					});
				});
			}
		};

		var addRemoteOptions = function(newInput, url) {
			var lang = params.lang;
			$.ajax({
				url: url,
				async: false,
				dataType: "json"
			}).done(function(data){
				$.each(data, function(i, option){
					newInput.options.push({
						'content': option['content'][lang],
						'value': option['value']
					});
				});
			});
		};

		var processXSAnnotation = function(node){
			// ADD WIDGET HERE
			var appInfoNode = $(node).children("xs\\:appinfo");
			// check all children for path XXX
			$(appInfoNode).children("interface-field").each(function(i,e){
				var currentPath = $(e).attr('path').split('/');
				if (isSamePath(currentPath)) {
					// if same path XXX
					// check what widget to add XXX
					var newInput;
					var inputType = "";
					if ($(e).children('input').first().text() !== '') {
						inputType = $(e).children('input').first().text();
					}
					switch(inputType) {
						case "textField" :
							newInput = textInputModel();
							break;
						case "textArea" :
							newInput = textAreaModel();
							break;
						case "radioButton" :
							newInput = radioButtonModel();
							//XXX Get Options
							addOptions(newInput, appInfoNode);
							// new entry
							newInput.defaultValue = true;
							newInput.value(newInput.options[0].value);
							break;
						case "dynamicCheckbox" :
							newInput = dynamicCheckboxModel();
							//XXX Get Options
							addOptions(newInput, appInfoNode);
							break;
						case "dropDown" :
						case "slider" : //XXX Implement
						case "combobox" : //XXX Implement
							newInput = dropDownModel();
							addOptions(newInput, appInfoNode);
							break;
						case "dialogue" :
							newInput = dialogueInputModel();
							break;
						case "datePicker" :
							newInput = datePickerInputModel();
							break;
						case "header" :
							newInput = headerInputModel();
							break;
							// var lastContainer = last(entity[dialogType].workingContainers);
							// var header = $(e).children('label').first().text();
							// lastContainer.header = header;
							// alert(header);

							break;
						case "" : // Label
							var quantifierLabel = $(e).children('label').first().text();
							setQuantifierLabel(quantifierLabel);
							break;
						default:
						newInput = textInputModel();
					}
					if (newInput) {
						newInput.path = entity.elementPath.toString();
						// check if it should be stored as an attribute
						var parent = $(node).parent()[0];
						if (parent.nodeName === 'attribute') {
							newInput.attributeName = $(parent).attr('name') + "";
							newInput.path += "," + newInput.attributeName;
						}
						newInput.label = $(e).children('label').first().text();
						newInput.help = $(e).children('help-text').first().text();
						var lastContainer = last(entity[dialogType].workingContainers);
						
						if (lastContainer.isRequired()) {
							newInput.nodeMessage("Required value");
						}
						lastContainer.seed.interfaceFields.push(newInput);

					}
				}
			});
		};

		var processQuantifier = function(node){
			
			var newQuantifier;
			var nodeName = node.nodeName.toLowerCase();
			switch(nodeName) {
				case "oneormore":
					newQuantifier = oneOrMoreModel();
				break;
				case "zeroormore":
					newQuantifier = zeroOrMoreModel();
				break;
				case "optional":
					newQuantifier = optionalModel();
				break;
				case "interleave":
					newQuantifier = interleaveModel();
				break;
			}

			///////////////

			newQuantifier.path = entity.elementPath.toString();
			
			///////////////

			// add to latestWorking quantifier
			last(entity[dialogType].workingContainers).seed.interfaceFields.push(newQuantifier);
			// add to quantifier list
			entity[dialogType].workingContainers.push(newQuantifier);
		};

		var isInterfaceIsPresent= function(item) {
			switch(item.input) {
				case 'textField':
				case 'textArea':
				case 'dropDown':
				case 'dynamicCheckbox':
				case 'radioButton':
				case 'combobox':
				case 'slider':
				case 'dialogue':
				case 'datePicker':
				case 'header':
				case '':
					return true;
			}
			return false;
		};

		var postprocessInterleave = function(node) {
			var lastContainer = last(entity[dialogType].workingContainers);

			if (lastContainer.seed.interfaceFields().length >= 1) {
				lastContainer.hasInterface = true;

				// $.each(lastContainer.seed.interfaceFields(), function(index, item){
				// 	var path = item.path;
				// 	if (item.attributeName !== "") {
				// 		path += "," + item.attributeName;
				// 	}
				// 	lastContainer.elements.push(path);
				// });
			}

			if (lastContainer.hasInterface) {
				lastContainer.interfaceFields.push(lastContainer.seed.clone());
				entity[dialogType].workingContainers.pop();
				
			} else {
				entity[dialogType].workingContainers.pop();
				var parent = last(entity[dialogType].workingContainers);
				parent.seed.interfaceFields.remove(lastContainer);
			}
		};

		var postprocessQuantifier = function(node){
			var lastContainer = last(entity[dialogType].workingContainers);
			
			$.each(lastContainer.seed.interfaceFields(), function(index, item){
		
				if (isInterfaceIsPresent(item)) {
					lastContainer.hasInterface = true;
					
					// var path = item.path;
					// if (item.attributeName !== "") {
					// 	path += "," + item.attributeName;
					// }
				
					// lastContainer.elements.push(path);
					
				}
			});

			if (lastContainer.hasInterface) {

				lastContainer.label = lastContainer.seed.interfaceFields()[0].label;
				lastContainer.seed.interfaceFields()[0].label = "";
				
				if (lastContainer.minItems === 1) {
					lastContainer.interfaceFields.push(lastContainer.seed.clone());
				}
				entity[dialogType].workingContainers.pop();
			} else {
				entity[dialogType].workingContainers.pop();
				var parent = last(entity[dialogType].workingContainers);
				moveInterfaceElements(lastContainer , parent);
			}	
		};

		var moveInterfaceElements = function(from, to) {
			$.each(from.seed.interfaceFields(), function(index, item){
				// if (item.hasInterface) {
				to.seed.interfaceFields.push(item);
				// }
			});
			// XXX Needed ?
			if (to.label === "") {
				to.label = from.label;
			}
			// alert(to.path + " + " + from.path)
			// to.path = from.path
			to.seed.interfaceFields.remove(from);
		};

		var visitStringifyResult = function(node) {
			if (node.input === "quantifier" || node.input === "seed") {
				if (node.input === "quantifier") {
					var minItems = node.minItems;
					var maxItems = node.maxItems;
					entity[dialogType].shouldValidate.push(node.isRequired());
					/*
					if (node.isRequired()) {
						entity[dialogType].shouldValidate.push(true);
					} else {
						entity[dialogType].shouldValidate.push(false);
					}
					*/
				
				}
				$.each(node.interfaceFields(), function(index, node) {
					visitStringifyResult(node);
				});
				if (node.input === "quantifier") {
					entity[dialogType].shouldValidate.pop();
				}
			} else if (node.input !== "label" && node.input !== "header") {
				// CREATE NODE
				// if (node.input == "datePicker") {
				// 	alert("picker!!! ");
				// }
				var validate = last(entity[dialogType].shouldValidate);
				if (validate && $.trim(node.value()) === ""){
					// node.nodeMessage("Required value");
					node.nodeMessageClass("label label-danger");
					entity.viewModel().validated(false);
				} else {
					// node.nodeMessage("");
					node.nodeMessageClass("label label-info");
				}
				createNode(node);
			}
		};

		var createNode = function(node) {
			var pathString = node.path,
				fullPath = pathString.split(","),
				maxDepth = fullPath.length,
				path,
				thisPathString,
				selectior,
				newElement;
				
			if (node.attributeName !== "") {
				--maxDepth;
			}
			
			for (var i=0; i< maxDepth; i++) {
				path = pathString.split(',');
				thisPathString = path.splice(0, i+1) + "";
				selector = thisPathString.replace(/,/g, " > ");
				var entry = $(entity.selfWorking).find(selector);
				// entry if not found (needs to create it) or if at maxDepth
				if (entry.size() === 0 || i === fullPath.length - 1) {
					path = pathString.split(',');
					thisPathString = path.splice(0, i) + "";
					selector = thisPathString.replace(/,/g, " > ");
					newElement = entity.selfWorking.createElement(fullPath[i]);
					$(entity.selfWorking).find(selector).last().append(newElement);
				}
			}
			// set value
			if(node.attributeName !== "") {
				// set attribute value
				thisPathString = path.splice(0, i) + "";
				selector = thisPathString.replace(/,/g, " > ");
				$(entity.selfWorking).find(selector).last().attr(node.attributeName, node.value());
			} else {
				// set text value
				var newText = entity.selfWorking.createTextNode(node.value());
				$(newElement).append(newText);
			}

		};
		
		var validateModsInfo = function(xml){
			var modsFields = entity.viewModel().modsFields();
			
			if(modsFields.title().trim().length < 1){
				modsFields.validation.title(false);
				entity.viewModel().validated(false);
			}else{
				modsFields.validation.title(true);
			}
			
			var testDate = modsFields.date().trim();
			var rx = /^\d{1,4}(-(0[1-9]|1[012])(-(0[1-9]|[12][0-9]|3[01]))?)?$/; //Tests that the date can be eirther YYYY, YYYY-MM, or YYYY-MM-DD
			if(testDate.length > 0 && !rx.test(testDate)){
				modsFields.validation.date(false);
				entity.viewModel().validated(false);
			}else{
				modsFields.validation.date(true);
			}
			modsFields.date(testDate);
		};
		
		var addModsInfo = function(xml){
			var accessConditionText = 'Use of this public-domain resource is governed by the <a href="http://creativecommons.org/licenses/by-nc/3.0/" rel="license">Creative Commons Attribution-NonCommercial 3.0 Unported License</a>.';
			var mods = $(xml).find("mods");
			var modsFields = entity.viewModel().modsFields();
			
			// Create the title element
			var titleInfo = entity.selfWorking.createElement("titleInfo");
			var title = entity.selfWorking.createElement("title");
			title.appendChild(entity.selfWorking.createTextNode(modsFields.title()));
			$(titleInfo).append(title);
			mods.append(titleInfo);
			
			// Create the author names
			modsFields.author().forEach(function(author){
				if(author.name().trim().length > 0){
					var name = entity.selfWorking.createElement("name");
					name.setAttribute("type", "personal");
					var namePart = entity.selfWorking.createElement("namePart");
					namePart.appendChild(entity.selfWorking.createTextNode(author.name()));
					$(name).append(namePart);
				
					var role = entity.selfWorking.createElement("role");
					var roleTerm = entity.selfWorking.createElement("roleTerm");
					roleTerm.setAttribute("type", "text");
					roleTerm.setAttribute("authority", "marcrealtor");
					roleTerm.appendChild(entity.selfWorking.createTextNode("Author"));
					$(role).append(roleTerm);
				
					$(name).append(role);
					mods.append(name);
				}
			});
			
			// Create genre element
			var genre = entity.selfWorking.createElement("genre");
			genre.setAttribute("type", "formatType");
			genre.appendChild(entity.selfWorking.createTextNode(modsFields.modsType()));
			mods.append(genre);
			 
			// create origin info or related item info
			if(modsFields.date().trim().length > 0){
				var relatedItem = entity.selfWorking.createElement("relatedItem");
				var originInfo = entity.selfWorking.createElement("originInfo");
			
				var dateIssued = entity.selfWorking.createElement("dateIssued");
				dateIssued.setAttribute("encoding", "w3cdtf");
				dateIssued.setAttribute("keyDate", "yes");
				dateIssued.appendChild(entity.selfWorking.createTextNode(modsFields.date()));
				$(originInfo).append(dateIssued);
			
				switch(modsFields.modsType()){
					case 'Audio':
					case 'Book (whole)':
					case 'Correspondence':
					case 'Journal (whole)':
					case 'Manuscript':
					case 'Video':
					case 'Web resource':
						mods.append(originInfo);
						break;
					
					case 'Book (part)':
						$(relatedItem).append(originInfo);
						mods.append(relatedItem);
						break;
					
					case 'Journal (part)':
						var part = entity.selfWorking.createElement("part");
						
						var date = entity.selfWorking.createElement("date");
						date.setAttribute("encoding", "w3cdtf");
						date.appendChild(entity.selfWorking.createTextNode(modsFields.date()));
						$(part).append(date);
						
						$(relatedItem).append(part);
						mods.append(relatedItem);
						break;
				}
			}
			
			// create access condition
			var accessCondition = entity.selfWorking.createElement("accessCondition");
			accessCondition.setAttribute("type", "use and reproduction");
			accessCondition.appendChild(entity.selfWorking.createTextNode(accessConditionText));
			mods.append(accessCondition);
			
			// create record info
			var now = new Date();
			var recordInfo = entity.selfWorking.createElement("recordInfo");
			
			if(modsFields.project().trim().length > 0){
				var recordContentSource = entity.selfWorking.createElement("recordContentSource");
				recordContentSource.appendChild(entity.selfWorking.createTextNode(modsFields.project()));
				$(recordInfo).append(recordContentSource);
			}
			
			var recordCreationDate = entity.selfWorking.createElement("recordCreationDate");
			recordCreationDate.setAttribute("encoding", "w3cdtf");
			recordCreationDate.appendChild(entity.selfWorking.createTextNode(now.toISOString().substring(0, 10)));
			$(recordInfo).append(recordCreationDate);
			
			var recordChangeDate = entity.selfWorking.createElement("recordChangeDate");
			recordChangeDate.setAttribute("encoding", "w3cdtf");
			recordChangeDate.appendChild(entity.selfWorking.createTextNode(now.toISOString().substring(0, 10)));
			$(recordInfo).append(recordChangeDate);
			
			mods.append(recordInfo);
		}

		var addRecordInfo = function(xml) {
			var accessConditionText = 'Use of this public-domain resource is governed by the <a href="http://creativecommons.org/licenses/by-nc/3.0/" rel="license">Creative Commons Attribution-NonCommercial 3.0 Unported License</a>.';
			
			var recordInfo = entity.selfWorking.createElement("recordInfo");
			var accessCondition = entity.selfWorking.createElement("accessCondition");
			accessCondition.setAttribute("type", "use and reproduction");
			var originInfo = entity.selfWorking.createElement("originInfo");
			var recordCreationDate = entity.selfWorking.createElement("recordCreationDate");
			var recordChangeDate = entity.selfWorking.createElement("recordChangeDate");
			var type = entity.selfWorking.createElement(dialogType);
			var selector = "entity";
			$(xml).find(selector).append(type);

			selector = "entity > " + dialogType;
			$(xml).find(selector).append(recordInfo);
			selector = "entity > " + dialogType + " > recordInfo";
			// var selector = "entity > ";
			
			// accessCondition.attr("type", "use and reproduction");
			// var newText = entity.selfWorking.createTextNode(accessConditionText);
			$(accessCondition).html(accessConditionText);
			$(xml).find(selector).append(accessCondition);
			// $(accessCondition).append(newText);

			$(xml).find(selector).append(originInfo);
			selector = "entity > " + dialogType + " > recordInfo > originInfo";
			var todayText = entity.viewModel().paddedToday();
			var creationText = "";
			// XXX Change when editing
			if(!entity.editing) {
				creationText = todayText;
			}
			
			$(recordCreationDate).append(creationText);
			$(recordChangeDate).append(todayText);
			$(xml).find(selector).append(recordCreationDate);
			$(xml).find(selector).append(recordChangeDate);
			
		};

		var getWorkingXML = function() {
			var startingXML = '<?xml version="1.0" encoding="UTF-8"?>';

			switch (dialogType) {
				case 'person' :
					startingXML += '<?xml-model href="http://cwrc.ca/schema/person.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>';
					break;
				case 'organization' :
					startingXML += '<?xml-model href="http://cwrc.ca/schema/organization.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>';
					break;
				case 'place' :
					startingXML += '<?xml-model href="http://cwrc.ca/schema/place.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>';
					break;
				case 'title' :
					startingXML += '<mods xmlns="http://www.loc.gov/mods/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/mods.xsd">';
					break;
			}

			var result = null;
			
			if(dialogType == 'title'){
				entity.selfWorking = $.parseXML(startingXML + "</mods>");
				validateModsInfo();
				addModsInfo(entity.selfWorking);
				
				var result = xmlToString(entity.selfWorking);
				
				result = result.replace(/xmlns=""/g, "");
			}else{
				entity.selfWorking = $.parseXML(startingXML + '<entity></entity>');
				addRecordInfo(entity.selfWorking);
				visitStringifyResult(entity[dialogType].workingContainers[0]);
				var result = xmlToString(entity.selfWorking);
			}
			
			return result;
		};

		cD.processCallback = function() {
			entity.viewModel().validated(true);
			var xml = getWorkingXML();
			console.log(xml);
			if (entity.viewModel().validated()) {
				var response;
				if (entity.editing) {
					response = cwrcApi[dialogType].modifyEntity(entity.editingPID, xml);	
				} else {
					response = cwrcApi[dialogType].newEntity(xml);	
				}
				var result = {
					response : response,
					data : xml
				};

				entity[dialogType].success(result);	
				
				if(dialogType === 'title'){
					$('#cwrcTitleModal').modal('hide');
				}else{
					$('#cwrcEntityModal').modal('hide');
				}
			} else {
				entity[dialogType].error("Form not valid");
			}
		};

		var xmlToString = function(xmlData) {
			var xmlString;
			if (window.ActiveXObject){ // IE
				xmlString = xmlData.xml;
			} else{ // code for Mozilla, Firefox, Opera, etc.
				xmlString = (new XMLSerializer()).serializeToString(xmlData);
			}
			return xmlString;
		};

		// models

		entity.viewModel().displayMode = function(field) {
			return field.input;
		};

		/*
		entity.viewModel().today = function() {
			var date = new Date();
			return date.getFullYear() +"-"+ date.getMonth() + "-" + date.getDay();
		};
		*/
		entity.viewModel().paddedToday = function() {
			var date = new Date();
			var pad = "00";
			var month = "" + (date.getMonth() + 1);
			var day = "" + date.getDate();
			month = pad.substring(0, pad.length - month.length) + month;
			day = pad.substring(0, pad.length - day.length) + day;
			return date.getFullYear() +"-"+ month + "-" + day;
		};

		///////////////////////////////////////////////////////////////////////
		// Entity models
		///////////////////////////////////////////////////////////////////////

		var quantifierModel = function() {
			// var self = this;
			var that = {};
			that.input = "quantifier";
			// that.elements = [];
			that.path = "";
			that.label = "";
			that.header = "";
			that.minItems = 0;
			that.maxItems = Number.MAX_VALUE; // infinity;
			that.interfaceFields = ko.observableArray();
			that.seed = seedModel();
			// 1 1 Interleave
			// 0 1 Optional
			// 1 INF One or more
			// 0 INF Zero or more
			that.isGrowable = function() {
				if (that.minItems === 1 && that.maxItems === 1) {
					return false;
				}
				return true;
			};

			that.showAddButton = function() {
				if (that.interfaceFields().length < that.maxItems) {
					return true;
				}
				return false;
			};

			that.showDelButton = function() {
				if (that.interfaceFields().length > that.minItems) {
					return true;
				}
				return false;
			};
			
			that.showRemoveThisButton = function() {
				if (that.interfaceFields().length > that.minItems) {
					return true;
				}
				return false;
			};
			
			that.addGroup = function() {
				if (that.interfaceFields().length < that.maxItems) {
					// that.interfaceFields.push(that.seed.clone());	//XXX SEED
					var newClone = that.seed.clone();
					newClone.interfaceFields()[0].label = "";
					that.interfaceFields.push(newClone);
					setHelp();
				}
			};
			
			that.delGroup = function() {
				if (that.interfaceFields().length > that.minItems) {
					that.interfaceFields.pop();
				}
			};
			
			that.removeThisGroup = function(group) {
				if (that.interfaceFields().length > that.minItems) {
					that.interfaceFields.remove(group);
				}
			};
			
			that.isInterleave = function() {
				if (that.minItems === 1 && that.maxItems === 1) {
					return true;
				}
				return false;
			};
			
			that.isOptional = function() {
				if (that.minItems === 0 && that.maxItems === 1) {
					return true;
				}
				return false;
			};
			
			that.isOneOrMore = function() {
				if (that.minItems === 1 && that.maxItems === Number.MAX_VALUE) {
					return true;
				}
				return false;
			};
			
			that.isZeroOrMore = function() {
				if (that.minItems === 0 && that.maxItems === Number.MAX_VALUE) {
					return true;
				}
				return false;
			};
			
			that.isRequired = function() {
				return that.isOneOrMore() || that.isInterleave();
			};
			
			that.clone = function() {
				var result = quantifierModel();
				result.minItems = this.minItems;
				result.maxItems = this.maxItems;
				result.seed = this.seed.clone();
				result.path = this.path;
				result.label = this.label;
				result.header = this.header;
				// result.elements = this.elements;
				// take label
				// result.label = result.seed.interfaceFields()[0].label;
				if (result.minItems === 1) {
					//XXX clone to interfaceFields
					result.interfaceFields.push(this.seed.clone());
					// _.last(result.interfaceFields()).interfaceFields()[0].label="";
				}
				// result.seed.interfaceFields()[0].label = "";
				return result;
			};

			return that;
		};

		var interleaveModel = function() {
			var that = quantifierModel();
			that.minItems = 1;
			that.maxItems = 1;
			return that;
		};

		var optionalModel = function() {
			var that = quantifierModel();
			that.minItems = 0;
			that.maxItems = 1;
			return that;
		};

		var zeroOrMoreModel = function() {
			var that = quantifierModel();
			that.minItems = 0;
			that.maxItems = Number.MAX_VALUE;
			return that;
		};

		var oneOrMoreModel = function() {
			var that = quantifierModel();
			that.minItems = 1;
			that.maxItems = Number.MAX_VALUE;
			return that;
		};

		var seedModel = function() {
			var that = {};
			that.input = "seed";
			that.interfaceFields = ko.observableArray();
			that.clone = function() {
				var result = seedModel();
				$.each(that.interfaceFields(), function(index, field){
					result.interfaceFields.push(field.clone());
				});
				
				return result;
			};
			return that;
		};

		var inputModel = function() {
			var that = {};
			that.input = "";
			that.path = "";
			that.label = "";
			that.help = "";
			that.attributeName = "";
			that.value = ko.observable("");
			that.defaultValue = false;
			that.constructor = inputModel;
			that.nodeMessage = ko.observable("");
			that.nodeMessageClass = ko.observable("label label-info");
			that.options = [];
			that.clone = function() {
				var result = that.constructor();
				result.label = that.label;
				result.path = that.path;
				result.help = that.help;
				result.attributeName = that.attributeName;
				result.options = that.options;
				result.defaultValue = that.defaultValue;
				result.nodeMessage = ko.observable(that.nodeMessage());
				result.nodeMessageClass = ko.observable(that.nodeMessageClass());
				if (result.defaultValue) {
					result.value(that.value());
				}
				return result;
			};
			return that;
		};

		var textInputModel = function() {
			var that = inputModel();
			that.input = "textField";
			that.constructor = textInputModel;
			that.value= ko.observable();
			return that;
		};
		
		var datePickerInputModel = function() {
			var that = inputModel();
			that.input = "datePicker";
			that.constructor = datePickerInputModel;
			return that;
		};
		
		var headerInputModel = function() {
			var that = inputModel();
			that.input = "header";
			that.constructor = headerInputModel;
			return that;
		}

		var dialogueInputModel = function() {
			var that = inputModel();
			that.input = "dialogue";
			that.constructor = dialogueInputModel;
			return that;
		};

		var textAreaModel = function() {
			var that = inputModel();
			that.input = "textArea";
			that.constructor = textAreaModel;
			return that;
		};

		var radioButtonModel = function() {
			var that = inputModel();
			that.input = "radioButton";
			that.constructor = radioButtonModel;
			return that;
		};

		var dynamicCheckboxModel = function() {
			var that = inputModel();
			that.input = "dynamicCheckbox";
			that.value = ko.observableArray();
			that.constructor = dynamicCheckboxModel;
			return that;
		};

		var dropDownModel = function() {
			var that = inputModel();
			that.input = "dropDown";
			that.constructor = dropDownModel;
			return that;
		};

		///////////////////////////////////////////////////////////////////////
		// cD entity interface
		///////////////////////////////////////////////////////////////////////

		var initializeWithCookie = function(name){
			cwrcApi.initializeWithCookie(name);
		};

		cD.initializeWithCookie = initializeWithCookie;

		var initializeWithLogin = function(username, password) {
			cwrcApi.initializeWithLogin(username, password);
		};

		cD.initializeWithLogin = initializeWithLogin;

		// population functions

		var populateDialog = function(opts) {
			
			// change this to object
			/*
			switch (dialogType) {
				case "person" :
					switch (opts.repository) {
						case "cwrc":
						populateCWRC(opts);
						break;
					}
				break;
				case "organization":
				break;
				case "place":
				break;

			}
			*/

			switch (opts.repository) {
				case "cwrc":
					populateCWRC(opts);
				break;
			}
			

		}

		var populateCWRC = function(opts) {
			// cwrc
			
			var workingXML = $.parseXML(opts.data);
			
			children = workingXML.childNodes;
			var path = [];
			for (var i=0; i< children.length; ++i) {
				visitNodeCWRCPopulate(children[i], path, null);
			}
		}
		
		var extractTitleMODS = function(opts){
			var mods = $(opts.data);
			var modsFields = entity.viewModel().modsFields();
			var element = null;
			var result = {
				author: []
			};
			
			// Create the title element
			element = mods.find("titleInfo>title");
			result.title = element.text();
			
			// Create the author names
			mods.find("name>namePart").each(function(){
				result.author.push({
						name: $(this).text()
					});
			});
			
			// Create genre element
			var genre = mods.find("genre").text();
			result.modsType = genre;
			 
			// create origin info or related item info
			switch(genre){
				case 'Book (part)':
					element = mods.find("relatedItem > originInfo > dateIssued");
					break;
					
				case 'Journal (part)':
					element = mods.find("relatedItem > part > date");
					break;
					
				default:
					element = mods.find("originInfo > dateIssued");
					break;
			}
			if(element.length > 0){
				result.date = element.text();
			}
			
			element = mods.find("recordInfo > recordContentSource");
			if(element.length > 0){
				result.project = element.text();
			}
			
			return result;
		}

		var visitNodeCWRCPopulate = function (node, path, parentNode) {
			path.push(node.nodeName);
			
			var children = node.childNodes;	
			for (var i=0; i< children.length; ++i) {		
				var currentNode = children[i]
				visitNodeCWRCPopulate(currentNode, path, node);
			}

			var parentPath = path.slice(0, path.length-1);
			var nodeValue = $.trim(node.nodeValue);
			if (node.nodeType === 3 && nodeValue !== "") {
				foundAndFilled(nodeValue, parentPath, entity.viewModel().interfaceFields());

				var atts =parentNode.attributes;
				for (var attIndex =0; attIndex < atts.length; ++attIndex) {
					var currentAtt = atts.item(attIndex);
					parentPath.push(currentAtt.name);
					
					foundAndFilled(currentAtt.value, parentPath, entity.viewModel().interfaceFields());
					parentPath.pop();
				}

			} 

			path.pop();
		}

		var foundOnSeed = function(field, parentPath) {
			var result = false;
			$.each(field.seed.interfaceFields(), function(i, currentField) {
				if (parentPath.toString().indexOf(currentField.path) === 0) {
					result = true;
					return false;
				}
			});
			return result;
		}

		// XXX second seed is not added
		// XXX second value in group is not added 
		// XXX same problem ?

		var foundAndFilled = function(nodeValue, parentPath, field) {
			// 
			if (field.input === "quantifier") {
				// check path if sub continue


				// if (parentPath.toString().indexOf(field.path) > -1) {
				if (parentPath.toString().indexOf(field.path) === 0) {
					var foundOnFields = false;
					// alert(field.interfaceFields().length)
					$.each(field.interfaceFields(), function(i, currentField) {
						
						if(foundAndFilled(nodeValue, parentPath, currentField)) {							
							foundOnFields = true;
							return false; // break out of loop
						}
					});
					if (foundOnFields) {
						return true;
					}
					if (!foundOnFields) {
						if (foundOnSeed(field, parentPath)) {

							field.addGroup();

							var lastfield = last(field.interfaceFields()) ; 					
							return foundAndFilled(nodeValue, parentPath, lastfield);
						}
					}
					
				}


			} else if(field.input === "seed") {
				var foundOnSeedCheck = false;
				
				$.each(field.interfaceFields(), function(i, currentField) {
					
					if(foundAndFilled(nodeValue, parentPath, currentField)) {
						foundOnSeedCheck = true;
						return false; // break out of loop
					}
				});

				if(foundOnSeedCheck) {
					return true;
				}

			}else if (field.input !== " header") {				
				if (field.path == parentPath) {
					// console.log(field.input + " " + nodeValue);
					if (field.input == "radioButton" || field.input == "dynamicCheckbox") {
						field.value(nodeValue.split(","));
					} else {
						field.value(nodeValue);		
					}
					
					
					// XXX need to add another group in previous container
					return true;
				}
				// return true;
			}
		}

		// pop create		

		var popCreatePerson = function(opts) {
			dialogType = "person";
			entity.viewModel().dialogTitle("Add Person");
			completeDialog(opts);
			$('#cwrcEntityModal').modal('show');
			// hackish
			setTimeout(function(){
				$(".modal-body-area").scrollTop(0);
			},5);
		};

		cD.popCreatePerson = popCreatePerson;

		var popCreateOrganization = function(opts) {
			dialogType = "organization";
			entity.viewModel().dialogTitle("Add Organization");
			completeDialog(opts);
			$('#cwrcEntityModal').modal('show');
			// hackish
			setTimeout(function(){
				$(".modal-body-area").scrollTop(0);
			},5);
			
		};

		cD.popCreateOrganization = popCreateOrganization;

		var popCreatePlace = function(opts) {
			dialogType = "place";
			entity.viewModel().dialogTitle("Add Place");
			completeDialog(opts);
			$('#cwrcEntityModal').modal('show');
			// hackish
			setTimeout(function(){
				$(".modal-body-area").scrollTop(0);
			},5);
			
		};

		cD.popCreatePlace = popCreatePlace;
		
		var popCreateTitle = function(opts, data) {
			dialogType = "title";
			entity.viewModel().dialogTitle(entity.editing ? "Edit " + data.title : "Add Title");
			completeTitleDialog(opts, data);
			$('#cwrcTitleModal').modal('show');
			// hackish
			setTimeout(function(){
				$(".modal-body-area").scrollTop(0);
			},5);
			
		};

		cD.popCreateTitle = popCreateTitle;
		
		var popCreate = {
			person: popCreatePerson,
			organization : popCreateOrganization,
			place : popCreatePlace,
			title : popCreateTitle
		};

		cD.popCreate = popCreate;
		
		// pop edit

		var popEditPerson = function(opts) {
			entity.editing = true;
			entity.editingPID = opts.id;
			cD.popCreatePerson(opts);
			populateDialog(opts);
		};

		cD.popEditPerson = popEditPerson;

		var popEditOrganization = function(opts) {
			entity.editing = true;
			entity.editingPID = opts.id;
			cD.popCreateOrganization(opts);
			populateDialog(opts);
		};

		cD.popEditOrganization = popEditOrganization;

		var popEditPlace = function(opts) {
			entity.editing = true;
			entity.editingPID = opts.id;
			cD.popCreatePlace(opts);
			populateDialog(opts);
		}

		cD.popEditPlace = popEditPlace;
		
		var popEditTitle = function(opts) {
			entity.editing = true;
			cD.popCreateTitle(opts, extractTitleMODS(opts));
		}

		cD.popEditTitle = popEditTitle;

		///////////////////////////////////////////////////////////////////////
		// Search
		///////////////////////////////////////////////////////////////////////
		
		
		var search = {};
		search.buttons = ko.observableArray([]);
		// search.infoTitle = ko.observable("");
		search.dialogTitle = ko.observable("");

		search.getLinkedDataSource = function(specs) {


			var that = {
				results : ko.observableArray([]),
				ajaxRequest : null,
				name : specs.name === null ? "" : specs.name,
				processSearch : specs.processSearch === null ? function(queryString){} : specs.processSearch,
				// scrape : specs.scrape,
				htmlify : specs.htmlify,
				datatype: specs.datatype,
				showPanel: ko.observable(true)
			}

			return that;
		}

		search.processCWRCSearch = function(queryString) {
			search.processData = cwrcApi[dialogType].getEntity;
			search.linkedDataSources.cwrc.ajaxRequest = cwrcApi[dialogType].searchEntity({
				query : queryString,
				success : function(result){
					$.each(result["response"]["objects"], function(i, doc){
						search.linkedDataSources.cwrc.results.push(search.getResultFromCWRC(doc));
					});
				},
				error: function(result) {
					console.log(result);
				},
			});

		}
		
		search.processGeoNameData = function(id) {
			return xmlToString(search.linkedDataSources.geonames.response[id]);
		}

		search.processViafData = function(id) {
			var url = "http://apps.testing.cwrc.ca/services/viaf/" + id + "/viaf.xml";
			var result = "";
			$.ajax({
				url: url,
				dataType: "text",
				async : false,
				success : function(response) {
					result = response;
				},
				error: function() {
					alert("error");
				}
			});
			
			return result;
		}

		search.processVIAFSearch = function(queryString) {
			search.processData = search.processViafData;
			var viafUrl = "http://apps.testing.cwrc.ca/services/viaf/search";
			var viafPrefix = "";

			switch (dialogType) {
				case "person" :
				viafPrefix = "local.personalNames+all+";
				break;
				case "organization": 
				viafPrefix = "local.corporateNames+all+";
				break;
				case "place": 
				viafPrefix = "local.geographicNames+all+";
				break;
				case "title": 
				viafPrefix = "local.uniformTitleWorks+="; 
				break; 
			}
			var quotedQueryString = '"' + queryString + '"';
			search.linkedDataSources.viaf.ajaxRequest = $.ajax({
				url: viafUrl,
				// dataType : 'json',
				dataType : "xml",
				processData : false,
				data : "query=" + viafPrefix + quotedQueryString + "&httpAccept=text/xml",
				success: function(response) {
					$('searchRetrieveResponse record', response).each(function(index, spec) {
						search.linkedDataSources.viaf.results.push(search.getResultFromVIAF(spec, index));
					});
				},
				error : function(xhr, ajaxOptions, thrownError) {
					if (ajaxOptions !== "abort") {
						console.log("Error " + ajaxOptions);	
					}					
				}
			});
		}
		
		search.processGeoNameSearch = function(queryString) {
			search.processData = search.processGeoNameData;
			
			var quotedQueryString = encodeURI(queryString);
			search.linkedDataSources.viaf.ajaxRequest = $.ajax({
				url: geonameUrl,
				// dataType : 'json',
				dataType : "xml",
				processData : false,
				data : "query=" + quotedQueryString,
				success: function(response) {
					search.linkedDataSources.geonames.response = [];
					$('geonames geoname', response).each(function(index, spec) {
						search.linkedDataSources.geonames.results.push(search.getResultFromGeoName(spec, index));
						search.linkedDataSources.geonames.response.push(spec);
					});
				},
				error : function(xhr, ajaxOptions, thrownError) {
					if (ajaxOptions !== "abort") {
						console.log("Error " + ajaxOptions);	
					}					
				}
			});
		}

		// Scraping functions 

		search.scrapeResult = function() {
			if (search.selectedData) {
				search.selectedData.data = search.processData(search.selectedData.id);	
			}
		}		

		search.htmlifyCWRCPerson = function(){
			
			var data = search.selectedData;
			var workingXML = $.parseXML(data.data);
			
			// nationality
			// var nationalitySelector = "";
			// data.nationality = $(workingXML).find(nationalitySelector).first().text();

			// birthDeath
			var dateTypeSelector = "entity > person > description > existDates > dateSingle > dateType";
			
			var birthNode = $(workingXML).find(dateTypeSelector).filter(function(){ return $(this).text() == 'birth'; });
			var deathNode = $(workingXML).find(dateTypeSelector).filter(function(){ return $(this).text() == 'death'; });
			var birthValue = birthNode.siblings("standardDate").text();
			var deathValue = deathNode.siblings("standardDate").text()
			// if (birthValue !== "" && deathValue !== "") {
			// 	data.birthDeath = birthValue + "-" + deathValue;	
			// }
			data.birthDeath = "";

			if (birthValue !== "") {
				data.birthDeath += birthValue;
			}
			data.birthDeath += " - ";
			if (deathValue !== "") {
				data.birthDeath += deathValue;
			}

			if (data.birthDeath === " - ") {
				data.birthDeath = "";
			}
			
			// gender
			var genderSelector = "entity > person > description > genders > gender";
			data.gender = $(workingXML).find(genderSelector).first().text();

			// url
			data.url = "http://cwrc-dev-01.srv.ualberta.ca/islandora/object/" + data.id;
			
			return search.completeHtmlifyPerson(data);

		};

		search.htmlifyCWRCOrganization = function() {
			
			var data = search.selectedData;
			var workingXML = $.parseXML(data.data);
			// url
			data.url = "http://cwrc-dev-01.srv.ualberta.ca/islandora/object/" + data.id;
			return search.completeHtmlifyOrganization(data);
			
		}

		search.getAnchor = function(url) {
			var anchor = $("<a></a>");
			anchor.attr("target", "_blank");
			anchor.attr("href", url);
			anchor.append("URL:" + url);

			return anchor;
		}

		search.completeHtmlifyOrganization = function(data) {
			var head = $("<div></div>");
			var list = $("<ul></ul>");
			
			// for (var i =0 ; i< data.variantNames.length; ++i) {
			var listItem = $("<li></li>");
			
			listItem.append(search.getAnchor(data.url));
			list.append(listItem);
			// }
					
			head.append(list);
			
			return xmlToString(head[0]);
		}

		search.htmlifyCWRCTitle = function() {
			
			var data = search.selectedData;
			var workingXML = $.parseXML(data.data);
			// author, 
			data.authors = [];//"Author";
			var authorSelector = "mods > name"; // 

			var authors = $(workingXML).find(authorSelector).filter(function(){ return $(this).attr("type") === 'personal'; });
			$(authors).children("namePart").each(function(i, namePart){
				data.authors.push($(namePart).text());
			});
		
			//date, 

			var dateSelector = "mods > originInfo > dateIssued";
			data.date = $(workingXML).find(dateSelector).first().text();
			//URL
			data.url = "http://cwrc-dev-01.srv.ualberta.ca/islandora/object/" + data.id;

			return search.completeHtmlifyTitle(data);
		}

		search.completeHtmlifyTitle = function(data) {
			var head = $("<div></div>");
			var list = $("<ul></ul>");
			//author
			var listItem;
			for (var i=0 ;i<data.authors.length; ++i) {
				listItem = $("<li></li>");
				listItem.append("Author: " + data.authors[i]);
				list.append(listItem);	
			}
			
			// date
			listItem = $("<li></li>");
			listItem.append("Date: " + data.date);
			list.append(listItem);
			// url
			listItem = $("<li></li>");
			listItem.append(search.getAnchor(data.url));
			list.append(listItem);
			

			head.append(list);
			return xmlToString(head[0]);
		}

		search.htmlifyCWRCPlace = function() {
			var data = search.selectedData;
			var workingXML = $.parseXML(data.data);

			// First administrative division, country (displayed in line, separated by commas - if possible), 
			var firstSelector = "entity > place > description > firstAdministrativeDivision";
			var countrySelector = "entity > place > description > countryName";

			var first = $(workingXML).find(firstSelector).first().text();
			var country = $(workingXML).find(countrySelector).first().text();


			data.first = first + ", " + country;

			var latSelector = "entity > place > description > latitude";

			data.lat = $(workingXML).find(latSelector).first().text();
			var longSelector = "entity > place > description > longitude";
			data.long = $(workingXML).find(longSelector).first().text();


			data.url = "http://cwrc-dev-01.srv.ualberta.ca/islandora/object/" + data.id;

			return search.completeHtmlifyPlace(data);
		}

		search.completeHtmlifyPlace = function(data) {
			var head = $("<div></div>");
			var list = $("<ul></ul>");
			var listItem;

			// first
			listItem = $("<li></li>");
			listItem.append(data.first);
			list.append(listItem);
			// lat
			listItem = $("<li></li>");
			listItem.append("Latitude: " + data.lat);
			list.append(listItem);
			// long
			listItem = $("<li></li>");
			listItem.append("Longitude: " + data.long);
			list.append(listItem);
			// url
			listItem = $("<li></li>");
			listItem.append(search.getAnchor(data.url));
			list.append(listItem);
			

			head.append(list);
			return xmlToString(head[0]);
		}

		search.htmlifyVIAFPerson = function(){			
			var data = search.selectedData;
			return search.completeHtmlifyPerson(data);
		};

		search.completeHtmlifyPerson = function(data) {
			var result = "<div><ul>";

			if (data.nationality && data.nationality !== "") {
				result += "<li>Nationality: "+ data.nationality +"</li>";	
			}
			if (data.birthDeath && data.birthDeath !== "") {
				result += "<li>Birth - Death: "+ data.birthDeath +"</li>";	
			}
			// if (data.gender && data.gender !== "") {
			// 	result += "<li>Gender: "+ data.gender +"</li>";	
			// }
			if (data.url && data.url !== "") {
				result += "<li>URL: <a target='_blank' href='" + data.url + "'>" + data.url +"</a></li>";
			}
			result += "</ul></div>";
			return result;
		}

		

		search.htmlifyVIAFOrganization = function(){
			var result = "";
			var data = search.selectedData;

			result += "<div><ul>";		
			if (data.url !== "") {
				result += "<li>URL: <a href='" + data.url + "'>" + data.url +"</a></li>";
			}
			result += "</ul></div>";
			return result;
		};


		search.htmlifyVIAFTitle = function(){
			var result = "";
			var data = search.selectedData;

			result += "<div><ul>";		
			if (data.url !== "") {
				result += "<li>URL: <a href='" + data.url + "'>" + data.url +"</a></li>";
			}
			result += "</ul></div>";
			return result;
		};

		search.linkedDataSources = {
			"cwrc": search.getLinkedDataSource({
				"name": "CWRC", 
				"processSearch": search.processCWRCSearch,
				"datatype": ["person", "place", "organization", "title"]
			}),
			"viaf": search.getLinkedDataSource({
				"name": "VIAF", 
				"processSearch": search.processVIAFSearch,
				"datatype": ["person", "organization", "title"]
			}),
			"geonames": search.getLinkedDataSource({
				"name": "GeoNames",
				"processSearch": search.processGeoNameSearch,
				"datatype": ["place"]
			})
		}

	

		search.selectedLinkedDataSource = "cwrc";
		search.queryString = ko.observable("");

		// templates

		search.getLinkedDataSourceTemplates = function() {
			var result = "";
			var index = 0;
			for (var key in search.linkedDataSources) {
				var lds = search.linkedDataSources[key];
				result +=
				'										<div class="panel panel-default" data-bind="visible: $root.linkedDataSources.' + key+ '.showPanel">' +
				'											<div data-name="'+key+'" class="panel-heading panel-title" data-toggle="collapse" data-parent="#accordion" href="#collapse'+key+'" data-bind="{click:$root.selectLinkedDataSource}">' +
				'														' + lds.name +
				'											</div>' +
				'											<div id="collapse'+key+'"" class="panel-collapse collapse '+(function(){return index ===0 ? "in" : ""})()+'">' +
				'												<div class="panel-body">' +
				// content
				'									<div class="list-group cwrc-result-area">' +
				'										<!-- ko foreach: linkedDataSources.'+key+'.results -->' +
				'										<a href="#" class="list-group-item" data-bind="{click:$root.selectResult, event: { dblclick: $root.returnAndHide }, css: {active: selected}}" >' +
				'											<h5 class="list-group-item-heading">' +
				'												<span data-bind="text: name"></span>' +
				'												<span class="cwrc-entity-info pull-right glyphicon glyphicon-info-sign" data-bind="click: $root.showInfoPopOver" data-content="Test content" data-original-title="Test title"></span>' +
				'											</h5>' +
				// '											<h5 class="list-group-item-heading"> <span data-bind="text:data[\'dc.title\']"></span> - <span data-bind="text:source"></span></h5>' +
				// '											<p class="list-group-item-text"><span data-bind="text:data.id"></span></p>' +
				'										</a>' +
				'										<!-- /ko -->' +
				'									</div>' +
				// end of content
				'												</div>' +
				'											</div>' +
				'										</div>';
				// alert(lds.name);
				++index;
			}


			return result;
		}


		search.initialize = function() {

			var queryResultsTemplate = '' +
			'<script type="text/html" id="queryResults">' +
			'										<div class="panel panel-default">' +
			'											<div data-name="NAME VARIABLE" class="panel-heading panel-title" data-toggle="collapse" data-parent="#accordion" href="#collapseOne" data-bind="{click:$root.selectLinkedDataSource}">' +
			'														NAME VARIABLE' +
			'											</div>' +
			'											<div id="collapseOne" class="panel-collapse collapse in">' +
			'												<div class="panel-body">' +
			// content
			'									<div class="list-group cwrc-result-area">' +
			// '										<!-- ko foreach: results.cwrc -->' +
			// '										<a href="#" class="list-group-item" data-bind="{click:$root.selectResult, css: {active: selected}}" >' +
			// '											<h5 class="list-group-item-heading"> <span data-bind="text:data[\'dc.title\']"></span> - <span data-bind="text:source"></span></h5>' +
			// '											<p class="list-group-item-text"><span data-bind="text:data.id"></span></p>' +
			// '										</a>' +
			// '										<!-- /ko -->' +
			'									</div>' +
			// end of content
			'												</div>' +
			'											</div>' +
			'										</div>' +
			'</script>';

			// $('head').append(queryResultsTemplate);

			var searchTemplates = '' +
			'<div id="cDSearch" class="bootstrap-scope">' +
			'	<div class="modal fade" id="cwrcSearchDialog">' +
			'		<div class="modal-dialog" id="search-modal">' +
			'			<div class="modal-content">' +
			'				<div class="modal-header">' +
			'					<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
			// '					<h4 class="modal-title"><span>Search XXX</span></h4>' +
			'						<h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
			'				</div>' +
			'				<div class="modal-body">' +
			'					<!-- Content -->' +
			'					<div class="row">' +
			'						<div class="col-lg-12">' +
			'								<input type="text" class="form-control" id="searchEntityInput" placeholder="Search" data-bind="{value:queryString, onKeyUp: delayedSearchEntity}">' +
			'						</div><!-- /.col-lg-6 -->' +
			'					</div><!-- /.row -->' +
			'					<br> <!-- FIXME -->' +
			'					<div class="row">' +
			'						<!-- Results -->' +
			'						<div class="col-lg-12">' +
			'							<div class="panel">' +
			// '								<div class="panel-heading">Results</div>' +
			'								<div class="panel-body">' +
//		
			'									<div class="panel-group" id="accordion">' +
														search.getLinkedDataSourceTemplates() +
			// '										<!-- ko foreach: linkedDataSources -->' +
			// '										+<div data-bind="template: { name: \'queryResults\', data: $data }"></div>' +
			// '										<!-- /ko -->' +
			'									</div>' +
//			

			'								</div>' +
			'							</div>' +
			'						</div>' +
			'					</div>' +
			'					<!--  End of content-->' +
			'				</div>' +
			'				<div class="modal-footer">' +
			'					<button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>' +
			'					<!-- ko foreach: buttons -->' +
			'					<button type="button" class="btn btn-default" data-dismiss="modal" data-bind="text:label, click: $root.runCustomAction"></button>' +
			'					<!-- /ko -->' +
			// '					<button type="button" class="btn btn-default" data-bind="click: createEntity">Add New</button>' +
			'					<button type="button" class="btn btn-primary" data-dismiss="modal" data-bind="click: returnSelected">Select</button>' +
			'				</div>' +
			'			</div>' +
			'		</div>' +
			'	</div>' +
			'</div>';
			
			$('body').append(searchTemplates);



			

			ko.bindingHandlers.onKeyUp = {
				init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
					ko.utils.registerEventHandler(element, 'keyup', function(evt) {
						valueAccessor().call(viewModel);
					});
				}
			};

			ko.applyBindings(search, $("#cDSearch")[0]);
			$("#cwrcSearchDialog").modal(params.modalOptions);
			$("#cwrcSearchDialog").draggable({	
				handle: ".modal-header"
			});
			$("#cwrcSearchDialog").on('hidden.bs.modal', function () {
  				// stop ajax call if exists
				for(var key in search.linkedDataSources) {
					var lds = search.linkedDataSources[key];
					if (lds.ajaxRequest) {
						lds.ajaxRequest.abort();							
					}
				}
				search.clear();
			});

		}

		// search functionality

		search.clear = function() {
			search.selectedData = null;
			for (var key in search.linkedDataSources) {
				var lds = search.linkedDataSources[key];
				lds.results.removeAll();
			}
			search.queryString("");
			search.initiateInfo();
			search.removeInfoPopOver();
		};

		// search.delayedTimeout;
		search.delayedSearchEntity = function() {
			clearTimeout(search.delayedTimeout);
			search.delayedTimeout = setTimeout(search.searchEntity, 1000);
		}

		search.searchEntity = function() {
			// TEMP
			search.removeInfoPopOver();
			search.performSearch($("#searchEntityInput").val());
		};

		// Logic functions

		// models
		
		search.result = function(specs) {
			var that = {
				// processed initially
				name : "",
				id : "",
				// processed for result
				data : "",
				// scrape : function() {return "";}, // defined for each linked data source
				// helper
				selected : ko.observable(false)
			}
			return that;
		}
		
		search.htmlifyGeoNamePlace = function(name, countryName, latitude, longitude, id){
			var head = $("<div></div>");
			var list = $("<ul></ul>");
			
			
			var listItem = $("<li></li>");
			listItem.append("Country: " + countryName);
			list.append(listItem);
			
			listItem = $("<li></li>");
			listItem.append("Latitude: " + latitude);
			list.append(listItem);
			
			listItem = $("<li></li>");
			listItem.append("Longitude: " + longitude);
			list.append(listItem);
			
			var url = "http://www.geonames.org/" + id;
			listItem = $("<li></li>");
			listItem.append("URL:&nbsp;<a href='" + url + "' target='_blank'>" + url + "</a>");
			list.append(listItem);
			
			head.append(list);
			
			return xmlToString(head[0]);
		}
		
		search.getResultFromGeoName = function(specs, index) {
			// specs has data and source
			var that = search.result();
			that.id = index;
			that.name = $(specs).find("name").text() + ", " + $(specs).find("countryName").text();

			
			that.htmlify = function(){
				return search.htmlifyGeoNamePlace($(specs).find("name").text(),
				 $(specs).find("countryName").text(),
				 $(specs).find("lat").text(),
				 $(specs).find("lng").text(),
				 $(specs).find("geonameid").text())
				 };
			
			return that;
		}

		search.getResultFromCWRC = function(specs) {
			// specs has data and source
			var that = search.result();
			that.name = specs["solr_doc"]["fgs_label_s"];
			that.id = specs["PID"];

			
			switch (dialogType) {
				case "person":
				// that.scrape = search.scrapeCWRCPerson;
				that.htmlify = search.htmlifyCWRCPerson;
				break;
				case "organization":
				// that.scrape = search.scrapeCWRCOrganization;
				that.htmlify = search.htmlifyCWRCOrganization;
				break;
				case "title":
				// that.scrape = search.scrapeCWRCTitle;
				that.htmlify = search.htmlifyCWRCTitle;
				break;
				case "place":
				// that.scrape = search.scrapeCWRCTitle;
				that.htmlify = search.htmlifyCWRCPlace;
				break;
			}
			
			return that;
		}

		search.viafSelectorHelper = function(originalSelector) {
			var pattern = /ns\d+\\:/g;
			var newSelector = originalSelector.replace(pattern, "");
			var result = originalSelector + " , " + newSelector;
			return result;
		}

		search.getResultFromVIAF = function(specs, index) {
			var that = search.result();
			var i = index + 2
			// Chrome has a bug which does not find elements with namesapces, to avoid this problem we define the selector twice
			// VIAF returns all of the required information on the list call so there is no need to request again on second call
			var codeSelector = "a";
			switch(dialogType) {
				case "person":
				case "organization":
					codeSelector = "a";
					break;
				case "title":
					codeSelector = "t";

			}

			var nameSelector = search.viafSelectorHelper("recordData >  ns"+i+"\\:VIAFCluster >  ns"+i+"\\:mainHeadings > ns"+i+"\\:mainHeadingEl > ns"+i+"\\:datafield > ns"+i+"\\:subfield[code='"+codeSelector+"']"); //code attribute a
			var idSelector = search.viafSelectorHelper("recordData ns"+i+"\\:VIAFCluster ns"+i+"\\:viafID");
			

			that.name =  $(specs).find(nameSelector).first().text(); //$(specs).find(nameSelector).text();
			that.id = $(specs).find(idSelector).first().text();
			
			// Extra
			var urlSelector = search.viafSelectorHelper("recordData >  ns"+i+"\\:VIAFCluster >  ns"+i+"\\:Document");
			that.url = $(specs).find(urlSelector).first().attr("about");
			
			switch(dialogType) {
				case "person":
					search.completeViafPersonResult(that, specs, i);
				break;
				case "organization":
					search.completeViafOrganizationResult(that, specs, i);
				break;
				case "title":
					search.completeViafTitleResult(that, specs, i);
				break;
			}	

			switch (dialogType) {
				case "person":
				// that.scrape = search.scrapeVIAFPerson;
				that.htmlify = search.htmlifyVIAFPerson;
				break;
				case "organization":
				// that.scrape = search.scrapeVIAFOrganization;
				that.htmlify = search.htmlifyVIAFOrganization;
				break;
				case "title":
				// that.scrape = search.scrapeVIAFTitle;
				that.htmlify = search.htmlifyVIAFTitle;
				break;
			}

			return that;
		}

		// CompleteVIAFXXXResult extends the result object with specifics of each entity

		search.completeViafPersonResult = function(that, specs, i) {
			var birthDeathSelector = search.viafSelectorHelper("recordData >  ns"+i+"\\:VIAFCluster >  ns"+i+"\\:mainHeadings > ns"+i+"\\:mainHeadingEl > ns"+i+"\\:datafield > ns"+i+"\\:subfield[code='d']");
			var genderSelector = search.viafSelectorHelper("recordData >  ns"+i+"\\:VIAFCluster >  ns"+i+"\\:fixed > ns"+i+"\\:gender");
			var genderCode = $(specs).find(genderSelector).first().text();

			that.birthDeath = $(specs).find(birthDeathSelector).first().text();
			switch (genderCode) {
				case 'a':
					that.gender = 'Female';
					break;
				case 'b':
					that.gender = 'Male';
					break;
				default:
					that.gender = 'Unspecified';
			}
		}

		search.completeViafOrganizationResult = function(that, specs, i) {
			
		}
		
		search.completeViafTitleResult = function(that, specs, i) {
			
		}

		search.selectResult = function(result) {
			$.each(search.linkedDataSources[search.selectedLinkedDataSource].results(), function(i, entry){
				entry.selected(false) ;
			});
			result.selected(true);
			search.selectedData = result;
		};

		search.selectLinkedDataSource = function(data, event) {
			search.selectedLinkedDataSource = $(event.target).attr("data-name");
			search.searchEntity();
		}

		search.performSearch = function(queryString) {
			search.selectedData = null;
			
			for (var key in search.linkedDataSources) {
				var lds = search.linkedDataSources[key];
				lds.results.removeAll();
			}

			search.selectedData = null;
			if (queryString !== "") {

				// CWRC Search
				for(var key in search.linkedDataSources) {
					var lds = search.linkedDataSources[key];
					if (lds.ajaxRequest !== null) {
						lds.ajaxRequest.abort();	
					}
				}
				search.linkedDataSources[search.selectedLinkedDataSource].processSearch(queryString);
			}
		};

		search.processData = function() {
			return "";
		}

		search.GetResult = function() {
			var result = {};
			if (search.selectedData) {
				result.id = search.selectedData.id;
				result.name = search.selectedData.name;
				result.repository = search.selectedLinkedDataSource;
				result.data= search.selectedData.data;	
			}
			return result;
		}

		search.runCustomAction = function(custom) {			
			search.scrapeResult();
			custom.action(search.GetResult());
			search.clear();
		}

		search.returnSelected = function() {
			search.scrapeResult();
			search.success(search.GetResult());
			search.clear();
		};

		search.initiateInfo = function() {			
			$("#search-modal").popover({
				title : function(){return search.selectedData.name;},
				content : function(){
					var result = "";
					result += "<div>";
					// result += search.scrapeInformation(search.selectedData);
					var selectedDataSource = search.linkedDataSources[search.selectedLinkedDataSource];
					// result += selectedDataSource.scrape[dialogType]();
					search.scrapeResult();
					result += search.selectedData.htmlify();
					result += "</div>";
					return result;
				},
				html: true,

				trigger: "manual"
			});
		}

		search.showInfoPopOver = function(clicked) {
			search.selectResult(clicked);
			$("#search-modal").popover("show");
			$(".popover").find(".arrow").removeClass("arrow");
		}


		search.removeInfoPopOver = function() {			
			$("#search-modal").popover("hide");
		}

		search.returnAndHide = function() {
			search.returnSelected();
			$("#cwrcSearchDialog").modal("hide");
		}

		///////////////////////////////////////////////////////////////////////
		// cD search interface
		///////////////////////////////////////////////////////////////////////

		var completeSearchDialog = function(opts) {
			$("#cwrcSearchDialog").modal("show");
			search.buttons.removeAll();
			// search.buttons(opts.buttons);
			if (opts.buttons) {
				for (var i = 0; i< opts.buttons.length; ++i) {
					var button = opts.buttons[i];
					if (typeof(button.label) === 'string' && 
						typeof(button.action) === 'function') {
						search.buttons.push(button);	
					}
				}
			}
			
			// define panels to be shown
			var dataId = "";
			for(dataId in search.linkedDataSources){
				var dataSource = search.linkedDataSources[dataId];
				dataSource.showPanel(dataSource.datatype.indexOf(dialogType) > -1);
			}
		
			// alert(search.buttons[0].label)
			search.success = typeof opts.success === undefined ? function(){} : opts.success;
			search.error = typeof opts.error === undefined ? function(){} : opts.error;
		}

		var popSearchPerson = function(opts) {
			search.clear();
			search.dialogTitle("Search Person");
			dialogType = "person";
			
			// search.buttons = opts.buttons ? opts.buttons : [];
			// search.buttons = opts.buttons;
			completeSearchDialog(opts);

		};

		cD.popSearchPerson = popSearchPerson;

		var popSearchOrganization = function(opts) {
			search.clear();
			search.dialogTitle("Search Organization");
			dialogType = "organization";
			completeSearchDialog(opts);

		}

		cD.popSearchOrganization = popSearchOrganization;
		
		var popSearchPlace = function(opts) {
			search.clear();
			search.dialogTitle("Search Place");
			dialogType = "place";
			completeSearchDialog(opts);
		}
		
		cD.popSearchPlace = popSearchPlace;

		var popSearchTitle = function(opts) {
			search.clear();
			search.dialogTitle("Search Title");
			dialogType = "title";
			completeSearchDialog(opts);	
		}

		cD.popSearchTitle = popSearchTitle;

		var popSearch = {
			person: popSearchPerson,
			organization : popSearchOrganization,
			place : popSearchPlace,
			title: popSearchTitle
		};

		cD.popSearch = popSearch;

		///////////////////////////////////////////////////////////////////////

		initialize();

	})();
});
