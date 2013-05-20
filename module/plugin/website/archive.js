
var fsextra = require('fs-extra');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, envs){
    var link = '/' + site.archive_dir + '/index.html';
    var html = swig('archive', {site: site});
    fsextra.outputFileSync(envs.wdir + link, html);
});
