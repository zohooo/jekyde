
var fsextra = require('fs-extra');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, dirs){
    var link = '/' + site.archive_dir + '/index.html';
    var html = swig('archive', {site: site});
    fsextra.outputFileSync(dirs.wdir + link, html);
});
