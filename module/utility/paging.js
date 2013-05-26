
var site = require('./updater').sitedata;

module.exports = function(base, posts){
    var limit = (site.paginate > 0) ? site.paginate : 999;
    var length = posts.length;
    var total = Math.ceil(length / limit);
    if (base[base.length - 1] != '/') base += '/';
    var urls = new Array(total + 1);
    for (var i = 1; i <= total; i++) {
        urls[i] = (i == 1) ? base : base + i + '/';
    }
    var articles, paginator, results = [];
    for (i = 1; i <= total; i++) {
        articles = posts.slice(limit * (i - 1), limit * i);
        paginator = {
            per_page: limit,
            total_articles: length,
            total_pages: total,
            previous_page: ((i > 1) ? i - 1 : null),
            page: i,
            next_page: ((i < total) ? i + 1 : null),
            previous_url: urls[i - 1],
            current_url: urls[i],
            next_url: urls[i + 1]
        };
        results.push({articles: articles, paginator: paginator});
    }
    return results;
};
