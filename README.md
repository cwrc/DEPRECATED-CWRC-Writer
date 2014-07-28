CWRC-Writer
===========

The Canadian Writing Research Collaboratory (CWRC) is developing an in-browser text markup editor (CWRC-Writer) for use by collaborative scholarly editing projects.


How To Use
==========

CWRC-Writer makes use of RequireJS to load its files. The dependencies setup and initial loading occur in https://github.com/cwrc/CWRC-Writer/blob/master/src/js/config.js. After the files are loaded a call is made to a global function `cwrcWriterInit` and the `Writer` and `Delegator` classes are passed to it.

It is up to the developer to provide the `cwrcWriterInit` function and to initialize the `Writer` itself. For example:
```
function cwrcWriterInit(Writer, Delegator) {
  var config = {};
  config.delegator = Delegator;
  writer = new Writer(config);
  writer.event('writerInitialized').subscribe(function(writer) {
  	// load modules then do the setup
  	require(['modules/entitiesList', 'modules/structureTree', 'modules/validation'
  	], function(EntitiesList, StructureTree, Validation) {
  		setupLayoutAndModules(writer, EntitiesList, StructureTree, Validation);
  	});
  });
}
```

In this example we are loading additional modules from https://github.com/cwrc/CWRC-Writer/tree/master/src/js/modules and then performing a custom layout function (which can be found here: https://github.com/cwrc/CWRC-Writer/blob/master/src/js/layout.js)
