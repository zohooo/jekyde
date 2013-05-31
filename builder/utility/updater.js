
var datetitle = require('./datetitle');
var yaml = require('../converter/yaml');

var site = exports.site = {
    title:          'Simple Blog',
    subtitle:       'A static blog',
    host:           'http://localhost',
    root:           '/',
    archive_dir:    'archive',
    category_dir:   'category',
    tag_dir:        'tag',
    post_link:      'post/:year/:month/:day/:name.html',
    page_link:      'page/:name',
    paginate:       10,
    latex:          false,
    subscribe:      true,
    port:           4040,
    password:       false,
    posts:          [],
    pages:          [],
    categories:     {},
    tags:           {}
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
    var list = site[type + 's'];
    var obj = yaml.parse(text);
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
    var list = site[type + 's'];
    var obj = list[findData(list, basename)];
    parseName(obj, type, newname);
    setPermalink(obj, type);
}

exports.dropData = function(type, basename) {
    var list = site[type + 's'];
    var i = findData(list, basename);
    if (i < list.length) list.splice(i, 1);
}

exports.sortData = function() {
    sortPosts();
    setCategoryTag();
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
    var link = (type == 'post') ? site.post_link : site.page_link;
    var title = obj.title.toLowerCase().replace(/\s/g, '-');
    var name = obj.name ? obj.name.toLowerCase().replace(/\s/g, '-') : title;
    if (type == 'post') {
        var date = obj.metadate;
        link = link.replace(':year', date[0])
                   .replace(':month', date[1])
                   .replace(':day', date[2]);
    }
    link = link.replace(':title', title).replace(':name', name);
    obj.url =  site.root + link;
    if (/\.html?$/.test(link)) {
        obj.link = link;
    } else {
        obj.link = link + ((link[link.length - 1] == '/') ? 'index.html' : '/index.html');
    }
}

function sortPosts() {
    var posts = site['posts'];
    posts.sort(function(post1, post2) {
        return post2.date.getTime() - post1.date.getTime();
    });
    posts.forEach(function(post, index, list){
        post.next = (index > 0) ? list[index - 1] : null;
        post.previous = (index < list.length) ? list[index + 1] : null;
    });
}

function setCategoryTag() {
    function set(post, name) {
        var c = post[name];
        if (typeof c == 'string') post[name] = c = [c];
        if (c instanceof Array) {
            c.forEach(function(item){
                if (site[name][item]) {
                    site[name][item].push(post);
                } else {
                    site[name][item] = [post];
                }
            });
        }
    }
    site.categories = {}; site.tags = {};
    site.posts.forEach(function(post){
        if (post.category) {
            post.categories = post.category;
            delete post.category;
        }
        set(post, 'categories');
        set(post, 'tags');
    });
}
