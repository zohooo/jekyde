
var fs = require('fs');
var swig = require('swig');

jekyde.extend.website(function(site, dirs){
    var posts = site.posts;
    var length = posts.length;
    var p = site.paginate;
    var t = Math.ceil(length / p);
    var paginator = {
            per_page: p,
            total_posts: length,
            total_pages: t
    };
    var data = {
        paginator: paginator,
        site: site
    };
    var baseurl = site.baseurl;

    for (var i = 1; i <= paginator.total_pages; i++) {
        paginator.page = i;
        paginator.posts = posts.slice(p * (i-1), p * i);
        if (i > 1) {
            paginator.previous_page = i - 1;
            if (i == 2) {
                paginator.previous_url = baseurl + 'index.html';
            } else {
                paginator.previous_url = baseurl + 'index' + (i-1) + '.html';
            }
        } else {
            paginator.previous_page = null;
            paginator.previous_url = null;
        }
        if (i < t) {
            paginator.next_page = i + 1;
            paginator.next_url = baseurl + 'index' + (i+1) + '.html';
        } else {
            paginator.next_page = null;
            paginator.next_url = null;
        }
        var link = (i == 1) ? '/index.html' : '/index' + i + '.html';
        var template = swig.compileFile('../layout/index.html');
        var html = template.render(data);
        fs.writeFileSync(dirs.wdir + link, html);
    }
});
