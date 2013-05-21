
var fs = require('fs');
var fsextra = require('fs-extra');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, envs){
    var link, html;
    if (fs.existsSync(envs.tdir + '/layout/categories.html')) {
        link = '/' + site.category_dir + '/index.html';
        html = swig('categories', {site: site});
        fsextra.outputFileSync(envs.wdir + link, html);
    }
    if (fs.existsSync(envs.tdir + '/layout/category.html')) {
        var categories = site.categories;
        for (var k in categories) {
            link = '/' + site.category_dir + '/' + k.toLowerCase() + '.html';
            html = swig('category', {site: site, category: categories[k]});
            fsextra.outputFileSync(envs.wdir + link, html);
        };
    }
});
