
var fs = require('fs');
var fsextra = require('fs-extra');
var paging = require('../../utility/paging');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, envs){
    var link, html;
    if (fs.existsSync(envs.tdir + '/layout/tags.html')) {
        link = '/' + site.tag_dir + '/index.html';
        html = swig('tags', {site: site});
        fsextra.outputFileSync(envs.wdir + link, html);
    }
    function generate(layout) {
        var tags = site.tags;
        var base, results, data;
        for (var k in tags) {
            base = '/' + site.tag_dir + '/' + k.toLowerCase();
            results = paging(base, tags[k], site.paginate);
            for (var i = 0; i < results.length; i++){
                data = results[i];
                data.site = site;
                link = data.paginator.current_url.slice(site.baseurl.length - 1) + 'index.html';
                html = swig(layout, data);
                fsextra.outputFileSync(envs.wdir + link, html);
            }
        };
    }
    if (fs.existsSync(envs.tdir + '/layout/tag.html')) {
        generate('tag');
    } else {
        generate('index');
    }
});
