
var fs = require('fs');
var paging = require('../../utility/paging');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, envs){
    var outputs = [];
    var link, html;
    if (fs.existsSync(envs.tdir + '/layout/tags.html')) {
        link = site.tag_dir + '/index.html';
        html = swig('tags', {site: site});
        outputs.push([link, html]);
    }
    function generate(layout) {
        var tags = site.tags;
        var base, results, data;
        for (var k in tags) {
            base = site.root + site.tag_dir + '/' + k.toLowerCase() + '/';
            results = paging(base, tags[k]);
            for (var i = 0; i < results.length; i++){
                data = results[i];
                data.site = site;
                link = data.paginator.urls[data.paginator.current].slice(site.root.length) + 'index.html';
                html = swig(layout, data);
                outputs.push([link, html]);
            }
        };
    }
    if (fs.existsSync(envs.tdir + '/layout/tag.html')) {
        generate('tag');
    } else {
        generate('index');
    }
    return outputs;
});
