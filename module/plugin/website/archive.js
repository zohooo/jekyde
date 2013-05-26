
var fs = require('fs');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, envs){
    if (!fs.existsSync(envs.tdir + '/layout/archive.html')) return [];
    var link = site.archive_dir + '/index.html';
    var html = swig('archive', {site: site});
    return [[link, html]];
});
