
var builder = require('../../builder');

builder.extend.template('ctime', function(args, content){
    return (new Date()).toISOString();
}, false);
