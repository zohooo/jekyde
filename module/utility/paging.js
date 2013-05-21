
module.exports = function(base, posts, limit){
    var length = posts.length;
    var total = Math.ceil(length / limit);
    var articles, paginator;
    var results = [];
    for (var i = 1; i <= total; i++) {
        articles = posts.slice(limit * (i-1), limit * i);
        paginator = {
            per_page: limit,
            total_articles: length,
            total_pages: total,
            page: i
        };
        if (i > 1) {
            paginator.previous_page = i - 1;
            if (i == 2) {
                paginator.previous_url = base + '/';
            } else {
                paginator.previous_url = base + '/' + (i-1) + '/';
            }
            paginator.current_url = base + '/' +  i + '/';
        } else {
            paginator.previous_page = null;
            paginator.previous_url = null;
            paginator.current_url = base + '/' + '';
        }
        if (i < total) {
            paginator.next_page = i + 1;
            paginator.next_url = base + '/' + (i+1) + '/';
        } else {
            paginator.next_page = null;
            paginator.next_url = null;
        }
        results.push({articles: articles, paginator: paginator});
    }
    return results;
};
