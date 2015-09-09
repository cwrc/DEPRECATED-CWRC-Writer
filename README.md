![Picture](http://www.cwrc.ca/wp-content/uploads/2010/12/CWRC_Dec-2-10_smaller.png)

CWRC-Writer
===========

The Canadian Writing Research Collaboratory (CWRC) is developing an in-browser text markup editor (CWRC-Writer) for use by collaborative scholarly editing projects.


How To Use
==========

CWRC-Writer makes use of RequireJS to load its files. The dependencies setup occurs in https://github.com/cwrc/CWRC-Writer/blob/development/src/js/config.js.
Currently, all require calls and CWRC-Writer initialization must be handled manually. See https://github.com/cwrc/CWRC-Writer/blob/development/src/editor_dev.htm for an example of how this is done.

### The steps involved are:

#### Set RequireJS baseUrl
```
require.config({baseUrl: 'js'});
```

#### Load the initial dependencies
```
require(['jquery', 'knockout'], function($, knockout) {
    window.ko = knockout; // requirejs shim isn't working for knockout
    
    require(['writer',
             'delegator',
             'jquery.layout',
             'jquery.tablayout'
    ], function(Writer, Delegator) {
        $(function() {
            // initialize the Writer
        });
    });
});
```

#### Initialize the Writer and any modules
```
writer = new Writer(config);
writer.init('editor');
writer.event('writerInitialized').subscribe(function(writer) {
  // load modules then do the setup
  require(['modules/entitiesList','modules/relations','modules/selection',
           'modules/structureTree','modules/validation'
  ], function(EntitiesList, Relations, Selection, StructureTree, Validation) {
    // initialize modules and do layout
  });
});
```

#### Perform layout functions
See https://github.com/cwrc/CWRC-Writer/blob/development/src/js/layout.js for an example of module initialization and layout.

### Writer Config options

* `config.cwrcRootUrl`: String. An absolute URL that should point to the root of the CWRC-Writer directory. <b>Required</b>.
* `config.mode`: String. The mode to start the CWRC-Writer in. Can be either `xml` or `xmlrdf`.
* `config.allowOverlap`: Boolean. Should overlapping entities be allowed initially?.
* `config.project`: String. Denotes the current project. Not currently used.
* `config.schemas`: Object. A map of schema objects that can be used in the CWRC-Writer. Each entry should contain the following:
  * `name`: The schema title.
  * `url`: An url that links to the actual schema (RELAX NG) file.
  * `cssUrl`: An url that links to the CSS associated with this schema.
  * `schemaMappingsId`: The directory name associated with this schema. This is used to load appropriate mapping and dialogs files from the schema directory: https://github.com/cwrc/CWRC-Writer/tree/development/src/js/schema
* `config.cwrcDialogs`: Object. Contains various urls for use by the [CWRC-Dialogs](https://github.com/cwrc/CWRC-Dialogs). See [writerConfig.js](https://github.com/cwrc/CWRC-Writer/blob/development/src/js/writerConfig.js) for an example.
* `config.buttons1`, `config.buttons2`, `config.buttons3`: String. A comma separated list of plugins that will be set in the toolbars in the CWRC-Writer. Some possible values are: `addperson, addplace, adddate, addorg, addcitation, addnote, addtitle, addcorrection, addkeyword, addlink, editTag, removeTag, addtriple, viewsource, editsource, validate, savebutton, loadbutton`.
