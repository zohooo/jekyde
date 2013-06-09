
var updater = require('./updater.js');

var site = updater.site;

exports.getAllPosts = function() {
    return JSON.stringify(site.posts, replacer);
}

exports.getAllPages = function() {
    return JSON.stringify(site.pages, replacer);
}

function replacer(key, value) {
    var omits = ['content', 'excerpt', 'previous', 'next'];
    if (omits.indexOf(key) == -1) return value;
}
