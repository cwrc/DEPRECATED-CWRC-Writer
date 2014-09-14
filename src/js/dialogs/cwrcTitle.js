define(['dialogs/cwrcDialogBridge', 'jquery', 'jquery-ui'], function (CwrcDialogBridge) {
  'use strict';
  return function (writer, cwrcDialog) {
    return new CwrcDialogBridge(writer, cwrcDialog, {
      label: 'Title',
      localDialog: 'title',
      cwrcType: 'title'
    });
  };
});
