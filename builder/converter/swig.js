
var swig = require('swig');
var builder = require('../builder');

swig.init({
    allowErrors: true,
    autoescape: false,
    cache: true,
    encoding: 'utf8',
    filters: {},
    root: './' + builder.envs.tdir + '/include',
    tags: builder.plugins.template,
    extensions: {},
    tzOffset: 0
});

module.exports = function(layout, data){
    var template = swig.compileFile('../layout/' + layout + '.html');
    return template.render(data);
};
