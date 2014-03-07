define(['jquery', 'tinymce'], function($, tinymce) {
	
return function(writer, config) {
	var w = writer;
	
	var sm = {};
	
	/**
	 * A map of schema objects. The key represents the schema ID, the "value" should have the following properties:
	 * @param name A name/label for the schema
	 * @param url The URL where the schema is located
	 * @param cssUrl The URL where the schema's CSS is located
	 */
	sm.schemas = config.schemas || {};
	
	// the ID of the current validation schema, according to config.schemas
	sm.schemaId = null;
	
	sm.schemaXML = null; // a cached copy of the loaded schema
	sm.schemaJSON = null; // a json version of the schema
	sm.schema = {elements: []}; // stores a list of all the elements of the loaded schema

	/**
	 * Add a schema to the list.
	 * @param {Object} config The config object
	 * @param {String} config.name The name for the schema
	 * @param {String} config.url The url to the schema
	 * @param {String} config.cssUrl The url to the css
	 * @returns {String} id The id for the schema
	 * 
	 */
	sm.addSchema = function(config) {
		var id = tinymce.DOM.uniqueId('schema');
		sm.schemas[id] = config;
		w.event('schemaAdded').publish(id);
		return id;
	},
	
	/**
	 * Load a new schema.
	 * @param {String} schemaId The ID of the schema to load (from the config)
	 * @param {Boolean} startText Whether to include the default starting text
	 * @param {Function} callback Callback for when the load is complete
	 */
	sm.loadSchema = function(schemaId, startText, callback) {
		var baseUrl = ''; //w.project == null ? '' : w.baseUrl; // handling difference between local and server urls
		sm.schemaId = schemaId;
		var schemaUrl = sm.schemas[sm.schemaId].url;
		
		$.ajax({
			url: schemaUrl,
			dataType: 'xml',
			success: function(data, status, xhr) {
				sm.schemaXML = data;
				// get root element
				var startName = $('start ref:first', sm.schemaXML).attr('name');
				var startEl = $('define[name="'+startName+'"] element', sm.schemaXML).attr('name');
				w.root = startEl;
//				w.editor.settings.forced_root_block = w.root;
//				w.editor.schema.addCustomElements(w.root);
//			    w.editor.schema.addCustomElements(w.root.toLowerCase());
				
				var additionalBlockElements;
			    if (w.root == 'TEI') {
			    	additionalBlockElements = ['argument', 'back', 'bibl', 'biblFull', 'biblScope', 'body', 'byline', 'category', 'change', 'cit', 'classCode', 'elementSpec', 'macroSpec', 'classSpec', 'closer', 'creation', 'date', 'distributor', 'div', 'div1', 'div2', 'div3', 'div4', 'div5', 'div6', 'div7', 'docAuthor', 'edition', 'editionStmt', 'editor', 'eg', 'epigraph', 'extent', 'figure', 'front', 'funder', 'group', 'head', 'dateline', 'idno', 'item', 'keywords', 'l', 'label', 'langUsage', 'lb', 'lg', 'list', 'listBibl', 'note', 'noteStmt', 'opener', 'p', 'principal', 'publicationStmt', 'publisher', 'pubPlace', 'q', 'rendition', 'resp', 'respStmt', 'salute', 'samplingDecl', 'seriesStmt', 'signed', 'sp', 'sponsor', 'tagUsage', 'taxonomy', 'textClass', 'titlePage', 'titlePart', 'trailer', 'TEI', 'teiHeader', 'text', 'authority', 'availability', 'fileDesc', 'sourceDesc', 'revisionDesc', 'catDesc', 'encodingDesc', 'profileDesc', 'projectDesc', 'docDate', 'docEdition', 'docImprint', 'docTitle'];
			    	
			    	w.header = 'teiHeader';
			    	// FIXME temp fix for doc structure
			    	w.idName = 'xml:id';
			    } else {					
			    	additionalBlockElements = ['DIV0', 'DIV1', 'EVENTS', 'ORLANDOHEADER', 'DOCAUTHOR', 'DOCEDITOR', 'DOCEXTENT', 'PUBLICATIONSTMT', 'TITLESTMT', 'PUBPLACE', 'L', 'P', 'HEADING', 'CHRONEVENT', 'CHRONSTRUCT'];
					
					w.header = 'ORLANDOHEADER';
					w.idName = 'ID';
			    }
			    var blockElements = w.editor.schema.getBlockElements();
			    for (var i = 0; i < additionalBlockElements.length; i++) {
		    		blockElements[additionalBlockElements[i]] = {};
		    	}
				
				function processSchema() {
					// remove old schema elements
				    $('#schemaTags', w.editor.dom.doc).remove();
				    $('#schemaRules', w.editor.dom.doc).remove();
				    
				    var cssUrl = sm.schemas[sm.schemaId].cssUrl;
				    if (cssUrl) {
				    	sm.loadSchemaCSS(cssUrl);
				    }
				    
				    // create css to display schema tags
					$('head', w.editor.getDoc()).append('<style id="schemaTags" type="text/css" />');
					
					var schemaTags = '';
					var elements = [];
					$('element', sm.schemaXML).each(function(index, el) {
						var tag = $(el).attr('name');
						if (tag != null && elements.indexOf(tag) == -1) {
							elements.push(tag);
							var tagName = w.utilities.getTagForEditor(tag);
							schemaTags += '.showStructBrackets '+tagName+'[_tag='+tag+']:before { color: #aaa; font-weight: normal; font-style: normal; font-family: monospace; content: "<'+tag+'>"; }';
							schemaTags += '.showStructBrackets '+tagName+'[_tag='+tag+']:after { color: #aaa; font-weight: normal; font-style: normal; font-family: monospace; content: "</'+tag+'>"; }';
						}
					});
					elements.sort();
					
					// hide the header
					var tagName = w.utilities.getTagForEditor(w.header);
					schemaTags += tagName+'[_tag='+w.header+'] { display: none !important; }';
					
					$('#schemaTags', w.editor.getDoc()).text(schemaTags);
				    
					sm.schema.elements = elements;
					
					if (callback == null) {
						var text = '';
						if (startText) text = 'Paste or type your text here.';
						var tag = w.utilities.getTagForEditor(w.root);
						w.editor.setContent('<'+tag+' _tag="'+w.root+'">'+text+'</'+tag+'>');
					}
					
					sm.schemaJSON = w.utilities.xmlToJSON($('grammar', sm.schemaXML)[0]);
					
					// update the schema for schematags.js
					// TODO migrate to 4
//					var stb = w.editor.controlManager.controls.editor_schemaTagsButton;
//					if (stb.menu) {
//						stb.parentControl.buildMenu(stb.menu, null, {disabled: false, mode: 'add'});
//					}
					
					w.event('schemaLoaded').publish();
					
					if (callback) callback();
				}
			    
				// handle includes
				var include = $('include:first', sm.schemaXML); // TODO add handling for multiple includes
				if (include.length == 1) {
					var url = '';
					var includeHref = include.attr('href');
					var schemaFile;
					if (includeHref.indexOf('/') != -1) {
						schemaFile = includeHref.match(/(.*\/)(.*)/)[2]; // grab the filename
					} else {
						schemaFile = includeHref;
					}
					var schemaBase = schemaUrl.match(/(.*\/)(.*)/)[1];
					if (schemaBase != null) {
						url = schemaBase + schemaFile;
					} else {
						url = baseUrl + 'schema/'+schemaFile;
					}
					
					$.ajax({
						url: url,
						dataType: 'xml',
						success: function(data, status, xhr) {
							// handle redefinitions
							include.children().each(function(index, el) {
								if (el.nodeName == 'start') {
									$('start', data).replaceWith(el);
								} else if (el.nodeName == 'define') {
									var name = $(el).attr('name');
									var match = $('define[name="'+name+'"]', data);
									if (match.length == 1) {
										match.replaceWith(el);
									} else {
										$('grammar', data).append(el);
									}
								}
							});
							
							include.replaceWith($('grammar', data).children());
							
							processSchema();
						}
					});
				} else {
					processSchema();
				}
			},
			error: function(xhr, status, error) {
				w.dialogManager.show('message', {title: 'Error', msg: 'Error loading schema: '+status, type: 'error'});
			}
		});
	};
	
	sm.loadSchemaCSS = function(url) {
		w.editor.dom.loadCSS(url);
		if (url.match('converted') != null) {
			// already converted so exit
			return;
		}
		var name = url.split('/');
		name = name[name.length-1];
		var numCss = w.editor.getDoc().styleSheets.length;
		var cssInt = null;
		function parseCss() {
			var stylesheet = null;
			var stylesheets = w.editor.getDoc().styleSheets;
			for (var i = 0; i < stylesheets.length; i++) {
				var s = stylesheets[i];
				if (s.href && s.href.indexOf(name) != -1) {
					stylesheet = s;
					break;
				}
			}
			if (stylesheet) {
				try {
					$('#schemaRules', w.editor.dom.doc).remove();
					
					var rules = stylesheet.cssRules;
					var newRules = '';
					// adapt the rules to our format, should only modify element names in selectors
					for (var i = 0; i < rules.length; i++) {
						// chrome won't get proper selector, see: https://code.google.com/p/chromium/issues/detail?id=67782
						var selector = rules[i].selectorText;
						var newSelector = selector.replace(/(^|,|\s)(\w+)/g, function(str, p1, p2, offset, s) {
							var tagName = w.utilities.getTagForEditor(p2);
							return p1+tagName+'[_tag="'+p2+'"]';
						});
						var css = rules[i].cssText;
						var newCss = css.replace(selector, newSelector);
						newRules += newCss+'\n';
					}
					$('head', w.editor.dom.doc).append('<style id="schemaRules" type="text/css" />');
					$('#schemaRules', w.editor.dom.doc).text(newRules);
					stylesheet.disabled = true;
				} catch (e) {
					setTimeout(parseCss, 25);
				}
			} else {
				setTimeout(parseCss, 25);
			}
		};
		if (numCss > 0) {
			parseCss();
		} else {
			cssInt = setInterval(function() {
				var len = w.editor.getDoc().styleSheets.length;
				if (len > numCss) {
					clearInterval(cssInt);
					parseCss();
				}
			}, 25);
		}
	};
	
	return sm;
};

});