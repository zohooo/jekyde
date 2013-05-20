
var fsextra = require('fs-extra');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, envs){
    var pages = site.pages;
    for (var i = 0; i < pages.length; i++) {
        var item = pages[i];
        var data = {
            site: site,
            page: item,
            content: item.content
        };
        var html = swig('page', data);
        fsextra.outputFileSync(envs.wdir + '/' + item.link, html);
    }
});
