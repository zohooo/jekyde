
var updater = require('./updater.js');

var site = updater.site;

exports.getAllPosts = function() {
    return JSON.stringify(site.posts, replacer);
}

exports.getAllPages = function() {
    return JSON.stringify(site.pages, replacer);
}

exports.getPost = function(index) {
    var article = site.posts[index];
    return JSON.stringify({head: article.head, body: article.body});
}

exports.getPage = function(index) {
    var article = site.pages[index];
    return JSON.stringify({head: article.head, body: article.body});
}

function replacer(key, value) {
    var omits = ['head', 'body', 'content', 'excerpt', 'previous', 'next'];
    if (omits.indexOf(key) == -1) return value;
}
