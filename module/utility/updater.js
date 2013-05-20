
var datetitle = require('./datetitle');
var yaml = require('../converter/yaml');

var sitedata = exports.sitedata = {
    title:          'Simple Blog',
    subtitle:       'A static blog',
    host:           'http://localhost',
    baseurl:        '/',
    archive_dir:    'archive',
    post_link:      'post/:year/:month/:day/:name.html',
    page_link:      'page/:name',
    paginate:       4,
    latex:          false,
    port:           4040,
    posts:          [],
    pages:          []
};

function findData(list, basename) {
    var i = list.length;
    list.some(function(value, index){
        if (value.filename === basename) {
            i = index;
            return true;
        } else return false;
    });
    return i;
}

exports.pushData = function(type, basename, text, check) {
    var list = sitedata[type + 's'];
    var obj = yaml(text);
    parseName(obj, type, basename);
    if (type == 'post' && (!obj.date || !(obj.date instanceof Date))) {
        console.log('[Error] No date in file "' + basename + '.md" ');
        return;
    }
    if (!obj.title) obj.title = 'Empty Title';
    setPermalink(obj, type);
    if (check) {
        list[findData(list, basename)] = obj;
    } else {
        list.push(obj);
    }
}

exports.moveData = function(type, basename, newname) {
    var list = sitedata[type + 's'];
    var obj = list[findData(list, basename)];
    parseName(obj, type, newname);
    setPermalink(obj, type);
}

exports.dropData = function(type, basename) {
    var list = sitedata[type + 's'];
    var i = findData(list, basename);
    if (i < list.length) list.splice(i, 1);
}

exports.sortPosts = function() {
    var posts = sitedata['posts'];
    posts.sort(function(post1, post2) {
        return post2.date.getTime() - post1.date.getTime();
    });
    posts.forEach(function(post, index, list){
        post.next = (index > 0) ? list[index - 1] : null;
        post.previous = (index < list.length) ? list[index + 1] : null;
    });
}

function parseName(obj, type, basename) {
    if (type == "post") {
        datetitle(obj, basename);
    } else {
        var link = type + '/' + basename + '.html';
        obj.link = type + '/' + basename + '.html';
        obj.name = basename;
    }
    obj.filename = basename;
}

function setPermalink(obj, type) {
    var link = (type == 'post') ? sitedata.post_link : sitedata.page_link;
    var title = obj.title.toLowerCase().replace(/\s/g, '-');
    var name = obj.name ? obj.name.toLowerCase().replace(/\s/g, '-') : title;
    if (type == 'post') {
        var date = obj.metadate;
        link = link.replace(':year', date[0])
                   .replace(':month', date[1])
                   .replace(':day', date[2]);
    }
    link = link.replace(':title', title).replace(':name', name);
    obj.url =  sitedata.baseurl + link;
    if (/\.html?$/.test(link)) {
        obj.link = link;
    } else {
        obj.link = link + ((link[link.length - 1] == '/') ? 'index.html' : '/index.html');
    }
}
