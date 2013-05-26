
var paging = require('../../utility/paging');
var swig = require('../../converter/swig');

jekyde.extend.website(function(site){
    var outputs = [];
    var posts = site.posts;
    var item, data, link, html;
    var base = site.baseurl;
    var results = paging(base, posts);
    for (var i = 0; i < results.length; i++) {
        data = results[i];
        data.site = site;
        link = data.paginator.current_url.slice(site.baseurl.length) + 'index.html';
        html = swig('index', data);
        outputs.push([link, html]);
    }
    for (i = 0; i < posts.length; i++) {
        item = posts[i];
        data = {
            site: site,
            article: item,
            post: true
        };
        html = swig('post', data);
        outputs.push([item.link, html]);
    }
    return outputs;
});
