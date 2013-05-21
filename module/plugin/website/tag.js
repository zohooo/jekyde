
var fs = require('fs');
var fsextra = require('fs-extra');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, envs){
    var link, html;
    if (fs.existsSync(envs.tdir + '/layout/tags.html')) {
        link = '/' + site.tag_dir + '/index.html';
        html = swig('tags', {site: site});
        fsextra.outputFileSync(envs.wdir + link, html);
    }
    if (fs.existsSync(envs.tdir + '/layout/tag.html')) {
        var tags = site.tags;
        for (var k in tags) {
            link = '/' + site.tag_dir + '/' + k.toLowerCase() + '.html';
            html = swig('tag', {site: site, tag: tags[k]});
            fsextra.outputFileSync(envs.wdir + link, html);
        };
    }
});
