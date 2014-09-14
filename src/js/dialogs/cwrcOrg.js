define(['dialogs/cwrcDialogBridge', 'jquery', 'jquery-ui'], function (CwrcDialogBridge) {
  'use strict';
  return function (writer, cwrcDialog) {
    var schema = 'js/cwrcDialogs/schemas/entities.rng',
      configDefinesSchema = writer.initialConfig !== undefined &&
        writer.initialConfig.cwrcDialogs !== undefined &&
        writer.initialConfig.cwrcDialogs.schemas !== undefined &&
        writer.initialConfig.cwrcDialogs.schemas.organization !== undefined;
    if (configDefinesSchema) {
      schema = writer.initialConfig.cwrcDialogs.schemas.organization;
    }
    cwrcDialog.setOrganizationSchema(schema);
    return new CwrcDialogBridge(writer, cwrcDialog, {
      label: 'Organization',
      localDialog: 'org',
      cwrcType: 'organization'
    });
  };
});
