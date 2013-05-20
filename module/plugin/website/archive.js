
var fsextra = require('fs-extra');
var swig = require('swig');

jekyde.extend.website(function(site, dirs){
    var link = '/' + site.archive_dir + '/index.html';
    var template = swig.compileFile('../layout/archive.html');
    var html = template.render({site: site});
    fsextra.outputFileSync(dirs.wdir + link, html);
});
