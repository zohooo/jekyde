/**
 * Jekyde - static blog generator, server and writer
 * Copyright (c) 2013 zohooo (MIT Licensed)
 * https://github.com/zohooo/jekyde
 */

var fs = require('fs');
var path = require("path");
var fsextra = require('fs-extra');
var jsyaml = require('js-yaml');
var marked = require('marked');
var swig = require('swig');

var server = require('./server.js');

swig.init({
    allowErrors: true,
    autoescape: false,
    cache: true,
    encoding: 'utf8',
    filters: {},
    root: '.',
    tags: {},
    extensions: {},
    tzOffset: 0
});

var srcdir = 'source', webdir = 'website';
var sitedata = {
    title:          'Simple Blog',
    baseurl:        '/',
    archive_dir:    'archive',
    post_link:      'post/:year/:month/:day/:name.html',
    page_link:      'page/:name',
    paginate:       4,
    port:           4040,
    posts:          [],
    pages:          []
};
var templates = {}

initialize();

function initialize() {
    if (!fs.existsSync(srcdir)) {
        console.log('Initializing default source folder...');
        fsextra.copy((path.normalize(__dirname + '/../sample')), srcdir, function(err){
            if (err) throw err;
            loadConfig();
            generate();
        });
    } else {
      loadConfig();
      generate();
    }
}

function loadConfig() {
    if (fs.existsSync(srcdir + '/config.yml')) {
        var text = fs.readFileSync(srcdir + '/config.yml', 'utf8');
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

function generate() {
    templates['post'] = swig.compileFile(srcdir + '/layout/post.html');
    templates['page'] = swig.compileFile(srcdir + '/layout/page.html');
    templates['index'] = swig.compileFile(srcdir + '/layout/index.html');
    templates['archive'] = swig.compileFile(srcdir + '/layout/archive.html');

    readArticles('post');
    readArticles('page');

    var posts = sitedata.posts;
    for (i=0; i < posts.length; i++) {
        parseMark('post', posts[i]);
    }

    var pages = sitedata.pages;
    for (i=0; i < pages.length; i++) {
        parseMark('page', pages[i]);
    }

    parseHtml();
    copyStatic();
}

function readArticles(type) {
    // type = 'post' or 'page'
    var folder = srcdir + '/' + type;
    var list = sitedata[type + 's'];

    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
        console.log('Please put ' + type + ' files into ' + folder + ' folder!');
        return;
    }
    var files = fs.readdirSync(folder);

    if (!fs.existsSync(webdir)) {
        fs.mkdirSync(webdir);
    }
    if (!fs.existsSync(webdir + '/' + type)) {
        fs.mkdirSync(webdir + '/' + type);
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
        var text = fs.readFileSync(srcdir + '/' + type + '/' + item, 'utf8');
        addSiteData(type, basename, ext, text);
    }
    if (type == 'post') {
        list.sort(comparePosts);
    }

    function addSiteData(type, basename, ext, text) {
        var obj = parseYaml(text);
        if (type == "post") {
            parseDate(obj, basename);
            if (isNaN(obj.date.getTime())) {
                console.log('[Error] Invalid filename "' + basename + ext + '"');
                return;
            }
            obj.id = basename;
            if (list.length > 0) {
                obj.previous = list[list.length - 1];
                list[list.length - 1].next = obj;
            }
        } else {
        var link = type + '/' + basename + '.html';
            obj.link = type + '/' + basename + '.html';
            obj.id = basename + ext;
            obj.name = basename;
        }
        if (!obj.title) obj.title = 'Empty Title';
        setPermalink(obj, type);
        list.push(obj);
    }

    function comparePosts(post1, post2) {
        return post2.date.getTime() - post1.date.getTime();
    }
}

function parseDate(obj, basename) {
    var ar = basename.split('-');
    var re = /^\d\d$/;
    if (!re.test(ar[3]) || !re.test(ar[4])) {
        // jekyll filename format
        if (ar.length > 3) {
            obj.title = basename.slice(ar[0].length + ar[1].length + ar[2].length + 3).replace('-', ' ');
        }
        ar[3] = ar[4] = '00';
    }
    obj.metadate = [ar[0], ar[1], ar[2]];
    obj.date = new Date(ar[0] + '-' + ar[1] + '-' + ar[2] + ' ' + ar[3] + ':' + ar[4]);
}

function setPermalink(obj, type) {
    var link = (type == 'post') ? sitedata.post_link : sitedata.page_link;
    var date = obj.metadate;
    var title = obj.title.toLowerCase().replace(/\s/g, '-');
    var name = obj.name ? obj.name.toLowerCase().replace(/\s/g, '-') : title;
    if (type == 'post') {
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
    var re = /^-{3}([\w\W]+?)(-{3})([\w\W]*)*/, result = re.exec(text);
    var page = {};
    if (result) {
        //console.log(result[3]);
        page = jsyaml.load(result[1]);
        mark = result[3] ? result[3] : '';
        page.source = mark;
    } else {
        page.source = text;
    }
    return page;
}

function parseMark(type, item) {
    // type = 'post' or 'page'
    item.content = marked(escapeTex(item.source));
    var data = {
        site: sitedata,
        content: item.content
    };
    data[type] = item;
    var html = templates[type].render(data);
    fsextra.outputFileSync(webdir + '/' + item.link, html);
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
        fs.writeFileSync(webdir + link, html);
    }

    link = '/' + sitedata.archive_dir + '/index.html';
    html = templates['archive'].render({site: sitedata});
    fsextra.outputFileSync(webdir + link, html);
}

function copyStatic() {
    if (fs.existsSync(srcdir + '/static')) {
        fsextra.copy(srcdir + '/static', webdir + '/static', function(err){
            if (err) throw err;
            server.start(sitedata, webdir);
            readStdin();
        });
    } else {
        server.start(sitedata, webdir);
        readStdin();
    }
}

function readStdin() {
    var stdin = process.stdin;

    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    stdin.on('data', function(key) {
        switch(key) {
            case '\u000D':  // 'enter'
                console.log('Regenerating website...');
                break;
            case '\u0003':  // ctrl-c
            case '\u001B':  // 'escape'
                process.exit();
                break;
            default:
                process.stdout.write(key);
        }
    });
}
