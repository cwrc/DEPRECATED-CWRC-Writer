define(['jquery', 'jquery-ui'], function ($) {
  'use strict';
  // A bridge between the CWRC-Writer and the cwrcDialogs.
  return function (writer, cwrcDialog, config) {
    var label = config.label,
      localDialog = config.localDialog,
      cwrcType = config.cwrcType,
      createEditOpts;

    createEditOpts = {
      success: function (result) {
        if (result.data === null) {
          var error = result.error || 'There was an error creating the entry.';
          writer.dialogManager.show('message', {
            title: 'Error',
            type: 'error',
            msg: error
          });
        } else {
          // @todo Deal with hard coded url.
          result = {
            id: 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/' + result.response.pid
          };
          writer.dialogManager.show('schema/' + localDialog, {
            cwrcInfo: result
          });
        }
      },
      error: function (error) {
        console.log(error);
      }
    };
    return {
      show: function (config) {
        if (config.entry) {
          writer.dialogManager.show('schema/' + localDialog, {
            entry: config.entry
          });
        } else {
          var query = writer.editor.currentBookmark.rng.toString();

          cwrcDialog.popSearch[cwrcType]({
            query: query,
            success: function (result) {
              if (result.id === null) {
                if (cwrcType === 'place') {
                  result = {
                    id: writer.utilities.createGuid(),
                    data: '<geoname><name>Hamilton</name><asciiName>Hamilton</asciiName><lat>44.0501200</lat><lng>-78.2328200</lng><countryCode>CA</countryCode><countryName>Canada</countryName><fcl>A</fcl><fcode>ADM2</fcode><geonameid>' + writer.utilities.createGuid() + '</geonameid><granularity>Province/State</granularity></geoname>',
                    name: 'Test ' + label,
                    repository: 'geonames'
                  };
                } else {
                  result = {
                    id: writer.utilities.createGuid(),
                    name: ['Test ' + label],
                    repository: 'cwrc'
                  };
                }
              }

              if (result.repository === 'viaf') {
                result.id = 'http://viaf.org/viaf/' + result.id;
              } else if (result.repository === 'geonames') {
                result.id = 'http://www.geonames.org/' + $('geonameid', writer.utilities.stringToXML(result.data)).text();
              } else {
                // @todo Deal with hardcoded URL.
                result.id = 'http://cwrc-dev-01.srv.ualberta.ca/islandora/object/' + result.id;
              }

              if ($.isArray(result.name)) {
                result.name = result.name[0];
              }
              delete result.data;

              writer.dialogManager.show('schema/' + localDialog, {
                query: query,
                cwrcInfo: result
              });
            },
            error: function (error) {
              console.log(error);
            },
            buttons: [{
              label : 'Create New ' + label,
              action: function () {
                cwrcDialog.popCreate[cwrcType](createEditOpts);
              }
            }, {
              label: 'Edit ' + label,
              action: function (data) {
                cwrcDialog.popEdit[cwrcType]($.extend({}, createEditOpts, data));
              }
            }]
          });
        }
      },
      hide: function () {
        // @todo This should probably hide something, or not exist?
        return null;
      }
    };
  };
});
