
var updater = require('./updater.js');

var site = updater.site;

exports.getAll = function(type) {
    return JSON.stringify(site[type], replacer);
}

exports.getOne = function(type, index) {
    var article = site[type][index];
    return JSON.stringify({head: article.head, body: article.body});
}

function replacer(key, value) {
    var omits = ['head', 'body', 'content', 'excerpt', 'previous', 'next'];
    if (omits.indexOf(key) == -1) return value;
}
