var $ = require('jquery');

var CWRCWriter = require('./writer.js');
var Delegator = require('./delegator.js');
var Layout = require('./layout.js');
var config = require('./writerConfig.js');
config.delegator = Delegator;
config.layout = Layout;

module.exports = function(extraConfig) {
    $.extend(config, extraConfig);
    return new CWRCWriter(config);
}