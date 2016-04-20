// CWRC-Dialogs Library for the entities: Person, Organization, Place, and Title
//
// The purposes of this JavaScript file:
// * render entity-based Search dialogs, populate via a API call to Solr
// * allow selection of a given entity and pass info to another library (e..g CWRC-Writer)
// * create new (via popCreateXXX) Person, Place, Organization entities through a form build based on qualities of an Relax-NG schema and annotations embedded with the schema (e.g. http://cwrc.ca/schemas/entities.rng - except for Title Entities), and serialize the form as XML to save via an API call
// * edit an existing (via popEditXXX) Person, Place, and Organization (no editing of Titles) with a process equivalent to creation but with an extra step to read an existing XML doc from an API call to the repository and populating the rendered form
// * http://cwrc.ca/schemas/entities.rng - contains instructions on how to use the annotations within the schema
// * Title entities are handled very differently relative to Person, Place, Organization.  Titles are built from a hard-coded form and based on a MODS schema using only a small subset of properties.
// * main entry points:
// ** popCreateXXX
// ** popEditXXX
// ** entity.viewModel().processCallback
//
// Note: "seed" appears to be a template for adding a new branch to the model

// ToDo:
// * reorganize code such that the Title specific components are grouped together
// * bug if source RNG schema has an implied required element.  It needs to be wrapped in an interleave element otherwise the qualifier (e.g. oneOrMore, zeroOrMore, optional, or implied "required") is not represented in the model and the model in not serialized to XML properly - don't know how to quickly fix so we changed the schema - 2015-02-24
// e.g. 
// <element ..>
//   <ref name="occupation-element"/>
// </element ..>

// Tree traversal
define(['jquery', 'knockout', 'jquery-ui', 'bootstrap', 'bootstrap-datepicker', 'cwrc-api'], function ($, ko) {
    cD = {};
    (function () {
        // Cwrc Api
        var cwrcApi = null;
        cD.setCwrcApi = function (url) {
            cwrcApi = new CwrcApi(url, $);
        }

        // CWRC Base URL to a repository object
        var repositoryBaseObjectURL = null;
        cD.setRepositoryBaseObjectURL = function (url) {
            repositoryBaseObjectURL = url;
        }

        // Geonames Url
        var geonameUrl = null;
        cD.setGeonameUrl = function (url) {
            geonameUrl = url;
        }

        // Viaf Url
        var viafUrl = null;
        cD.setViafUrl = function (url) {
            viafUrl = url;
        }

        // Google geocode api url
        var googleGeocodeUrl = null;
        cD.setGoogleGeocodeUrl = function (url) {
            googleGeocodeUrl = url;
        }

        // parameters

        var params = {};
        params.lang = "a:en";
        params.modalOptions = {
            show : false,
            keyboard : true,
            backdrop : false
            // maxHeight: 500
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

        var last = function (array) {
            return array[array.length - 1];
        };

        var initialize = function () {
            entity.initialize();
            search.initialize();
        };

        var setHelp = function () {
            $(".cwrc-help").bsTooltip({
                // trigger: "hover",
                placement : 'right',
                trigger : 'click',
                delay : {
                    show : 100,
                    hide : 100
                },
            });
            // $('.dpYears').bsDatepicker();

            // $('.input-append.date').datepicker({
            //  format: "yyyy-mm-dd",
            //  viewMode: 2,
            //  autoclose: true
            // })

            // .on('changeDate', function (ev) {
            // for (i in ev) {
            //  if (ev.hasOwnProperty(i)) {
            //      console.log(i)
            //  }
            // }
            // console.log(ev.target)
            // console.log(ko.toJSON(ev.date).substr(1, 10));
            // $(ev.target).find("input").first().val(ko.toJSON(ev.date).substr(1, 10));

            // console.log($(ev.target).find("input").first().val())
            // if($(ev.target).find("input").first().val()) {
            //  $(ev.target).find("input").first().val(ko.toJSON(ev.date).substr(1, 10));
            // }

            // console.log($(ev.target).find("input")[0].val(ko.toJSON(ev.date).substr(1, 10)))
            // });
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
        entity.viewModel().showSavingMessage = ko.observable("");
        entity.selfWorking = $.parseXML('<entity></entity>');
        entity.elementPath = [];
        entity.startValuePath = [];
        entity.currentPadding = "0";

        entity.editing = false;
        entity.editingPID = "";

        entity.init = function() {
            entity.selfWorking = $.parseXML('<entity></entity>');
            entity.elementPath = [];
            entity.startValuePath = [];
            entity.currentPadding = "0";
            entity.editing = false;
            entity.editingPID = "";
        }

        entity.init();


        entity.viewModel().modsFields = ko.observable({
                modsTypes : [{
                        name : ''
                    }, {
                        name : 'Audio'
                    }, {
                        name : 'Book (part)'
                    }, {
                        name : 'Book (whole)'
                    }, {
                        name : 'Correspondence'
                    }, {
                        name : 'Journal (part)'
                    }, {
                        name : 'Journal (whole)'
                    }, {
                        name : 'Manuscript'
                    }, {
                        name : 'Video'
                    }, {
                        name : 'Web resource'
                    },
                ],
                modsType : ko.observable(""),
                title : ko.observable(),
                author : ko.observableArray([
                    ]),
                date : ko.observable(),
                project : ko.observable(),
                sameAs : ko.observable(),
                validation : {
                    modsType : ko.observable(true),
                    title : ko.observable(true),
                    date : ko.observable(true)
                },
                addNewAuthor : function () {
                    var author = {
                        name : ko.observable("")
                    };

                    entity.viewModel().modsFields().author.push(author);

                    return author;
                },
                removeThisAuthor : function (author) {
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

        // XXX Add namespace

        entity.setPersonSchema = function (url) {
            $.ajax({
                type : "GET",
                async : false,
                url : url,
                dataType : "xml",
                success : function (xml) {
                    entity.person.schema = xml;
                }
            });
        }

        cD.setPersonSchema = entity.setPersonSchema;

        entity.setOrganizationSchema = function (url) {
            $.ajax({
                type : "GET",
                async : false,
                url : url,
                dataType : "xml",
                success : function (xml) {
                    entity.organization.schema = xml;
                }
            });
        }

        cD.setOrganizationSchema = entity.setOrganizationSchema;

        entity.setPlaceSchema = function (url) {
            $.ajax({
                type : "GET",
                async : false,
                url : url,
                dataType : "xml",
                success : function (xml) {
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

        // initialization of the entity form
        // contains the HTML templates for the various types of nodes
        // added to the interface model datastructure
        // the "id" in the script element maps to node property of "input"
        // Note: contains the Knockout JS properties
        entity.initialize = function () {

            // entity.setPersonSchema("./schemas/entities.rng");
            // entity.setOrganizationSchema("./schemas/entities.rng");

            var entityTemplates = '' +
                '       <script type="text/htmlify" id="quantifier">' +
                '           <div class="quantifier" data-bind="css:fieldCSSClass ,  style:{margin : fieldPadding()}">' +
                '           <div>' +
                // '                <h2><span data-bind="text: header"></span></h2>' +
                '               <span data-bind="text: label"></span>' +
                '               <span  data-bind="if: isGrowable()">' +
                '                   <span data-bind="if: showAddButton()">' +
                '                       <button data-bind="click: addGroup" class="btn btn-default btn-xs"><span class="fa fa-plus"</span></button>' +
                '                   </span>' +
                '               </span>' +
                '           </div>' +
                '           </div>' +
                '           <div class="interfaceFieldsContainer" data-bind="css:fieldCSSClass , template:{name: $root.displayMode, foreach: interfaceFields}"/> ' +
                '       </script>' +
                '       <script type="text/html" id="seed">' +
                '           <!--seed-->' +
                '           <div class="seed">' +
                '               <span data-bind="template:{name: $root.displayMode, foreach: interfaceFields}"></span>' +
                '               <span data-bind="if: $parent.showRemoveThisButton()">' +
                '                   <button data-bind="click: $parent.removeThisGroup" class="btn btn-default btn-xs">' +
                '                       <span class="fa fa-minus"></span>' +
                '                   </button>' +
                '               </span>' +
                '           </div>' +
                '       </script>' +
                '       <script type="text/html" id="textField">' +
                '           <!--textField-->' +
                '           <span data-bind="style:{margin : fieldPadding()}">' +
                '               <span data-bind="text: label"></span> ' +
                '               <input data-bind="value: value" /> ' +
                '               <span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '               <div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
                '           </span>' +
                '       </script>' +
                '       <script type="text/html" id="readonlyTextField">' +
                '           <!-- readonlyTextField-->' +
                '           <span data-bind="css:fieldCSSClass, style:{margin : fieldPadding()}">' +
                '               <span data-bind="text: label"></span> ' +
                '               <input data-bind="value: value" readonly="readonly" /> ' +
                '           </span>' +
                '       </script>' +
                '       <script type="text/html" id="header">' +
                '           <!--header-->' +
                '           <span>' +
                '               <h4><span data-bind="text: label, style:{margin : fieldPadding()}"></span></h4>' +
                '           </span>' +
                '       </script>' +

                '       <script type="text/html" id="datePicker">' +
                '           <!-- datePicker -->' +
                '           <span>' +
                '               <span data-bind="text: label"></span> ' +
                '               <div class="input-append date" data-date="2014-01-01">' +
                '                   <input placeholder="YYYY-MM-DD" type="text" class="span2" data-date="2014-01-01" data-bind="datepicker: value">' +
                '                   <button data-date="2014-01-01" class=" add-on btn btn-default btn-xs"><span class="fa fa-calendar"></span></button>' +
                '                   <span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '               </div>' +
                '               <div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
                '           </span>' +
                '       </script>' +
                '       <script type="text/html" id="dialogue">' +
                '           <!--dialogue-->' +
                '           <span data-bind="style:{margin : fieldPadding()}">' +
                '               <span class="cwrc-help" data-bind="text: label, attr:{\'title\': help}"></span> ' +
                '           </span>' +
                '       </script>' +
                '       <script type="text/html" id="textArea">' +
                '           <!--textArea-->' +
                '           <span data-bind="style:{margin : fieldPadding()}">' +
                '               <span data-bind="text: label"></span> ' +
                '               <textarea rows="4" cols="50" data-bind="value: value"></textarea> ' +
                '               <span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '               <div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>' +
                '           </span>' +
                '       </script>' +
                '       <script type="text/html" id="radioButton">' +
                '           <span data-bind="style:{margin : fieldPadding()}">' +
                '               <span data-bind="text: label"></span>' +
                '               <ul data-bind="foreach: options">' +
                '                   <li>' +
                '                       <input type="radio" data-bind="attr: { value: value, name : $parent.path }, checked: $parent.value"> ' +
                '                       <span data-bind="text:content"></span> ' +
                '                   </li>' +
                '               </ul>' +
                '               <span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '           </span>' +
                '       </script>' +
                '       <script type="text/html" id="dynamicCheckbox">' +
                '           <span data-bind="style:{margin : fieldPadding()}">' +
                '               <span data-bind="text: label"></span>' +
                '               <ul data-bind="foreach: options">' +
                '                   <li>' +
                '                       <input type="checkbox" data-bind="attr: { value: value, name : $parent.path }, checked: $parent.value"> ' +
                '                       <span data-bind="text:content"></span> ' +
                '                   </li>' +
                '               </ul>' +
                '               <span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '           </span>' +
                '       </script>' +
                '       <script type="text/html" id="dropDown">' +
                '           <span data-bind="style:{margin : fieldPadding()}">' +
                '           <select data-bind="value: value, options: options, optionsText: \'content\', optionsValue: \'value\'"></select>' +
                '               <span class="cwrc-help fa fa-question-circle" data-bind="attr:{\'title\': help}"></span>' +
                '           </span>' +
                '       </script>';

            // Initial frame for the dialog to create/edit an Entity
            // Entity form elements are added afterward
            var newDialogTemplate = '' +
                '<div id="newDialogue" class="bootstrap-scope cwrcDialog" title="">' +
                '<div class="modal fade" id="cwrcEntityModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
                '   <div class="modal-dialog">' +
                '       <div class="modal-content">' +
                '           <div class="modal-header">' +
                '               <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                '               <span><h5 class="modal-title pull-right"><span data-bind="text: showSavingMessage"></span> <i id="showSavingIcon"></i>&nbsp;</h5></span>' +
                '               <h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
                '           </div>' +
                '           <div class="modal-body modal-body-area">' +
                '               <div data-bind="template: { name: displayMode , foreach: interfaceFields }">' +
                '               </div>' +
                '           </div>' +
                '           <div class="modal-footer">' +
                '               <div class="label label-danger" data-bind="ifnot: validated"> Form is not valid</div>' +
                '               <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>' +
                '               <button type="button" class="btn btn-primary" data-bind="click: $root.processCallback">Ok</button>' +
                '           </div>' +
                '       </div>' +
                '   </div>' +
                '</div>' +
                '</div>';

            // Initial frame for the dialog to create/edit an Entity
            // Title entity forms are not created through automated
            // inspection of a RELAX-NG
            var newTitleDialogTemplate = '' +
                '<div id="newTitleDialogue" class="bootstrap-scope cwrcDialog" title="">' +
                '<div class="modal fade" id="cwrcTitleModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">' +
                '   <div class="modal-dialog">' +
                '       <div class="modal-content">' +
                '           <div class="modal-header">' +
                '               <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                '               <span><h5 class="modal-title pull-right"><span data-bind="text: showSavingMessage"></span> <i id="showSavingIcon"></i>&nbsp;</h5></span>' +
                '               <h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
                '           </div>' +
                '           <div class="modal-body modal-body-area" data-bind="with: modsFields">' +
                //Type of Resource
                '               <div class="quantifier">' +
                '                   <div>' +
                '                       <span>Type of resource</span>' +
                '                   </div>' +
                '                   <div class="interfaceFieldsContainer"> ' +
                '                       <select data-bind="options: modsTypes, optionsText: \'name\', optionsValue: \'name\', value: modsType">' +
                '                       </select>' +
                '                       <div class="label label-info" data-bind="if:validation.modsType">Required value</div>' +
                '                       <div class="label label-danger" data-bind="ifnot:validation.modsType">Required value</div>' +
                '                   </div>' +
                '               </div>' +
                //Title
                '               <div class="quantifier">' +
                '                   <div>' +
                '                       <span>Title</span>' +
                '                   </div>' +
                '                   <div class="interfaceFieldsContainer"> ' +
                '                       <input data-bind="value: title">' +
                '                       <div class="label label-info" data-bind="if:validation.title">Required value</div>' +
                '                       <div class="label label-danger" data-bind="ifnot:validation.title">Required value</div>' +
                '                   </div>' +
                '               </div>' +
                //Authors
                '               <div class="quantifier">' +
                '                   <div>' +
                '                       <span>Author</span>' +
                '                           <span>' +
                '                               <span>' +
                '                                   <button data-bind="click: addNewAuthor" class="btn btn-default btn-xs"><span class="fa fa-plus"</span></button>' +
                '                               </span>' +
                '                           </span>' +
                '                       </div>' +
                '                   <div class="interfaceFieldsContainer" data-bind="foreach: author"> ' +
                '                       <div>' +
                '                           <span>' +
                '                               <input data-bind="value: name" /> ' +
                '                               <!--<div class="label" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}"></div>-->' +
                '                           </span>' +
                '                           <span data-bind="if: $index">' +
                '                               <button data-bind="click: $parent.removeThisAuthor" class="btn btn-default btn-xs">' +
                '                                   <span class="fa fa-minus"></span>' +
                '                               </button>' +
                '                           </span>' +
                '                       </div>' +
                '                   </div>' +
                '               </div>' +
                //Date
                '               <div class="quantifier">' +
                '                   <div>' +
                '                       <span>Date</span>' +
                '                   </div>' +
                '                   <div class="interfaceFieldsContainer"> ' +
                //'                     <div class="input-append date">' +
                '                           <input placeholder="YYYY-MM-DD" type="text" class="span2" data-bind="value: date">' +
                //'                         <button class=" add-on btn btn-default btn-xs"><span class="fa fa-calendar"></span></button>' +
                '                           <span class="cwrc-help fa fa-question-circle" title="Date must be in the form of YYYY, YYYY-MM or YYYY-MM-DD."></span>' +
                //'                     </div>' +
                '                       <div class="label label-danger" data-bind="ifnot:validation.date">Invalid date</div>' +
                '                   </div>' +
                '               </div>' +

                //Project
                '               <div class="quantifier">' +
                '                   <div>' +
                '                       <span>Project</span>' +
                '                   </div>' +
                '                   <div class="interfaceFieldsContainer"> ' +
                '                       <input data-bind="value: project">' +
                '                       <!--<div class="label label-info" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}">Required value</div>-->' +
                '                   </div>' +
                '               </div>' +

                //SameAS
                '               <div class="quantifier">' +
                '                   <div>' +
                '                       <span>SameAS</span>' +
                '                   </div>' +
                '                   <div class="interfaceFieldsContainer"> ' +
                '                       <input data-bind="value: sameAs">' +
                '                       <!--<div class="label label-info" data-bind="text:nodeMessage, attr:{class: nodeMessageClass}">Required value</div>-->' +
                '                   </div>' +
                '               </div>' +

                '           </div>' +
                '           <div class="modal-footer">' +
                '               <div class="label label-danger" data-bind="ifnot: validated"> Form is not valid</div>' +
                '               <button type="button" class="btn btn-danger" data-dismiss="modal">Cancel</button>' +
                '               <button type="button" class="btn btn-primary" data-bind="click: $root.processCallback">Ok</button>' +
                '           </div>' +
                '       </div>' +
                '   </div>' +
                '</div>' +
                '</div>';

            $('head').append(entityTemplates);
            $('body').append(newDialogTemplate);
            $('body').append(newTitleDialogTemplate);
            $("#cwrcEntityModal").modal(params.modalOptions);
            $("#cwrcEntityModal").draggable({
                handle : ".modal-header"
            });
            $("#cwrcTitleModal").modal(params.modalOptions);
            $("#cwrcTitleModal").draggable({
                handle : ".modal-header"
            });

            $("#cwrcEntityModal").on('show.bs.modal', function () {
                $('.modal-body-area').css('max-height', $(window).height() * 0.7);
            });
            $("#cwrcTitleModal").on('show.bs.modal', function () {
                $('.modal-body-area').css('max-height', $(window).height() * 0.7);
            });

            ko.applyBindings(entity.viewModel, $("#newDialogue")[0]);
            ko.applyBindings(entity.viewModel, $("#newTitleDialogue")[0]);
        }

        var savingMessageOn = function () {
            entity.viewModel().showSavingMessage("Saving ");
            entity.viewModel().showSavingMessage.valueHasMutated();
            $("#showSavingIcon").addClass("fa fa-spin fa-refresh");
        }

        var savingMessageOff = function () {
            entity.viewModel().showSavingMessage("");
            entity.viewModel().showSavingMessage.valueHasMutated();
            $("#showSavingIcon").removeClass("fa fa-spin fa-refresh");
        }

        var initializeQuantifiers = function () {
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

        var completeTitleDialog = function (opts, data) {
            entity[dialogType].success = opts.success ? opts.success : function () {}; //typeof opts.success === undefined ? function(){} : opts.success;
            entity[dialogType].error = opts.error ? opts.error : function () {}; //typeof opts.error === undefined ? function(){} : opts.error;
            newTitleDialog(opts, data);
            setHelp();
        };

        var newTitleDialog = function (opts, data) {
            initializeQuantifiers();

            var modsFields = entity.viewModel().modsFields();
            if (data && data != null) {
                modsFields.modsType(data.modsType);
                modsFields.title(data.title);
                modsFields.date(data.date ? data.date : "");
                modsFields.project(data.project ? data.project : "");
                modsFields.sameAs(data.sameAs);
                modsFields.author([])

                if (data.author && data.author != null && data.author.length > 0) {
                    data.author.forEach(function (author) {
                        var a = modsFields.addNewAuthor();
                        a.name(author.name);
                    })
                } else {
                    modsFields.addNewAuthor();
                }
            } else {
                modsFields.modsType("");
                if (opts.startValue && opts.startValue.trim() !== "") {
                    modsFields.title(opts.startValue);
                } else {
                    modsFields.title("");
                }
                modsFields.author([]);
                modsFields.date("");
                modsFields.project("");
                modsFields.sameAs("");

                modsFields.addNewAuthor();
            }

            modsFields.validation.title(true);
            modsFields.validation.modsType(true);
            modsFields.validation.date(true);
        }

        var completeDialog = function (opts) {
            entity[dialogType].success = opts.success ? opts.success : function () {};
            entity[dialogType].error = opts.error ? opts.error : function () {};
            newDialog();
            setHelp();
        };

        // create the new dialog by reading the schema and building
        // the Inteface Model that underlies the rendered form interface
        var newDialog = function () {
            initializeQuantifiers();
            var interfaceOrder = $(entity['person'].schema).find('interface-order[type=' + dialogType + ']');
            entity.elementPath = $(interfaceOrder).attr('path').split('/');
            interfaceOrder.children('ref').each(function () {
                var defName = $(this).attr("name");
                $(entity[dialogType].schema).find('define[name=' + defName + ']')
                .children().each(function (i, child) {
                    visit(child);
                });
            });
            // var root = entity[dialogType].workingContainers.last();
            var root = entity[dialogType].workingContainers[0];
            root.interfaceFields.push(root.seed);
            entity.viewModel().interfaceFields(entity[dialogType].workingContainers[0]); // startingIterfaceField

        };

        // ////////////////////
        // ---------- Begin Schema reading and Interface Model building
        //
        // * for the model, capture the following from the RELAX-NG schema
        // * hierarchical info
        // * qualifiers (e.g. oneormore)
        // * custom annotation code added to the schema - see schema for details
        // ////////////////////
        var visit = function (node) {
            if (node.nodeType === 1) { // ELEMENT_NODE
                entity[dialogType].nodeStack.push(node);
                // working with node
                processNode(node);
                entity[dialogType].nodeStack.pop();
            }
        };

        var processNode = function (node) {
            var nodeName = node.nodeName.toLowerCase();
            var visitChildren = true;
            switch (nodeName) {
            case 'element':
                processElement(node);
                break;
                // case 'attribute':
                //  processAttribute(node);
                //  break;
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
                $(node).children().each(function (i, child) {
                    visit(child);
                });
            }
            // post process
            switch (nodeName) {
            case 'element':
                postprocessElement(node);
                break;
                // case 'attribute':
                //  postProcessAttribute(node);
                //  break;
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

        var processElement = function (node) {
            entity.elementPath.push($(node).attr('name'));
        };

        var postprocessElement = function (node) {
            entity.elementPath.pop();
        };

        // var processAttribute = function(node) {
        //  // entity.elementPath.push("@test");
        // };

        // var postProcessAttribute = function(node) {
        //  // entity.elementPath.pop();
        // };

        var processRef = function (node) {
            var defName = $(node).attr('name');
            var defNode = $(entity[dialogType].schema).find('define[name=' + defName + ']')[0];
            visit(defNode);
        };

        var isSamePath = function (currentPath) {
            // var workingPath = currentPath;
            // XXX TESTING
            var len = currentPath.length;
            if (currentPath[len - 1].indexOf('@') !== -1) {
                // workingPath.pop();
                len = len - 1;
            }
            if (len !== entity.elementPath.length) {
                return false;
            }
            for (var i = 0; i < len; ++i) {
                var orPaths = currentPath[i].split('|');
                var same = false;
                for (var j = 0; j < orPaths.length; ++j) {
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

        var setQuantifierLabel = function (label) {
            var lastContainer = last(entity[dialogType].workingContainers);
            lastContainer.label = label;
        };

        var addOptions = function (newInput, appInfo) {
            var type = dialogType,
            lang = params.lang;

            var values = $(appInfo).children('values[type=' + type + ']')[0];

            if (!values) {
                values = $(appInfo).children('values')[0];
            }

            if (values) {

                var valuesURL = $(values).attr('url');
                if (valuesURL) {
                    addRemoteOptions(newInput, valuesURL);
                }

                $(values).find('value').each(function (i, e) {
                    newInput.options.push({
                        'content' : $(e).attr(lang),
                        'value' : $(e).text()
                    });
                });
            }
        };

        var addRemoteOptions = function (newInput, url) {
            var lang = params.lang;
            $.ajax({
                url : url,
                async : false,
                dataType : "json"
            }).done(function (data) {
                $.each(data, function (i, option) {
                    newInput.options.push({
                        'content' : option['content'][lang],
                        'value' : option['value']
                    });
                });
            });
        };

        // process the annotations added to the RELAX-NG schema
        // within the <xs:annotation> elements
        var processXSAnnotation = function (node) {
            // ADD WIDGET HERE
            var appInfoNode = $(node).children("xs\\:appinfo");
            // check all children for path XXX
            var isStartValue = "";
            var leftPadding = "";
            $(appInfoNode).children("interface-field").each(function (i, e) {
                var currentPath = $(e).attr('path').split('/');
                isStartValue = $(e).attr('startValue');
                leftPadding = $(e).attr("leftPadding");
                if (isSamePath(currentPath)) {
                    // if same path XXX
                    // check what widget to add XXX
                    var newInput;
                    var inputType = "";
                    if ($(e).children('input').first().text() !== '') {
                        inputType = $(e).children('input').first().text();
                    }
                    switch (inputType) {
                    case "textField":
                        newInput = textInputModel();
                        break;
                    case "readonlyTextField":
                        newInput = readonlyTextInputModel();
                        break;
                    case "textArea":
                        newInput = textAreaModel();
                        break;
                    case "radioButton":
                        newInput = radioButtonModel();
                        //XXX Get Options
                        addOptions(newInput, appInfoNode);
                        // new entry
                        newInput.defaultValue = true;
                        newInput.value(newInput.options[0].value);
                        break;
                    case "dynamicCheckbox":
                        newInput = dynamicCheckboxModel();
                        //XXX Get Options
                        addOptions(newInput, appInfoNode);
                        break;
                    case "dropDown":
                    case "slider": //XXX Implement
                    case "combobox": //XXX Implement
                        newInput = dropDownModel();
                        addOptions(newInput, appInfoNode);
                        break;
                    case "dialogue":
                        newInput = dialogueInputModel();
                        break;
                    case "datePicker":
                        newInput = datePickerInputModel();
                        break;
                    case "header":
                        newInput = headerInputModel();
                        break;
                        // var lastContainer = last(entity[dialogType].workingContainers);
                        // var header = $(e).children('label').first().text();
                        // lastContainer.header = header;
                        // alert(header);

                        break;
                    case "": // Label
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
                        newInput.fieldCSSClass = (entity.elementPath.toString()).replace(/,/g, '_');
                        newInput.label = $(e).children('label').first().text();
                        newInput.help = $(e).children('help-text').first().text();
                        var lastContainer = last(entity[dialogType].workingContainers);

                        if (lastContainer.isRequired()) {
                            newInput.nodeMessage("Required value");
                        }

                        if (isStartValue === "true") {
                            entity.startValuePath = currentPath.map(function (p) {
                                    return {
                                        name : p,
                                        count : 1
                                    };
                                });
                        }

                        if (leftPadding && leftPadding.trim() !== "") {
                            entity.currentPadding = leftPadding;
                        }
                        // console.log(entity.currentPadding)
                        // XXX in progress
                        // newInput.fieldPadding("0px 0px 0px "+entity.currentPadding+"px")

                        lastContainer.seed.interfaceFields.push(newInput);

                    }
                }
            });
        };

        var processQuantifier = function (node) {

            var newQuantifier;
            var nodeName = node.nodeName.toLowerCase();
            switch (nodeName) {
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
            newQuantifier.fieldCSSClass = (newQuantifier.path).replace(/,/g, '_');

            ///////////////

            // add to latestWorking quantifier
            last(entity[dialogType].workingContainers).seed.interfaceFields.push(newQuantifier);
            // add to quantifier list
            entity[dialogType].workingContainers.push(newQuantifier);
        };

        var isInterfaceIsPresent = function (item) {
            switch (item.input) {
            case 'textField':
            case 'readonlyTextField':
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

        var postprocessInterleave = function (node) {
            var lastContainer = last(entity[dialogType].workingContainers);

            if (lastContainer.seed.interfaceFields().length >= 1) {
                lastContainer.hasInterface = true;
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

        var postprocessQuantifier = function (node) {
            var lastContainer = last(entity[dialogType].workingContainers);

            $.each(lastContainer.seed.interfaceFields(), function (index, item) {

                if (isInterfaceIsPresent(item)) {
                    lastContainer.hasInterface = true;
                }
            });

            if (lastContainer.hasInterface) {

                lastContainer.label = lastContainer.seed.interfaceFields()[0].label;
                lastContainer.seed.interfaceFields()[0].label = "";

                if (lastContainer.minItems === 1) {
                    // lastContainer.interfaceFields.push(lastContainer.seed.clone());
                    lastContainer.addGroup();
                }
                entity[dialogType].workingContainers.pop();
            } else {
                entity[dialogType].workingContainers.pop();
                var parent = last(entity[dialogType].workingContainers);
                moveInterfaceElements(lastContainer, parent);
            }
        };

        var moveInterfaceElements = function (from, to) {
            $.each(from.seed.interfaceFields(), function (index, item) {
                // if (item.hasInterface) {

                to.seed.interfaceFields.push(item);

            });

            // XXX Needed ?
            if (to.label === "") {
                to.label = from.label;
            }
            // alert(to.path + " + " + from.path)
            // to.path = from.path
            to.seed.interfaceFields.remove(from);
        };

        // ////////////////////
        // ---------- End -- Schema reading and Interface Model building
        // ////////////////////


        ///////////////////////////////////////////////////////////////////////
        // Validate and serialize interface model as XML
        ///////////////////////////////////////////////////////////////////////

        // recursively traverse the interface model
        // use the parentNodePath of the interface node
        var visitStringifyResult = function (node, nodeIndex, parentInterfacePathStack) {
            if (node.input === "quantifier") {
                var minItems = node.minItems;
                var maxItems = node.maxItems;

                entity[dialogType].shouldValidate.push(node.isRequired());

                if (parentInterfacePathStack) {
                    parentInterfacePathStack.push({
                        path : node.path,
                        index : nodeIndex
                    });
                }

                $.each(node.interfaceFields(), function (index, node) {
                    //                    if (index > 0)
                    //                    {
                    //                        console.log("sTTT...  : index="+index+ " : " );
                    //                    }
                    visitStringifyResult(node, index, parentInterfacePathStack);
                });

                if (
                    parentInterfacePathStack
                     &&
                    parentInterfacePathStack.length > 0) {
                    parentInterfacePathStack.pop();
                }

                entity[dialogType].shouldValidate.pop();
            } else if (node.input === "seed") {
                $.each(node.interfaceFields(), function (index, node) {
                    visitStringifyResult(node, nodeIndex, parentInterfacePathStack);
                });
            } else if (node.input !== "dialogue" && node.input !== "label" && node.input !== "header") {
                // CREATE XML NODE

                var validate = last(entity[dialogType].shouldValidate);
                if (validate && $.trim(node.value()) === "") {

                    node.nodeMessageClass("label label-danger");
                    entity.viewModel().validated(false);
                } else {

                    node.nodeMessageClass("label label-info");
                }
                parentInterfacePathStack.push({
                    path : node.path,
                    index : nodeIndex
                });
                createNode(node, nodeIndex, parentInterfacePathStack);
                parentInterfacePathStack.pop();
            }
        };

        // add a Node to the DOM datastructure used to build the XML
        // that will be serialized
        // use XML selectors to determine the proper tree branch to place
        // the node
        var createNode = function (node, nodeIndex, parentInterfacePathStack) {
            var selector = null;
            var previous_selector = null;

            // build selector for the "text" node to add to the XML result
            // also build the XML structural elements, if needed
            var tmpSelectorStr = "";
            var tmpPathStr = "";
            for (var i = 0; i < parentInterfacePathStack.length; i++) {
                tmpPathStr = parentInterfacePathStack[i].path;

                // break apart the path at each level in the stack,
                // test that element exists in the XML result,
                // add element, if necessary
                // Stack content at each level may look like
                // 'entity,person,identiy'
                // ToDo: niave implementation - optimize, if necessary
                if (tmpPathStr) {
                    // chop off first part of the path string because already
                    // represented within selector
                    // include ','
                    if (i > 0) {
                        tmpPathStr = tmpPathStr.replace(parentInterfacePathStack[i - 1].path, '');
                        tmpPathStr = tmpPathStr.replace(/^,/, '');
                    }

                    var tmpPathStrArray = tmpPathStr.split(',');

                    if (node.attributeName !== "" && i == parentInterfacePathStack.length - 1) {
                        // if attribute, remove the last node from the path
                        // from the last path on the stack
                        tmpPathStrArray.pop();
                    }

                    for (var j = 0; j < tmpPathStrArray.length; j++) {
                        // convert path to JavaScript XML selector syntax
                        tmpSelectorStr = tmpPathStrArray[j];

                        if (!tmpSelectorStr) {
                            // path repeated, skip
                            continue;
                        }

                        // add predicate index if last item in the path
                        if (j == tmpPathStrArray.length - 1) { {
                                tmpSelectorStr
                                     = tmpSelectorStr
                                     + ":eq("
                                     + parentInterfacePathStack[i].index
                                     + ")";
                            }
                        }

                        if (selector && tmpSelectorStr) {
                            previous_selector = selector;
                            selector
                                 = selector
                                 + " > "
                                 + tmpSelectorStr;
                        } else if (tmpSelectorStr) {
                            selector = tmpSelectorStr;
                        } else {
                            selector = "";
                        }

                        // use tmp selector and add on subsequent paths
                        addXMLNodeIfMissing(selector, previous_selector, tmpPathStrArray[j]);
                    }
                }
            }

            // set XML destination node value
            if (node.attributeName !== "") {
                // set attribute value
                $(entity.selfWorking).find(selector).last().attr(node.attributeName, node.value());
            } else {
                // set text value
                var newText = entity.selfWorking.createTextNode(node.value());
                $(entity.selfWorking).find(selector).last().append(newText);
            }

        };

        // add the XML node to the datastructure
        // if "selector" is missing then add "nodeName" at "previous_selector"
        var addXMLNodeIfMissing = function (selector, previous_selector, nodeName) {
            target = $(entity.selfWorking).find(selector);
            if (nodeName && target && target.size() === 0) {
                newElement = entity.selfWorking.createElement(nodeName);
                $(entity.selfWorking).find(previous_selector).last().append(newElement);
            } else if (!nodeName) {
                console.log(
                    "cN... 8 : Node added without Name [" +
                    $(entity.selfWorking).find(previous_selector).last().nodeName
                     + " ]");
            }
        }

        ///////////////////////////////////////////////////////////////////////
        // -- BEGIN -- Mods handling
        ///////////////////////////////////////////////////////////////////////

        var validateModsInfo = function (xml) {
            var modsFields = entity.viewModel().modsFields();

            if (modsFields.title().trim().length < 1) {
                modsFields.validation.title(false);
                entity.viewModel().validated(false);
            } else {
                modsFields.validation.title(true);
            }

            if (modsFields.modsType().trim().length < 1) {
                modsFields.validation.modsType(false);
                entity.viewModel().validated(false);
            } else {
                modsFields.validation.modsType(true);
            }

            var testDate = modsFields.date().trim();
            var rx = /^\d{1,4}(-(0[1-9]|1[012])(-(0[1-9]|[12][0-9]|3[01]))?)?$/; //Tests that the date can be eirther YYYY, YYYY-MM, or YYYY-MM-DD
            if (testDate.length > 0 && !rx.test(testDate)) {
                modsFields.validation.date(false);
                entity.viewModel().validated(false);
            } else {
                modsFields.validation.date(true);
            }
            modsFields.date(testDate);
        };

        var addModsInfo = function (xml) {
            var accessConditionText = 'Use of this public-domain resource is governed by the <a href="http://creativecommons.org/licenses/by-nc/4.0/" rel="license">Attribution-NonCommercial 4.0 International License</a>.';
            var mods = $(xml).find("mods");
            var modsFields = entity.viewModel().modsFields();

            // Create the title element
            var titleInfo = entity.selfWorking.createElement("titleInfo");
            var title = entity.selfWorking.createElement("title");
            title.appendChild(entity.selfWorking.createTextNode(modsFields.title()));
            $(titleInfo).append(title);
            mods.append(titleInfo);

            // Create the author names
            modsFields.author().forEach(function (author) {
                if (author.name().trim().length > 0) {
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

            // Create sameAs element
            var sameAsXML = entity.selfWorking.createElement("identifier");
            sameAsXML.setAttribute("type", "uri");
            sameAsXML.appendChild(entity.selfWorking.createTextNode(modsFields.sameAs()));
            mods.append(sameAsXML);




            // create origin info or related item info
            if (modsFields.date().trim().length > 0) {
                var relatedItem = entity.selfWorking.createElement("relatedItem");
                var originInfo = entity.selfWorking.createElement("originInfo");

                var dateIssued = entity.selfWorking.createElement("dateIssued");
                dateIssued.setAttribute("encoding", "w3cdtf");
                dateIssued.setAttribute("keyDate", "yes");
                dateIssued.appendChild(entity.selfWorking.createTextNode(modsFields.date()));
                $(originInfo).append(dateIssued);

                switch (modsFields.modsType()) {
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
            $(accessCondition).html(accessConditionText);

            mods.append(accessCondition);

            // create record info
            var now = new Date();
            var recordInfo = entity.selfWorking.createElement("recordInfo");

            if (modsFields.project().trim().length > 0) {
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
        // ////////////////////
        // --End-- Validate and serialize interface model as XML
        // ////////////////////


        ///////////////////////////////////////////////////////////////////////
        // -- BEGIN -- Mods handling
        ///////////////////////////////////////////////////////////////////////

        // build a skeletal recordInfo branch of the resulting XML.
        var addRecordInfo = function (xml) {
            var accessConditionText = 'Use of this public-domain resource is governed by the <a href="http://creativecommons.org/licenses/by-nc/4.0/" rel="license">Attribution-NonCommercial 4.0 International License</a>.';

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

            $(accessCondition).html(accessConditionText);
            $(xml).find(selector).append(accessCondition);
            // $(accessCondition).append(newText);

            $(xml).find(selector).append(originInfo);
            selector = "entity > " + dialogType + " > recordInfo > originInfo";
            var todayText = entity.viewModel().paddedToday();
            var creationText = "";
            // XXX Change when editing
            if (!entity.editing) {
                creationText = todayText;
                $(recordCreationDate).append(creationText);
                $(xml).find(selector).append(recordCreationDate);
            }

            $(recordChangeDate).append(todayText);
            $(xml).find(selector).append(recordChangeDate);

        };

        // build a skeletal entity XML to start
        var getWorkingXML = function () {
            var startingXML = '<?xml version="1.0" encoding="UTF-8"?>';

            switch (dialogType) {
            case 'person':
            case 'organization':
            case 'place':
                startingXML += '<?xml-model href="http://cwrc.ca/schemas/entities.rng" type="application/xml" schematypens="http://relaxng.org/ns/structure/1.0"?>';
                break;
            case 'title':
                startingXML += '<mods xmlns="http://www.loc.gov/mods/v3" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.loc.gov/mods/v3 http://www.loc.gov/standards/mods/mods.xsd">';
                break;
            }

            var result = null;

            if (dialogType == 'title') {
                entity.selfWorking = $.parseXML(startingXML + "</mods>");
                validateModsInfo();
                addModsInfo(entity.selfWorking);

                var result = xmlToString(entity.selfWorking);

                result = result.replace(/xmlns=""/g, "");
            } else {
                entity.selfWorking = $.parseXML(startingXML + '<entity></entity>');
                addRecordInfo(entity.selfWorking);
                visitStringifyResult(entity[dialogType].workingContainers[0], 0, []);
                var result = xmlToString(entity.selfWorking);
            }

            return result;
        };

        // Saving action for an EDIT or NEW entity dialog
        // serialize XML
        entity.viewModel().processCallback = function () {
            savingMessageOn();
            setTimeout((function () {
                    entity.viewModel().validated(true);
                    var xml = getWorkingXML();
                    // console.log(xml);
                    if (entity.viewModel().validated()) {
                        var response;
                        if (entity.editing) {
                            response = cwrcApi[dialogType].modifyEntity(entity.editingPID, xml);
                        } else {
                            response = cwrcApi[dialogType].newEntity(xml);
                        }
                        // response includes: pid{from API} and URI
                        response.uri = repositoryBaseObjectURL + response.pid;
                        var result = {
                            response : response,
                            data : xml
                        };

                        entity[dialogType].success(result);

                        if (dialogType === 'title') {
                            $('#cwrcTitleModal').modal('hide');
                        } else {
                            $('#cwrcEntityModal').modal('hide');
                        }
                    } else {
                        entity[dialogType].error("Form not valid");
                    }
                    savingMessageOff();
                }), 200);

        };

        var xmlToString = function (xmlData) {
            var xmlString;
            if (window.ActiveXObject) { // IE
                xmlString = xmlData.xml;
            } else { // code for Mozilla, Firefox, Opera, etc.
                xmlString = (new XMLSerializer()).serializeToString(xmlData);
            }
            return xmlString;
        };

        // models

        entity.viewModel().displayMode = function (field) {
            return field.input;
        };

        /*
        entity.viewModel().today = function() {
        var date = new Date();
        return date.getFullYear() +"-"+ date.getMonth() + "-" + date.getDay();
        };
         */
        entity.viewModel().paddedToday = function () {
            var date = new Date();
            var pad = "00";
            var month = "" + (date.getMonth() + 1);
            var day = "" + date.getDate();
            month = pad.substring(0, pad.length - month.length) + month;
            day = pad.substring(0, pad.length - day.length) + day;
            return date.getFullYear() + "-" + month + "-" + day;
        };

        ///////////////////////////////////////////////////////////////////////
        // Entity models
        ///////////////////////////////////////////////////////////////////////

        var quantifierModel = function () {
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
            that.fieldPadding = ko.observable("0px 0px 0px 0px");
            that.fieldCSSClass = "initial";
            // 1 1 Interleave
            // 0 1 Optional
            // 1 INF One or more
            // 0 INF Zero or more
            that.isGrowable = function () {
                if (that.minItems === 1 && that.maxItems === 1) {
                    return false;
                }
                return true;
            };

            that.showAddButton = function () {
                if (that.interfaceFields().length < that.maxItems) {
                    return true;
                }
                return false;
            };

            that.showDelButton = function () {
                if (that.interfaceFields().length > that.minItems) {
                    return true;
                }
                return false;
            };

            that.showRemoveThisButton = function () {
                if (that.interfaceFields().length > that.minItems) {
                    return true;
                }
                return false;
            };

            that.addGroup = function () {
                if (that.interfaceFields().length < that.maxItems) {
                    // that.interfaceFields.push(that.seed.clone());    //XXX SEED
                    var newClone = that.seed.clone();

                    newClone.interfaceFields()[0].label = "";
                    that.interfaceFields.push(newClone);
                    setHelp();
                }
            };

            that.delGroup = function () {
                if (that.interfaceFields().length > that.minItems) {
                    that.interfaceFields.pop();
                }
            };

            that.removeThisGroup = function (group) {
                if (that.interfaceFields().length > that.minItems) {
                    that.interfaceFields.remove(group);
                }
            };

            that.isInterleave = function () {
                if (that.minItems === 1 && that.maxItems === 1) {
                    return true;
                }
                return false;
            };

            that.isOptional = function () {
                if (that.minItems === 0 && that.maxItems === 1) {
                    return true;
                }
                return false;
            };

            that.isOneOrMore = function () {
                if (that.minItems === 1 && that.maxItems === Number.MAX_VALUE) {
                    return true;
                }
                return false;
            };

            that.isZeroOrMore = function () {
                if (that.minItems === 0 && that.maxItems === Number.MAX_VALUE) {
                    return true;
                }
                return false;
            };

            that.isRequired = function () {
                return that.isOneOrMore() || that.isInterleave();
            };

            that.clone = function () {
                var result = quantifierModel();
                result.minItems = this.minItems;
                result.maxItems = this.maxItems;
                result.seed = this.seed.clone();
                result.path = this.path;
                result.label = this.label;
                result.header = this.header;
                result.fieldPadding = ko.observable(this.fieldPadding);
                result.fieldCSSClass = this.fieldCSSClass;
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

        var interleaveModel = function () {
            var that = quantifierModel();
            that.minItems = 1;
            that.maxItems = 1;
            return that;
        };

        var optionalModel = function () {
            var that = quantifierModel();
            that.minItems = 0;
            that.maxItems = 1;
            return that;
        };

        var zeroOrMoreModel = function () {
            var that = quantifierModel();
            that.minItems = 0;
            that.maxItems = Number.MAX_VALUE;
            return that;
        };

        var oneOrMoreModel = function () {
            var that = quantifierModel();
            that.minItems = 1;
            that.maxItems = Number.MAX_VALUE;
            return that;
        };

        var seedModel = function () {
            var that = {};
            that.input = "seed";
            that.interfaceFields = ko.observableArray();
            that.clone = function () {
                var result = seedModel();
                $.each(that.interfaceFields(), function (index, field) {
                    result.interfaceFields.push(field.clone());
                });

                return result;
            };
            return that;
        };

        var inputModel = function () {
            var that = {};
            that.input = "";
            that.path = "";
            that.fieldCSSClass = "initial";
            that.label = "";
            that.help = "";
            that.attributeName = "";
            that.value = ko.observable("");
            that.defaultValue = false;
            that.constructor = inputModel;
            that.nodeMessage = ko.observable("");
            that.nodeMessageClass = ko.observable("label label-info");
            that.options = [];
            that.isSet = false;
            that.fieldPadding = ko.observable("0px 0px 0px 0px")
                that.clone = function () {
                var result = that.constructor();
                result.label = that.label;
                result.path = that.path;
                result.fieldCSSClass = that.fieldCSSClass;
                result.help = that.help;
                result.attributeName = that.attributeName;
                result.options = that.options;
                result.defaultValue = that.defaultValue;
                result.nodeMessage = ko.observable(that.nodeMessage());
                result.nodeMessageClass = ko.observable(that.nodeMessageClass());
                result.isSet = that.isSet;
                result.fieldPadding = ko.observable(that.fieldPadding());
                if (result.defaultValue) {
                    result.value(that.value());
                }
                return result;
            };
            return that;
        };

        var textInputModel = function () {
            var that = inputModel();
            that.input = "textField";
            that.constructor = textInputModel;
            that.value = ko.observable();
            return that;
        };

        var readonlyTextInputModel = function () {
            var that = inputModel();
            that.input = "readonlyTextField";
            that.constructor = readonlyTextInputModel;
            that.value = ko.observable();
            return that;
        };

        var datePickerInputModel = function () {
            var that = inputModel();
            that.input = "datePicker";
            that.constructor = datePickerInputModel;
            return that;
        };

        var headerInputModel = function () {
            var that = inputModel();
            that.input = "header";
            that.constructor = headerInputModel;
            return that;
        }

        var dialogueInputModel = function () {
            var that = inputModel();
            that.input = "dialogue";
            that.constructor = dialogueInputModel;
            return that;
        };

        var textAreaModel = function () {
            var that = inputModel();
            that.input = "textArea";
            that.constructor = textAreaModel;
            return that;
        };

        var radioButtonModel = function () {
            var that = inputModel();
            that.input = "radioButton";
            that.constructor = radioButtonModel;
            return that;
        };

        var dynamicCheckboxModel = function () {
            var that = inputModel();
            that.input = "dynamicCheckbox";
            that.value = ko.observableArray();
            that.constructor = dynamicCheckboxModel;
            return that;
        };

        var dropDownModel = function () {
            var that = inputModel();
            that.input = "dropDown";
            that.constructor = dropDownModel;
            return that;
        };

        ///////////////////////////////////////////////////////////////////////
        // cD entity interface
        ///////////////////////////////////////////////////////////////////////

        var initializeWithCookie = function (name) {
            cwrcApi.initializeWithCookie(name);
        };

        cD.initializeWithCookie = initializeWithCookie;

        var initializeWithLogin = function (username, password) {
            cwrcApi.initializeWithLogin(username, password);
        };

        cD.initializeWithLogin = initializeWithLogin;

        var initializeWithCookieData = function (data) {
            cwrcApi.initializeWithCookieData(data);
        }

        cD.initializeWithCookieData = initializeWithCookieData;

        // population functions
        var populateDialog = function (opts) {
            switch (opts.repository) {
            case "cwrc":
                populateCWRC(opts);
                break;
            }
        }

        // read in input XML entity and add to the interface model
        var populateCWRC = function (opts) {
            // cwrc

            var workingXML = null;
            if (typeof(opts.data)=='string')
            {
                // if string parse into JQuery DOM
                workingXML = $.parseXML(opts.data);
            }
            else 
            {
                // else assume AJAX load has completed parse
                // on a 'text/xml' mime type
                workingXML = opts.data;
            }
            var path = [];

            visitChildrenPopulate(workingXML.childNodes, path);
        }

        // recursively traverse the XML DOM tree via a depth first search
        // if locate a text node or and attribute node
        // then add it to the interface model so that it will
        // appear in the rendered form
        // keep a stack representing the path traversal of the XML tree
        var visitChildrenPopulate = function (children, path) {

            var hasSibling = false;

            for (var i = 0; children && i < children.length; ++i) {

                // if an empty "#text" node, skip
                if (children[i].nodeName === "#text" && children[i].nodeType == 3 && ($.trim(children[i].nodeValue)) === "") {
                    continue;
                }

                // check if top of the stack has the same element
                // as the last element name in the XML node
                // if so, don't increment the count on the last element
                // name in the path, otherwise create item add it to the
                // stack
                if (path.length > 0 && children[i].nodeName == last(path).name) {
                    last(path).count++;
                } else {
                    path.push({
                        name : children[i].nodeName,
                        count : 1
                    });
                }

                //console.log("vC.... "  + last(path).count + ":" + last(path).name );

                visitNodeCWRCPopulate(children[i], path);

                // check if any of the sibiling nodes have the same path
                // if so, don't pop the last element name off the stack
                // element nodes may be interleaved with "text" nodes
                hasSibling = false;
                lastPathName = last(path).name;
                for (var j = i + 1; children[j] && j < children.length; j++) {
                    tmpNode = children[j];
                    if (tmpNode && tmpNode.nodeName == lastPathName && tmpNode.nodeType == 1) {
                        hasSibling = true;
                        break;
                    }
                }
                if (
                    (
                        path.length > 0
                         &&
                        i < children.length - 1
                        //&& children[i+1].nodeName != last(path).name
                         && !hasSibling)
                     ||
                    i === children.length - 1) {
                    path.pop();
                }

            }
        }

        // recursively traversal depending on type of node
        // if textnode or attribute then add to the interface model
        var visitNodeCWRCPopulate = function (node, path) {

            // recursively handle the child nodes
            if (node.childNodes && node.childNodes.length > 0) {
                visitChildrenPopulate(node.childNodes, path);
            }
            // special handling of an attribute
            if (node.attributes && node.attributes.length > 0) {
                visitChildrenPopulate(node.attributes, path);
            }

            var parentPath = path.slice(0, path.length - 1);
            var nodeValue = $.trim(node.nodeValue);
            if (node.nodeType === 3 && nodeValue !== "") {
                foundAndFilled(nodeValue, parentPath, entity.viewModel().interfaceFields());
            } else if (node.nodeType === 2 && nodeValue !== "") {
                // firefox does not represent an attribute value as a text node
                // ToDo prevent on other browsers the attribute values
                // from being added twice
                foundAndFilled(nodeValue, path, entity.viewModel().interfaceFields());
            }
        }

        var foundOnSeed = function (field, parentPath) {
            var result = false;
            var pathNames = parentPath.map(function (p) {
                    return p.name;
                });
            $.each(field.seed.interfaceFields(), function (i, currentField) {
                if (pathNames.toString().indexOf(currentField.path) === 0) {
                    result = true;
                    return false;
                }
            });
            return result;
        }

        var lastCount = 0;

        // add the textnode or attribute value to the
        // interface model so it is rendered on the form interface
        // careful to track instances where there could be multiple
        // "variant" names requiring the use of an XPath expression
        // with predicate indicating which of the multiple siblings
        // at a given level to use when indicating which branch
        // a text node needs to be added
        var foundAndFilled = function (nodeValue, parentPath, field) {

            var pathNames = parentPath.map(function (p) {
                    return p.name;
                });

            if (field.input === "quantifier") {
                // check path if sub continue

                if (pathNames.toString().indexOf(field.path) === 0) {

                    // compare xPath with predicates from the source XML
                    // with the path in the interface model
                    // if the predicate at one level of the XPath
                    // is >1 then make sure the correct path in the
                    // interface model is followed (or created & followed)
                    var tmpInterfaceNodeArray = field.path.split(",");
                    var tmpSrcNodeArray = parentPath;
                    var indexLastMatch = tmpInterfaceNodeArray.length - 1;
                    var indexNextNode = indexLastMatch + 1;

                    if (
                        tmpSrcNodeArray.length > indexNextNode
                         &&
                        (
                            tmpSrcNodeArray[indexNextNode].count > field.interfaceFields().length
                             ||
                            field.interfaceFields().length == 0)) {
                        // interface node doesn't exist
                        // therefore: add and follow node
                        // nod eis added to the end of the array therefore use last
                        if (foundOnSeed(field, parentPath)) {
                            // test is the 'seed' variable contains a
                            // template for the next level of interface elements
                            field.addGroup();
                            var lastfield = last(field.interfaceFields());
                            return foundAndFilled(nodeValue, parentPath, lastfield);
                        }
                    } else if
                    (
                        field.interfaceFields()
                         &&
                        tmpSrcNodeArray.length > indexNextNode
                         &&
                        tmpSrcNodeArray[indexNextNode].count <= field.interfaceFields().length) {
                        // node exists - pick correct child and follow
                        var tmpfield = field.interfaceFields()[tmpSrcNodeArray[indexNextNode].count - 1];
                        return foundAndFilled(nodeValue, parentPath, tmpfield);
                    }
                }
            } else if (field.input === "seed") {
                var foundOnSeedCheck = false;
                var currentCount = 0;
                $.each(field.interfaceFields(), function (i, currentField) {
                    if (foundAndFilled(nodeValue, parentPath, currentField)) {
                        // currentCount += 1;
                        // if (currentCount == lastCount){
                        foundOnSeedCheck = true;
                        return false; // break out of loop
                        // }
                    }
                });

                if (foundOnSeedCheck) {
                    return true;
                }

            } else if (field.input !== "header") {
                // set value
                if (field.path == pathNames) {

                    if (!field.isSet) {
                        field.isSet = true;
                        if (field.input == "radioButton" || field.input == "dynamicCheckbox") {
                            field.value(nodeValue.split(","));
                        } else {
                            field.value(nodeValue);
                        }
                    } else if (field.isSet) {
                        return false;
                    }
                    return true;
                }
            }
        }

        var extractTitleMODS = function (opts) {
            var mods = $(opts.data);
            var modsFields = entity.viewModel().modsFields();
            var element = null;
            var result = {
                author : []
            };

            // Create the title element
            element = mods.find("titleInfo>title");
            result.title = element.text();

            // Create the author names
            mods.find("name>namePart").each(function () {
                result.author.push({
                    name : $(this).text()
                });
            });

            // Create genre element
            var genre = mods.find("genre").text();
            result.modsType = genre;

            // create origin info or related item info
            switch (genre) {
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
            if (element.length > 0) {
                result.date = element.text();
            }

            element = mods.find("recordInfo > recordContentSource");
            if (element.length > 0) {
                result.project = element.text();
            }

            return result;
        }

        var addStartValue = function (value, path) {
            // clear ors |
            for (var i = 0; i < path.length; ++i) {
                if (path[i].name.indexOf("|") != -1) {
                    path[i].name = dialogType;
                }
            }

            foundAndFilled(value, path, entity.viewModel().interfaceFields());
        }

        ///////////////////////////////////////////////////////////////////////
        // Creation Pop-Up Dialogs - starting point
        ///////////////////////////////////////////////////////////////////////
        var popCreateEntity = function (opts) {
            if (!opts.editing) {
                entity.editing = false;
                entity.editingPID = "";
            }
            completeDialog(opts);
            // set default value

            if (opts.startValue && opts.startValue.trim() != "") {
                addStartValue(opts.startValue, entity.startValuePath);
            }
            $('#cwrcEntityModal').modal('show');
            // hackish
            setTimeout(function () {
                $(".modal-body-area").scrollTop(0);
            }, 5);
        }

        // Render Person Dialog
        var popRenderPerson = function (opts) {
            dialogType = "person";
            entity.viewModel().dialogTitle(entity.editing ? "Edit: " + opts.name : "Add Person");
            popCreateEntity(opts);
        }

        var popCreatePerson = function (opts) {
            entity.init();
            popRenderPerson(opts);
        };

        cD.popCreatePerson = popCreatePerson;



        // Render Organization Dialog
        var popRenderOrganization = function (opts) {
            dialogType = "organization";
            entity.viewModel().dialogTitle(entity.editing ? "Edit: " + opts.name : "Add Organization");
            popCreateEntity(opts);
        }

        var popCreateOrganization = function (opts) {
            entity.init();
            popRenderOrganization(opts);
        };

        cD.popCreateOrganization = popCreateOrganization;

        // Render Place Dialog
        var popRenderPlace = function (opts) {
            dialogType = "place";
            entity.viewModel().dialogTitle(entity.editing ? "Edit: " + opts.name : "Add Place");
            popCreateEntity(opts);
        };

        var popCreatePlace = function (opts) {
            entity.init();
            popRenderPlace(opts);
        }

        cD.popCreatePlace = popCreatePlace;

        // Render Title Dialog
        var popRenderTitle = function (opts, data) {
            dialogType = "title";
            if (!opts.editing) {
                entity.editing = false;
                entity.editingPID = "";
            }
            entity.viewModel().dialogTitle(entity.editing ? "Edit: " + data.title : "Add Title");
            completeTitleDialog(opts, data);
            $('#cwrcTitleModal').modal('show');
            // hackish
            setTimeout(function () {
                $(".modal-body-area").scrollTop(0);
            }, 5);

        };

        var popCreateTitle = function (opts) {
            entity.init();
            popRenderTitle(opts);
        }

        cD.popCreateTitle = popCreateTitle;

        //
        var popCreate = {
            person : popCreatePerson,
            organization : popCreateOrganization,
            place : popCreatePlace,
            title : popCreateTitle
        };

        cD.popCreate = popCreate;

        ///////////////////////////////////////////////////////////////////////
        // Edit Pop-Up Dialogs - starting point
        ///////////////////////////////////////////////////////////////////////
        var prepareEditingDialog = function (opts) {
            entity.editing = true;
            entity.editingPID = opts.id;
            opts.editing = entity.editing;
        }

        var popEditPerson = function (opts) {
            prepareEditingDialog(opts);
            popRenderPerson(opts);
            populateDialog(opts);
        };

        cD.popEditPerson = popEditPerson;

        var popEditOrganization = function (opts) {
            prepareEditingDialog(opts);
            popRenderOrganization(opts);
            populateDialog(opts);
        };

        cD.popEditOrganization = popEditOrganization;

        var popEditPlace = function (opts) {
            prepareEditingDialog(opts);
            popRenderPlace(opts);
            populateDialog(opts);
        }

        cD.popEditPlace = popEditPlace;

        var popEditTitle = function (opts) {
            // 2015-02-04 :
            // Editing disabled
            // Edit of Title entities looses
            // information from MODS records that are
            // more extensive than what implemented in these
            // dialogs - i.e. pre-existing MODS records

            window.alert("Edit not implemented for Title entities");
            //prepareEditingDialog(opts);
            //cD.popCreateTitle(opts, extractTitleMODS(opts));
            //cD.popRenderTitle(opts, extractTitleMODS(opts));
        }

        cD.popEditTitle = popEditTitle;

        cD.popEdit = {
            person : popEditPerson,
            organization : popEditOrganization,
            place : popEditPlace,
            title : popEditTitle
        }

        ///////////////////////////////////////////////////////////////////////
        // Search Dialog - build, render, and populate with results
        ///////////////////////////////////////////////////////////////////////

        var search = {};
        search.buttons = ko.observableArray([]);
        // search.infoTitle = ko.observable("");
        search.dialogTitle = ko.observable("");

        search.getLinkedDataSource = function (specs) {

            var that = {
                results : ko.observableArray([]),
                ajaxRequest : null,
                name : specs.name === null ? "" : specs.name,
                processSearch : specs.processSearch === null ? function (queryString) {}

                 : specs.processSearch,
                // scrape : specs.scrape,
                htmlify : specs.htmlify,
                datatype : specs.datatype,
                showPanel : ko.observable(true),
                page : ko.observable(0),
                paginate : specs.paginate === null ? function (e) {}

                 : function (scope, event) {
                    var page = parseInt($(event.currentTarget).attr("data"));

                    if (page <= that.maxPage() && page >= 0) {
                        search.isDataSelected(false);
                        specs.paginate(page, that);
                    }
                },
                maxPage : ko.observable(0),
                showPaginate : ko.observable(specs.paginate != null),
                paginateNumber : function (index) {
                    // pagination window 
                    // 5 pages in the window before sliding to 6,7...
                    if (that.page() < 3) {
                        return index;
                    } else if (that.page() >= 3 && that.page() <= 4) {
                        // prevent negative page numbers
                        return index;
                    } else if (that.page() >= (that.maxPage() - 3)) {
                        return index + that.maxPage() - 5;
                    }

                    return index - 2 + that.page();
                }
            }

            return that;
        }

        search.processCWRCSearch = function (queryString, page) {
            var perPage = 100;
            search.linkedDataSources.cwrc.page(page);

            $(".linkedDataMessage").text("");
            $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
            $("#CWRCDataMessage").addClass("fa fa-spin fa-refresh");
            search.processData = cwrcApi[dialogType].getEntity;
            search.linkedDataSources.cwrc.ajaxRequest = cwrcApi[dialogType].searchEntity({
                    limit : perPage,
                    page : page ? page : 0,
                    query : queryString,
                    success : function (result) {
                        $.each(result["response"]["objects"], function (i, doc) {
                            search.linkedDataSources.cwrc.results.push(search.getResultFromCWRC(doc));
                        });
                        $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
                        //$("#CWRCDataMessage").text("Results: " + search.linkedDataSources.cwrc.results().length );

                        // Calculate the range displayed in the message
                        var totalResults = result["response"]["numFound"];
                        var bottom = (totalResults == 0) ? 0 : 1 + (perPage * page);
                        var top = (page + 1) * perPage;
                        top = totalResults < top ? totalResults : top;


                        if ( top==0 && bottom==0 )
                        {
                          $("#CWRCDataMessage").text("Results: " + totalResults );
                        }
                        else
                        {
                          $("#CWRCDataMessage").text("Results: " + bottom + " - " + top + " of " + totalResults);
                        }


                        search.linkedDataSources.cwrc.maxPage(Math.floor(totalResults / perPage))
                    },
                    error : function (result) {
                        console.log(result);
                    },
                });

        }

        search.processGeoNameData = function (id, index) {
            return xmlToString(search.linkedDataSources.geonames.response[index]);
        }

        search.processGoogleGeocodeData = function (id, index) {
            return xmlToString(search.linkedDataSources.googlegeocode.response[index]);
        }

        search.processViafData = function (id) {
            var url = viafUrl + "/" + id + "/viaf.xml";
            var result = "";
            $.ajax({
                url : url,
                dataType : "text",
                async : false,
                success : function (response) {
                    result = response;
                },
                error : function () {
                    alert("error");
                }
            });

            return result;
        }

        search.processVIAFSearch = function (queryString, page) {
            // Calculate Page Information
            // 2015-05-21 - VIAF only returns max 10 results
            var perPage = 10;
            var bottom = 1 + (page * perPage);
            search.linkedDataSources.viaf.page(page);

            $(".linkedDataMessage").text("");
            $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
            $("#VIAFDataMessage").addClass("fa fa-spin fa-refresh");
            search.processData = search.processViafData;
            var viafSearchUrl = viafUrl + "/search";
            var viafPrefix = "";

            switch (dialogType) {
            case "person":
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
                    url : viafSearchUrl,
                    // dataType : 'json',
                    dataType : "xml",
                    processData : false,
                    data : "query=" + viafPrefix + quotedQueryString + "&sortKeys=holdingscount&maximumRecords=" + perPage + "&startRecord=" + bottom + "&httpAccept=text/xml",
                    success : function (response) {
                        $('searchRetrieveResponse record', response).each(function (index, spec) {
                            search.linkedDataSources.viaf.results.push(search.getResultFromVIAF(spec, index));
                        });
                        $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
                        //$("#VIAFDataMessage").text("Results: " + search.linkedDataSources.viaf.results().length);

                        // Calculate the range displayed in the message
                        var totalResults = parseInt($('searchRetrieveResponse numberOfRecords', response).text());
                        var top = (page + 1) * perPage;
                        top = totalResults < top ? totalResults : top;
                        bottom = ( top == 0 ) ? 0 : bottom;

                        if ( top==0 && bottom==0 )
                        {
                          $("#VIAFDataMessage").text("Results: " + totalResults );
                        }
                        else
                        {
                          $("#VIAFDataMessage").text("Results: " + bottom + " - " + top + " of " + totalResults);
                        }

                        search.linkedDataSources.viaf.maxPage(Math.floor(totalResults / perPage));
                    },
                    error : function (xhr, ajaxOptions, thrownError) {
                        if (ajaxOptions !== "abort") {
                            console.log("Error " + ajaxOptions);
                        }
                    }
                });
        }

        search.processGeoNameSearch = function (queryString) {
            $(".linkedDataMessage").text("");
            $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
            $("#GeoNamesDataMessage").addClass("fa fa-spin fa-refresh");
            search.processData = search.processGeoNameData;
            var quotedQueryString = encodeURI(queryString);
            search.linkedDataSources.viaf.ajaxRequest = $.ajax({
                    url : geonameUrl,
                    // dataType : 'json',
                    dataType : "xml",
                    processData : false,
                    data : "query=" + quotedQueryString + "&max_results=100",
                    success : function (response) {
                        search.linkedDataSources.geonames.response = [];
                        $('geonames geoname', response).each(function (index, spec) {
                            search.linkedDataSources.geonames.results.push(search.getResultFromGeoName(spec, index));
                            search.linkedDataSources.geonames.response.push(spec);
                        });
                        $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
                        $("#GeoNamesDataMessage").text("Results: " + search.linkedDataSources.geonames.results().length);
                    },
                    error : function (xhr, ajaxOptions, thrownError) {
                        if (ajaxOptions !== "abort") {
                            console.log("Error " + ajaxOptions);
                        }
                    }
                });
        }

        search.processGoogleGeocodeSearch = function (queryString) {
            $(".linkedDataMessage").text("");
            $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
            $("#GoogleGeocodeDataMessage").addClass("fa fa-spin fa-refresh");
            search.processData = search.processGoogleGeocodeData;
            var quotedQueryString = encodeURI(queryString);
            search.linkedDataSources.viaf.ajaxRequest = $.ajax({
                    url : googleGeocodeUrl,
                    // dataType : 'json',
                    dataType : "xml",
                    processData : false,
                    data : "address=" + quotedQueryString,
                    success : function (response) {
                        search.linkedDataSources.googlegeocode.response = [];
                        console.log(response);

                        $('GeocodeResponse result', response).each(function (index, spec) {
                            search.linkedDataSources.googlegeocode.results.push(search.getResultFromGoogleGeocode(spec, index));
                            search.linkedDataSources.googlegeocode.response.push(spec);
                        });

                        $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
                        $("#GoogleGeocodeDataMessage").text("Results: " + search.linkedDataSources.googlegeocode.results().length);
                    },
                    error : function (xhr, ajaxOptions, thrownError) {
                        if (ajaxOptions !== "abort") {
                            console.log("Error " + ajaxOptions);
                        }
                    }
                });
        }

        // Scraping functions

        search.scrapeResult = function () {
            if (search.selectedData) {
                search.selectedData.data = search.processData(search.selectedData.id, search.selectedData.index);
            }
        }

        search.htmlifyCWRCPerson = function () {

            var data = search.selectedData;
            // if string parse into JQuery DOM
            // else assume AJAX load has completed parse
            // on a 'text/xml' mime type
            var workingXML = (typeof(data.data)=='string') ? $.parseXML(data.data) : data.data;

            // nationality
            // var nationalitySelector = "";
            // data.nationality = $(workingXML).find(nationalitySelector).first().text();

            // birthDeath
            var dateTypeSelector = "entity > person > description > existDates > dateSingle > dateType";

            var birthNode = $(workingXML).find(dateTypeSelector).filter(function () {
                    return $(this).text() == 'birth';
                });
            var deathNode = $(workingXML).find(dateTypeSelector).filter(function () {
                    return $(this).text() == 'death';
                });
            var birthValue = birthNode.siblings("standardDate").text();
            var deathValue = deathNode.siblings("standardDate").text()
                // if (birthValue !== "" && deathValue !== "") {
                //  data.birthDeath = birthValue + "-" + deathValue;
                // }

                var dateSpacer = '...';

            birthValue = birthValue === "" ? dateSpacer : birthValue;
            deathValue = deathValue === "" ? dateSpacer : deathValue;

            if (birthValue == dateSpacer && deathValue == dateSpacer) {
                data.birthDeath = '';
            } else {
                data.birthDeath = birthValue + " - " + deathValue;
            }

            // data.birthDeath = birthValue + " - " + deathValue;
            // data.birthdeath = data.birthDeath === "... - ..." ?  : data.birthDeath;

            // data.birthDeath = "";

            // if (birthValue !== "") {
            //  data.birthDeath += birthValue;
            // }
            // data.birthDeath += " - ";
            // if (deathValue !== "") {
            //  data.birthDeath += deathValue;
            // }

            // if (data.birthDeath === " - ") {
            //  data.birthDeath = "";
            // }


            // gender
            var genderSelector = "entity > person > description > genders > gender";
            data.gender = $(workingXML).find(genderSelector).first().text();

            // url
            data.url = data.object_url;

            return search.completeHtmlifyPerson(data);

        };

        search.htmlifyCWRCOrganization = function () {

            var data = search.selectedData;
            // if string parse into JQuery DOM
            // else assume AJAX load has completed parse
            // on a 'text/xml' mime type
            var workingXML = (typeof(data.data)=='string') ? $.parseXML(data.data) : data.data;

            // url
            data.url = data.object_url;

            return search.completeHtmlifyOrganization(data);
        }

        search.getAnchor = function (url) {
            var anchor = $("<a></a>");
            anchor.attr("target", "_blank");
            anchor.attr("href", url);
            anchor.append("URL: " + url);

            return anchor;
        }

        search.completeHtmlifyOrganization = function (data) {
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

        search.htmlifyCWRCTitle = function () {
            var data = search.selectedData;
            // if string parse into JQuery DOM
            // else assume AJAX load has completed parse
            // on a 'text/xml' mime type
            var workingXML = (typeof(data.data)=='string') ? $.parseXML(data.data) : data.data;


            // author,
            data.authors = []; //"Author";
            var authorSelector = "mods > name"; //

            var authors = $(workingXML).find(authorSelector).filter(function () {
                    return $(this).attr("type") === 'personal';
                });
            $(authors).children("namePart").each(function (i, namePart) {
                data.authors.push($(namePart).text());
            });

            //date,

            var dateSelector = "mods > originInfo > dateIssued";
            data.date = $(workingXML).find(dateSelector).first().text();

            //URL
            data.url = data.object_url;

            return search.completeHtmlifyTitle(data);
        }

        search.completeHtmlifyTitle = function (data) {
            var head = $("<div></div>");
            var list = $("<ul></ul>");
            //author
            var listItem;
            for (var i = 0; i < data.authors.length; ++i) {
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

        search.htmlifyCWRCPlace = function () {
            var data = search.selectedData;
            // if string parse into JQuery DOM
            // else assume AJAX load has completed parse
            // on a 'text/xml' mime type
            var workingXML = (typeof(data.data)=='string') ? $.parseXML(data.data) : data.data;

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

            data.url = data.object_url;

            return search.completeHtmlifyPlace(data);
        }

        search.completeHtmlifyPlace = function (data) {
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

        search.htmlifyVIAFPerson = function () {
            var data = search.selectedData;
            return search.completeHtmlifyPerson(data);
        };

        search.completeHtmlifyPerson = function (data) {
            var result = "<div><ul>";

            if (data.nationality && data.nationality !== "") {
                result += "<li>Nationality: " + data.nationality + "</li>";
            }
            if (data.birthDeath && data.birthDeath !== "") {
                result += "<li>Birth - Death: " + data.birthDeath + "</li>";
            }
            // if (data.gender && data.gender !== "") {
            //  result += "<li>Gender: "+ data.gender +"</li>";
            // }
            if (data.url && data.url !== "") {
                result += "<li>URL: <a target='_blank' href='" + data.url + "'>" + data.url + "</a></li>";
            }
            result += "</ul></div>";
            return result;
        }

        search.htmlifyVIAFOrganization = function () {
            var result = "";
            var data = search.selectedData;

            result += "<div><ul>";
            if (data.url !== "") {
                result += "<li>URL: <a href='" + data.url + "'>" + data.url + "</a></li>";
            }
            result += "</ul></div>";
            return result;
        };

        search.htmlifyVIAFTitle = function () {
            // var result = "";
            // var data = search.selectedData;

            // result += "<div><ul>";
            // if (data.url !== "") {
            //  result += "<li>URL: <a href='" + data.url + "'>" + data.url +"</a></li>";
            // }
            // result += "</ul></div>";
            // return result;
            var data = search.selectedData;
            var head = $("<div></div>");
            var list = $("<ul></ul>");
            var listItem;

            if (data.authors) {
                listItem = $("<li></li>");
                listItem.append("Author: " + data.authors[0]);
                list.append(listItem);
            }

            if (data.date) {
                listItem = $("<li></li>");
                listItem.append("Date: " + data.date);
                list.append(listItem);
            }

            if (data.url) {
                listItem = $("<li></li>");
                listItem.append(search.getAnchor(data.url));
                list.append(listItem);
            }

            head.append(list);

            return xmlToString(head[0]);
        };

        search.paginateSearch = function (page, dataSource) {
            for (var key in search.linkedDataSources) {
                var lds = search.linkedDataSources[key];
                lds.results.removeAll();
            }

            var queryString = search.queryString();
            if (queryString && queryString != null && queryString.length > 0) {
                dataSource.processSearch(search.queryString(), page);
            }
        };

        search.linkedDataSources = {
            "cwrc" : search.getLinkedDataSource({
                "name" : "CWRC",
                "processSearch" : search.processCWRCSearch,
                "datatype" : ["person", "place", "organization", "title"],
                "paginate" : search.paginateSearch
            }),
            "viaf" : search.getLinkedDataSource({
                "name" : "VIAF",
                "processSearch" : search.processVIAFSearch,
                "datatype" : ["person", "organization", "title"],
                "paginate" : search.paginateSearch
            }),
            "geonames" : search.getLinkedDataSource({
                "name" : "GeoNames",
                "processSearch" : search.processGeoNameSearch,
                "datatype" : ["place"],
                "paginate" : null
            }),
            "googlegeocode" : search.getLinkedDataSource({
                "name" : "GoogleGeocode",
                "processSearch" : search.processGoogleGeocodeSearch,
                "datatype" : ["place"],
                "paginate" : null
            })
        }

        search.selectedLinkedDataSource = "cwrc";
        search.queryString = ko.observable("");
        search.isDataSelected = ko.observable(false);

        // templates

        search.getLinkedDataSourceTemplates = function () {
            var result = "";
            var index = 0;
            for (var key in search.linkedDataSources) {
                var lds = search.linkedDataSources[key];
                result +=
                '                                       <div class="panel panel-default" data-bind="visible: $root.linkedDataSources.' + key + '.showPanel">' +
                '                                           <div data-name="' + key + '" class="panel-heading panel-title" data-toggle="collapse" data-parent="#accordion" href="#collapse' + key + '" data-bind="{click:$root.selectLinkedDataSource}">' +
                '                                                       ' + lds.name + '<span class="pull-right linkedDataMessage" id="' + lds.name + 'DataMessage"></span>' +
                '                                           </div>' +
                '                                           <div id="collapse' + key + '"" class="panel-collapse collapse ' + (function () {
                    return index === 0 ? "in" : ""
                })() + '">' +
                '                                               <div class="panel-body">' +
                // paginator
                '                                   <div class="paginatorArea" id="' + lds.name + 'Paginator" data-bind="{if: $root.linkedDataSources[\'' + key + '\'].showPaginate}">' +
                //'                                 <span data-bind="{text: $root.linkedDataSources[\'' + key + '\'].page}">Results 100</span>'+
                // '                                    <select class="form-control">' +
                // '                                        <option>1</option>' +
                // '                                        <option>2</option>' +
                // '                                        <option>3</option>' +
                // '                                        <option>4</option>' +
                // '                                        <option>5</option>' +
                // '                                    </select>' +
                '                                   <ul class="pagination  pagination-sm nomargin" data-bind="with: $root.linkedDataSources[\'' + key + '\'], css: {hidden: $root.linkedDataSources[\'' + key + '\'].maxPage()==0}">' +
                '                                       <li data-bind="{css: {disabled: page() <= 0}}"><a href="#" data-bind="{attr: {data: page() - 1}, click: paginate}">&laquo;</a></li>' +
                '                                       <li data-bind="{css: {active: page() == paginateNumber(0) && maxPage()!=0, disabled: paginateNumber(0) > maxPage() || maxPage()==0}}"><a href="#" data-bind="{attr: {data: paginateNumber(0)}, text: paginateNumber(0) + 1, click: paginate}" data="0">1</a></li>' +
                '                                       <li data-bind="{css: {active: page() == paginateNumber(1), disabled: paginateNumber(1) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(1)}, text: paginateNumber(1) + 1, click: paginate}" data="1">2</a></li>' +
                '                                       <li data-bind="{css: {active: page() == paginateNumber(2), disabled: paginateNumber(2) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(2)}, text: paginateNumber(2) + 1, click: paginate}" data="2">3</a></li>' +
                '                                       <li data-bind="{css: {active: page() == paginateNumber(3), disabled: paginateNumber(3) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(3)}, text: paginateNumber(3) + 1, click: paginate}" data="3">4</a></li>' +
                '                                       <li data-bind="{css: {active: page() == paginateNumber(4), disabled: paginateNumber(4) > maxPage()}}"><a href="#" data-bind="{attr: {data: paginateNumber(4)}, text: paginateNumber(4) + 1, click: paginate}" data="4">5</a></li>' +
                '                                       <li data-bind="{css: {disabled: page() >= maxPage()}}"><a href="#" data-bind="{attr: {data: page() + 1}, click: paginate}">&raquo;</a></li>' +
                '                                   </ul>' +
                '                                   </div>' +
                // content
                '                                   <div class="list-group cwrc-result-area">' +
                '                                       <!-- ko foreach: linkedDataSources.' + key + '.results -->' +
                '                                       <a href="#" class="list-group-item" data-bind="{click:$root.selectResult, event: { dblclick: $root.returnAndHide }, css: {active: selected}}" >' +
                '                                           <h5 class="list-group-item-heading">' +
                '                                               <span data-bind="text: name"></span>' +
                '                                               <span class="cwrc-entity-info pull-right fa fa-info-circle" data-bind="click: $root.showInfoPopOver" data-content="Test content" data-original-title="Test title"></span>' +
                '                                           </h5>' +
                // '                                            <h5 class="list-group-item-heading"> <span data-bind="text:data[\'dc.title\']"></span> - <span data-bind="text:source"></span></h5>' +
                // '                                            <p class="list-group-item-text"><span data-bind="text:data.id"></span></p>' +
                '                                       </a>' +
                '                                       <!-- /ko -->' +
                '                                   </div>' +
                // end of content
                '                                               </div>' +
                '                                           </div>' +
                '                                       </div>';
                // alert(lds.name);
                ++index;
            }

            return result;
        }

        search.initialize = function () {

            var queryResultsTemplate = '' +
                '<script type="text/html" id="queryResults">' +
                '                                       <div class="panel panel-default">' +
                '                                           <div data-name="NAME VARIABLE" class="panel-heading panel-title" data-toggle="collapse" data-parent="#accordion" href="#collapseOne" data-bind="{click:$root.selectLinkedDataSource}">' +
                '                                                       NAME VARIABLE' +
                '                                           </div>' +
                '                                           <div id="collapseOne" class="panel-collapse collapse in">' +
                '                                               <div class="panel-body">' +
                // content
                '                                   <div class="list-group cwrc-result-area">' +
                '                                   </div>' +
                // end of content
                '                                               </div>' +
                '                                           </div>' +
                '                                       </div>' +
                '</script>';

            // $('head').append(queryResultsTemplate);

            var searchTemplates = '' +
                '<div id="cDSearch" class="bootstrap-scope">' +
                '   <div class="modal fade" id="cwrcSearchDialog">' +
                '       <div class="modal-dialog" id="search-modal">' +
                '           <div class="modal-content">' +
                '               <div class="modal-header">' +
                '                   <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                // '                    <h4 class="modal-title"><span>Search XXX</span></h4>' +
                '                       <h4 class="modal-title"><span data-bind="text: dialogTitle"></span></h4>' +
                '               </div>' +
                '               <div class="modal-body modal-body-area">' +
                '                   <!-- Content -->' +
                '                   <div class="row">' +
                '                       <div class="col-lg-12">' +
                '                               <input type="text" class="form-control" id="searchEntityInput" placeholder="Search" data-bind="{value:queryString, onKeyUp: delayedSearchEntity}">' +
                '                       </div><!-- /.col-lg-6 -->' +
                '                   </div><!-- /.row -->' +
                '                   <br> <!-- FIXME -->' +
                '                   <div class="row">' +
                '                       <!-- Results -->' +
                '                       <div class="col-lg-12">' +
                '                           <div class="panel">' +
                // '                                <div class="panel-heading">Results</div>' +
                '                               <div class="panel-body">' +
                //
                '                                   <div class="panel-group" id="accordion">' +
                search.getLinkedDataSourceTemplates() +
                // '                                        <!-- ko foreach: linkedDataSources -->' +
                // '                                        +<div data-bind="template: { name: \'queryResults\', data: $data }"></div>' +
                // '                                        <!-- /ko -->' +
                '                                   </div>' +
                //

                '                               </div>' +
                '                           </div>' +
                '                       </div>' +
                '                   </div>' +
                '                   <!--  End of content-->' +
                '               </div>' +
                '               <div class="modal-footer">' +
                '                   <button type="button" class="btn btn-danger" data-dismiss="modal" data-bind="click: cancel">Cancel</button>' +
                '                   <!-- ko foreach: buttons -->' +
                '                   <button type="button" class="btn btn-default" data-dismiss="modal" data-bind="enable: (isEdit && $root.isDataSelected) || !isEdit, text:label, click: $root.runCustomAction"></button>' +
                '                   <!-- /ko -->' +
                // '                    <button type="button" class="btn btn-default" data-bind="click: createEntity">Add New</button>' +
                '                   <button type="button" class="btn btn-primary" data-dismiss="modal" data-bind="enable: isDataSelected, click: returnSelected">Select</button>' +
                '               </div>' +
                '           </div>' +
                '       </div>' +
                '   </div>' +
                '</div>';

            $('body').append(searchTemplates);

            ko.bindingHandlers.datepicker = {
                init : function (element, valueAccessor, allBindingsAccessor) {

                    var options = {
                        format : "yyyy-mm-dd",
                        viewMode : 2,
                        autoclose : true
                    }
					
					var datepicker = $(element).siblings(':button').first().bsDatepicker(options);

                    datepicker.on("changeDate", function (event) {
                        var value = valueAccessor();
                        if (ko.isObservable(value)) {
                            var dateVal = ko.toJSON(event.date).substr(1, 10);
                            value(dateVal);
                            $(element).val(dateVal)
                        }

                    });

                    ko.utils.registerEventHandler(element, 'keyup', function (event) {
                        var value = valueAccessor();
                        if (ko.isObservable(value)) {
                            var dateVal = event.target.value
                                value(dateVal);
                        }
                    });
                },
                update : function (element, valueAccessor) {
                    var value = valueAccessor();
                    $(element).val(ko.unwrap(value));
                }
            };

            ko.bindingHandlers.onKeyUp = {
                init : function (element, valueAccessor, allBindingsAccessor, viewModel) {
                    ko.utils.registerEventHandler(element, 'keyup', function (evt) {
                        valueAccessor().call(viewModel);
                    });
                }
            };

            ko.applyBindings(search, $("#cDSearch")[0]);
            $("#cwrcSearchDialog").modal(params.modalOptions);

            $("#cwrcSearchDialog").draggable({
                handle : ".modal-header"
            });
            $("#cwrcSearchDialog").on('hidden.bs.modal', function (e) {
                // stop ajax call if exists
                search.clear();
                for (var key in search.linkedDataSources) {
                    var lds = search.linkedDataSources[key];
                    if (lds.ajaxRequest) {
                        lds.ajaxRequest.abort();
                    }
                }
                search.clear();
            });

            $("#cwrcSearchDialog").on('show.bs.modal', function (e) {
                $('.modal-body-area').css('max-height', $(window).height() * 0.7);
            });

			$('button.close','#cwrcSearchDialog').on('click', function(e) {
                search.cancel();
            });
        }

        // search functionality

        search.clear = function () {
            search.selectedData = null;
//          search.isDataSelected(false); // setting to false here breaks modal dismiss
            for (var key in search.linkedDataSources) {
                var lds = search.linkedDataSources[key];
                lds.results.removeAll();
            }
            search.queryString("");
            search.initiateInfo();
            search.removeInfoPopOver();
            $(".linkedDataMessage").text("");
            $(".linkedDataMessage").removeClass("fa fa-spin fa-refresh");
            $("#searchEntityInput").val("");
        };

        // search.delayedTimeout;
        search.delayedSearchEntity = function () {
            clearTimeout(search.delayedTimeout);
            search.delayedTimeout = setTimeout(search.searchEntity, 1000);
        }

        search.searchEntity = function () {
            // TEMP
            search.removeInfoPopOver();
            search.performSearch($("#searchEntityInput").val());
        };

        // Logic functions

        // models

        search.result = function (specs) {
            var that = {
                // processed initially
                name : "",
                id : "",
                // processed for result
                data : "",
                uri : "",
                // scrape : function() {return "";}, // defined for each linked data source
                // helper
                selected : ko.observable(false)
            }
            return that;
        }

        search.htmlifyGeoNamePlace = function (name, countryName, latitude, longitude, id) {
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

        search.htmlifyGoogleGeocodePlace = function (lat, lng, url) {
            var head = $("<div></div>");
            var list = $("<ul></ul>");
            var listItem = $("<li></li>");
            listItem.append("Latitude: " + lat);
            list.append(listItem);

            listItem = $("<li></li>");
            listItem.append("Longitude: " + lng);
            list.append(listItem);

            listItem = $("<li></li>");
            listItem.append(search.getAnchor(url));
            list.append(listItem);

            head.append(list);

            return xmlToString(head[0]);
        }

        search.getResultFromGeoName = function (specs, index) {
            // specs has data and source
            var that = search.result();
            that.index = index;
            that.id = $(specs).find("geonameid").text();
            that.name = $(specs).find("name").text() + ", " + $(specs).find("countryName").text();
            that.object_url = 'http://www.geonames.org/'+that.id;

            that.htmlify = function () {
                return search.htmlifyGeoNamePlace($(specs).find("name").text(),
                    $(specs).find("countryName").text(),
                    $(specs).find("lat").text(),
                    $(specs).find("lng").text(),
                    $(specs).find("geonameid").text())
            };

            return that;
        }

        search.getResultFromGoogleGeocode = function (specs, index) {
            var that = search.result();
            that.index = index;
            that.id = $(specs).find("place_id").text();;
            that.name = $(specs).find("formatted_address").text();
            that.object_url = "https://www.google.ca/maps/place/" + encodeURI($(specs).find("formatted_address").text());

            that.htmlify = function () {
                var location = $(specs).find("geometry").find("location");
                var url = that.object_url; 

                return search.htmlifyGoogleGeocodePlace($(location).find("lat").text(),
                    $(location).find("lng").text(),
                    url);
            }

            return that;
        }

        search.getResultFromCWRC = function (specs) {
            // specs has data and source
            var that = search.result();
            that.name = specs["object_label"];
            that.id = specs["PID"];
            //that.object_url = specs["object_url"];
            that.object_url = repositoryBaseObjectURL + that.id;

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

        search.viafSelectorHelper = function (originalSelector) {
            var pattern = /ns\d+\\:/g;
            var newSelector = originalSelector.replace(pattern, "");
            var result = originalSelector + " , " + newSelector;
            return result;
        }

        search.getResultFromVIAF = function (specs, index) {
            var that = search.result();
            var i = index + 2
                // Chrome has a bug which does not find elements with namesapces, to avoid this problem we define the selector twice
                // VIAF returns all of the required information on the list call so there is no need to request again on second call
                var codeSelector = "a";
            switch (dialogType) {
            case "person":
            case "organization":
                codeSelector = "a";
                break;
            case "title":
                codeSelector = "t";

            }

            // locate VIAF ID from the result
            var idSelector = search.viafSelectorHelper("recordData ns" + i + "\\:VIAFCluster ns" + i + "\\:viafID");
            // search MARC21 for a label to use
            var nameSelectorMARC21 = search.viafSelectorHelper("recordData >  ns" + i + "\\:VIAFCluster >  ns" + i + "\\:mainHeadings > ns" + i + "\\:mainHeadingEl > ns" + i + "\\:datafield[dtype='MARC21'] > ns" + i + "\\:subfield[code='" + codeSelector + "']"); //code attribute a
            // search UNIMARC for a label to use
            var nameSelectorUNIMARC = search.viafSelectorHelper("recordData >  ns" + i + "\\:VIAFCluster >  ns" + i + "\\:mainHeadings > ns" + i + "\\:mainHeadingEl > ns" + i + "\\:datafield > ns" + i + "\\:subfield[code='" + codeSelector + "']"); //code attribute a

            that.id = $(specs).find(idSelector).first().text();
            that.name = $(specs).find(nameSelectorMARC21).first().text(); 
            if (that.name == "")
            {
                that.name = $(specs).find(nameSelectorUNIMARC).first().text(); 
            }
            if (that.name == "")
            {
                that.name = "[Title not found]";
            }

            // Extra
            var urlSelector = search.viafSelectorHelper("recordData >  ns" + i + "\\:VIAFCluster >  ns" + i + "\\:Document");
            that.url = $(specs).find(urlSelector).first().attr("about");
            that.object_url = that.url;

            switch (dialogType) {
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

        search.completeViafPersonResult = function (that, specs, i) {
            var birthDeathSelector = search.viafSelectorHelper("recordData >  ns" + i + "\\:VIAFCluster >  ns" + i + "\\:mainHeadings > ns" + i + "\\:mainHeadingEl > ns" + i + "\\:datafield > ns" + i + "\\:subfield[code='d']");
            var genderSelector = search.viafSelectorHelper("recordData >  ns" + i + "\\:VIAFCluster >  ns" + i + "\\:fixed > ns" + i + "\\:gender");
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

        search.completeViafOrganizationResult = function (that, specs, i) {}

        search.completeViafTitleResult = function (that, specs, i) {
            var authorSelector = search.viafSelectorHelper("recordData > ns" + i + "\\:VIAFCluster > ns" + i + "\\:mainHeadings > ns" + i + "\\:mainHeadingEl > ns" + i + "\\:datafield > ns" + i + "\\:subfield[code='a']");
            var dateSelector = search.viafSelectorHelper("recordData > ns" + i + "\\:VIAFCluster > ns" + i + "\\:mainHeadings > ns" + i + "\\:mainHeadingEl > ns" + i + "\\:datafield > ns" + i + "\\:subfield[code='d']");

            var date = $(specs).find(dateSelector).first().text();
            that.date = date;

            var authors = [];
            authors.push($(specs).find(authorSelector).first().text());
            that.authors = authors;

        }

        search.selectResult = function (result) {
            $.each(search.linkedDataSources[search.selectedLinkedDataSource].results(), function (i, entry) {
                entry.selected(false);
            });
            result.selected(true);

            if (search.selectedData != undefined && search.selectedData != null && search.selectedData != result) {
                search.removeInfoPopOver();
            }

            search.selectedData = result;
            search.isDataSelected(true);
        };

        search.selectLinkedDataSource = function (data, event) {
            search.selectedLinkedDataSource = $(event.target).attr("data-name");
            search.searchEntity();
        }

        search.performSearch = function (queryString) {
            search.selectedData = null;
            search.isDataSelected(false);

            for (var key in search.linkedDataSources) {
                var lds = search.linkedDataSources[key];
                lds.results.removeAll();
            }

            search.selectedData = null;
            if (queryString !== "") {

                // CWRC Search
                for (var key in search.linkedDataSources) {
                    var lds = search.linkedDataSources[key];
                    if (lds.ajaxRequest !== null) {
                        lds.ajaxRequest.abort();
                    }
                }
                search.linkedDataSources[search.selectedLinkedDataSource].processSearch(queryString, 0);
            }
        };

        search.processData = function () {
            return "";
        }

        search.GetResult = function () {
            var result = {};
            if (search.selectedData) {
                result.id = search.selectedData.id;
                result.name = search.selectedData.name;
                result.repository = search.selectedLinkedDataSource;
                result.data = search.selectedData.data;
                result.uri = search.selectedData.object_url;
            }
            return result;
        }

        search.runCustomAction = function (custom) {
            search.scrapeResult();
            custom.action(search.GetResult());
            search.clear();
        }

        search.returnSelected = function () {
            search.scrapeResult();
            search.success(search.GetResult());
            search.clear();
        };

		search.cancel = function () {
			if (search.cancelled) {
				search.cancelled();
			}
        }
		
        search.initiateInfo = function () {
            $("#search-modal").popover({
                title : function () {
                    return search.selectedData.name;
                },
                content : function () {
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
                html : true,

                trigger : "manual"
            });
        }

        search.showInfoPopOver = function (clicked) {
            // search.selectResult(clicked);
            search.selectedData = clicked;
            $("#search-modal").popover("show");
            $(".popover").find(".arrow").removeClass("arrow");
        }

        search.removeInfoPopOver = function () {
            $("#search-modal").popover("hide");
        }

        search.returnAndHide = function () {
            search.returnSelected();
            $("#cwrcSearchDialog").modal("hide");
        }

        ///////////////////////////////////////////////////////////////////////
        // cD search interface
        ///////////////////////////////////////////////////////////////////////

        var completeSearchDialog = function (opts) {
            $("#cwrcSearchDialog").modal("show");
            search.buttons.removeAll();
            // search.buttons(opts.buttons);
            if (opts.buttons) {
                for (var i = 0; i < opts.buttons.length; ++i) {
                    var button = opts.buttons[i];
                    if (typeof(button.label) === 'string' &&
                        typeof(button.action) === 'function') {
                        search.buttons.push(button);
                    }
                }
            }

            // define panels to be shown
            var dataId = "";
            for (dataId in search.linkedDataSources) {
                var dataSource = search.linkedDataSources[dataId];
                dataSource.showPanel(dataSource.datatype.indexOf(dialogType) > -1);
            }

            // alert(search.buttons[0].label)
            search.success = typeof opts.success === undefined ? function () {} : opts.success;
            search.error = typeof opts.error === undefined ? function () {} : opts.error;
            search.cancelled = typeof opts.cancelled === undefined ? function () {} : opts.cancelled;

            if (opts.query) {
                //update: $("#searchEntityInput").val(opts.query);
                search.queryString(opts.query);
                // do search 
                search.performSearch(opts.query);
            }
        }

        var popSearchPerson = function (opts) {
            search.clear();
            search.dialogTitle("Search Person");
            dialogType = "person";

            // search.buttons = opts.buttons ? opts.buttons : [];
            // search.buttons = opts.buttons;
            completeSearchDialog(opts);

        };

        cD.popSearchPerson = popSearchPerson;

        var popSearchOrganization = function (opts) {
            search.clear();
            search.dialogTitle("Search Organization");
            dialogType = "organization";
            completeSearchDialog(opts);

        }

        cD.popSearchOrganization = popSearchOrganization;

        var popSearchPlace = function (opts) {
            search.clear();
            search.dialogTitle("Search Place");
            dialogType = "place";
            completeSearchDialog(opts);
        }

        cD.popSearchPlace = popSearchPlace;

        var popSearchTitle = function (opts) {
            search.clear();
            search.dialogTitle("Search Title");
            dialogType = "title";
            completeSearchDialog(opts);
        }

        cD.popSearchTitle = popSearchTitle;

        var popSearch = {
            person : cD.popSearchPerson,
            organization : cD.popSearchOrganization,
            place : cD.popSearchPlace,
            title : cD.popSearchTitle
        };

        cD.popSearch = popSearch;

        ///////////////////////////////////////////////////////////////////////

        initialize();

    })();
    
    return cD;
});
