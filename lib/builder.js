/**
 * Jekyde - static blog generator, server and writer
 * Copyright (c) 2013 zohooo (MIT Licensed)
 * https://github.com/zohooo/jekyde
 */

var fs = require('fs');
var path = require('path');
var async = require('async');
var fsextra = require('fs-extra');
var jsyaml = require('js-yaml');
var marked = require('marked');
var swig = require('swig');

var server = require('./server.js');

var cdir = 'content', tdir = 'template', wdir = 'website';

swig.init({
    allowErrors: true,
    autoescape: false,
    cache: true,
    encoding: 'utf8',
    filters: {},
    root: './' + tdir + '/include',
    tags: {},
    extensions: {},
    tzOffset: 0
});

var sitedata = {
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
var templates = {}

function initialize(back) {
    async.each([cdir, tdir], function(dir, callback){
        if (fs.existsSync(dir)) return callback();
        console.log('Initializing default ' + dir + ' folder...');
        fsextra.copy((path.normalize(__dirname + '/../sample/' + dir)), dir, callback);
    }, back);
}

function buildSite(back) {
    loadConfig();
    readFiles();
    writeFiles();
    runPlugins();
    copyFiles(back);
}

function loadConfig() {
    if (fs.existsSync(tdir + '/config.yml')) {
        var text = fs.readFileSync(tdir + '/config.yml', 'utf8');
        var data = jsyaml.load(text);
        for (var x in data) {
            sitedata[x] = data[x];
        }
        var base = sitedata.baseurl;
        if (base[base.length-1] !== '/') {
            console.log('[Warning] baseurl should end with "/"');
            sitedata.baseurl += '/';
        }
        var link1 = sitedata.post_link, link2 = sitedata.page_link;
        if (link1[0] == '/') {
            sitedata.post_link = link1.slice(1);
        }
        if (link2[0] == '/') {
            sitedata.page_link = link2.slice(1);
        }
    }
}

function readFiles() {
    readArticles('post');
    readArticles('page');
}

function readArticles(type) {
    // type = 'post' or 'page'
    var folder = cdir + '/' + type;
    var list = sitedata[type + 's'];

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
        console.log('Please put ' + type + ' files into ' + folder + ' folder!');
        return;
    }
    var files = fs.readdirSync(folder);

    if (!fs.existsSync(wdir)) {
        fs.mkdirSync(wdir);
    }
    if (!fs.existsSync(wdir + '/' + type)) {
        fs.mkdirSync(wdir + '/' + type);
    }

    var i, idx, item, basename, ext;
    for (i = 0; i < files.length; i++) {
        item = files[i];
        idx = item.lastIndexOf('.');
        if (idx > -1) {
            basename = item.slice(0, idx);
            ext = item.slice(idx);
        } else {
            continue;
        }
        var text = fs.readFileSync(cdir + '/' + type + '/' + item, 'utf8');
        pushData(type, basename, text);
    }
    if (type == 'post') sortPosts();
}

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

function pushData(type, basename, text, check) {
    var list = sitedata[type + 's'];
    var obj = parseYaml(text);
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

function moveData(type, basename, newname) {
    var list = sitedata[type + 's'];
    var obj = list[findData(list, basename)];
    parseName(obj, type, newname);
    setPermalink(obj, type);
}

function dropData(type, basename) {
    var list = sitedata[type + 's'];
    var i = findData(list, basename);
    if (i < list.length) list.splice(i, 1);
}

function sortPosts() {
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
        parseDate(obj, basename);
    } else {
        var link = type + '/' + basename + '.html';
        obj.link = type + '/' + basename + '.html';
        obj.name = basename;
    }
    obj.filename = basename;
}

function parseDate(obj, basename) {
    function setDate(a) {
        if (!a[3]) a[3] = '00';
        if (!a[4]) a[4] = '00';
        if (!a[5]) a[5] = '00';
        obj.date = new Date(a[0] + '-' + a[1] + '-' + a[2] + ' ' + a[3] + ':' + a[4] + ':' + a[5]);
        obj.metadate = a;
    }

    // default date format
    var r = [
        /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])-([01]\d|2[0-3])-([0-5]\d)-([0-5]\d)$/,
        /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])-([01]\d|2[0-3])-([0-5]\d)$/,
        /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])$/
    ];
    for (var i = 0; i < r.length; i++) {
        var a = r[i].exec(basename);
        if (a) {
            a = a.slice(1);
            setDate(a);
            return;
        }
    }

    // jekyll date format
    var re = /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])-([\w\W]+)$/;
    var ar = re.exec(basename);
    if (ar) {
        if (!obj.title) obj.title = ar[4].replace('-', ' ');
        ar = ar.slice(1, 4);
        setDate(ar);
        return;
    }

    var date = obj.date;  // date in yaml header
    if (!obj.title) obj.title = basename;

    // string date format
    re = /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
    if (typeof date == 'string') {
        ar = re.exec(date);
        if (ar) {
            ar = ar.slice(1);
            setDate(ar);
            return;
        }
    }

    // utc date format
    if (date instanceof Date) {
        obj.date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
        obj.metadate = dateArray(obj.date);
    }
}

function dateArray(d){
    function pad(n){return n < 10 ? '0' + n : n.toString()}
    return [d.getFullYear(),
        pad(d.getMonth() + 1),
        pad(d.getDate()),
        pad(d.getHours()),
        pad(d.getMinutes()),
        pad(d.getSeconds())];
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

function parseYaml(text) {
    var re = /^---(\n|\r\n|\r)([\w\W]+?)\1---\1([\w\W]*)/, result = re.exec(text);
    var page = {};
    if (result) {
        page = jsyaml.load(result[2]);
        page.head = result[2];
        page.body = result[3];
    } else {
        page.head = '';
        page.body = text;
    }
    return page;
}

function writeFiles() {
    templates['post'] = swig.compileFile('../layout/post.html');
    templates['page'] = swig.compileFile('../layout/page.html');
    templates['index'] = swig.compileFile('../layout/index.html');
    templates['archive'] = swig.compileFile('../layout/archive.html');

    var posts = sitedata.posts;
    for (i=0; i < posts.length; i++) {
        parseMark('post', posts[i]);
    }

    var pages = sitedata.pages;
    for (i=0; i < pages.length; i++) {
        parseMark('page', pages[i]);
    }

    parseHtml();
}

function parseMark(type, item) {
    // type = 'post' or 'page'
    item.content = marked(escapeTex(item.body));
    var data = {
        site: sitedata,
        content: item.content
    };
    data[type] = item;
    var html = templates[type].render(data);
    fsextra.outputFileSync(wdir + '/' + item.link, html);
}

function escapeTex(text) {
    var out = text.replace(/(\${1,2})((?:\\.|[^$])*)\1/g, function(m){
        m = m.replace(/_/g, '\\_')
             .replace(/</g, '\\lt ')
             .replace(/\|/g, '\\vert ')
             .replace(/\[/g, '\\lbrack ')
             .replace(/\\{/g, '\\lbrace ')
             .replace(/\\}/g, '\\rbrace ')
             .replace(/\\\\/g, '\\\\\\\\');
        return m;
    });
    return out;
}

function parseHtml() {
    var posts = sitedata.posts;
    var length = posts.length;
    var p = sitedata.paginate;
    var t = Math.ceil(length / p);
    var paginator = {
            per_page: p,
            total_posts: length,
            total_pages: t
    };
    var data = {
        paginator: paginator,
        site: sitedata
    };
    var baseurl = sitedata.baseurl;
    var dir = baseurl + dir + '/';
    var html, link;

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
        link = (i == 1) ? '/index.html' : '/index' + i + '.html';
        html = templates['index'].render(data);
        fs.writeFileSync(wdir + link, html);
    }

    link = '/' + sitedata.archive_dir + '/index.html';
    html = templates['archive'].render({site: sitedata});
    fsextra.outputFileSync(wdir + link, html);
}

function runPlugins() {
    require('./plugin/website/atom');
}

function copyFiles(back) {
    function copy(dir, excludes, back) {
        var files = fs.readdirSync(dir);
        files = files.filter(function(value){
            return (value[0] != '.') && (excludes.indexOf(value) == -1);
        });
        async.each(files, function(item, back){
            fsextra.copy(dir + '/' + item, wdir + '/' + item, back);
        }, back);
    }
    async.parallel([
        async.apply(copy, cdir, ['page', 'post']),
        async.apply(copy, tdir, ['include', 'layout', 'config.yml'])
    ], back);
}

function runServer() {
    server.start(sitedata, wdir);
}

exports.extend = {
    website: function(task){
        task(sitedata);
    }
};

exports.start = function() {
    async.series([
        async.apply(initialize),
        async.apply(buildSite)
    ], function(err, results){
        if (err) throw err;
        runServer();
    });
}

exports.reload = function() {
    sitedata.posts = [];
    sitedata.pages = [];
    async.series([
        async.apply(initialize),
        async.apply(buildSite)
    ], function(err, results){
        if (err) throw err;
    });
}

exports.update = function(change) {
    var mode = change.mode,
        type = change.type,
        name = change.name;
    switch(mode) {
        case 'create':
        case 'modify':
            pushData(type, name, change.text, true);
            break;
        case 'rename':
            moveData(type, name, change.newname);
            break;
        case 'remove':
            dropData(type, name);
            break;
    }
    if (type == 'post') sortPosts();
    writeFiles();
    console.log('Website has been updated for file "' + name + '.md"');
}
