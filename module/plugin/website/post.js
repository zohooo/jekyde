
var fsextra = require('fs-extra');
var paging = require('../../utility/paging');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site, envs){
    var posts = site.posts;
    var item, data, link, html;
    var base = '/' + site.index_dir;
    var results = paging(base, posts, site.paginate);
    for (var i = 0; i < results.length; i++) {
        data = results[i];
        data.site = site;
        link = data.paginator.current_url.slice(site.baseurl.length - 1) + 'index.html';
        html = swig('index', data);
        fsextra.outputFileSync(envs.wdir + link, html);
        if (i == 0) {
            link = link.slice(base.length);
            html = swig('index', data);
            fsextra.outputFileSync(envs.wdir + link, html);
        }
    }
    for (i = 0; i < posts.length; i++) {
        item = posts[i];
        data = {
            site: site,
            article: item,
            post: true
        };
        html = swig('post', data);
        fsextra.outputFileSync(envs.wdir + '/' + item.link, html);
    }
});
