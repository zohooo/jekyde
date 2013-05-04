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
    title: 'Simple Blog',
    baseurl: '/',
    posts: [],
    pages: []
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
    }
}

function generate() {
    templates['post'] = swig.compileFile(srcdir + '/layout/post.html');
    templates['page'] = swig.compileFile(srcdir + '/layout/page.html');
    templates['index'] = swig.compileFile(srcdir + '/layout/index.html');

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

    var i, idx, item, name, ext;
    for (i = 0; i < files.length; i++) {
        item = files[i];
        idx = item.lastIndexOf('.');
        if (idx > -1) {
            name = item.slice(0, idx);
            ext = item.slice(idx);
        } else {
            continue;
        }
        var text = fs.readFileSync(srcdir + '/' + type + '/' + item, 'utf8');
        addSiteData(type, name, ext, text);
    }

    function addSiteData(type, name, ext, text) {
        var data = parseYaml(text);
        var link = type + '/' + name + '.html';
        var url = sitedata.baseurl + link;
        data.link = link;
        data.url = url;
        if (type == "post") {
            data.id = name;
            if (list.length > 0) {
                data.previous = list[list.length - 1];
                list[list.length - 1].next = data;
            }
        } else {
            data.id = name + ext;
        }
        list.push(data);
    }
}

function parseYaml(text) {
    var re = /^-{3}([\w\W]+?)(-{3})([\w\W]*)*/, result = re.exec(text);
    var page = {};
    if (result) {
        //console.log(result[3]);
        page = jsyaml.load(result[1]);
        mark = result[3] ? result[3] : '';
        page.content = mark;
    } else {
        page.content = text;
    }
    return page;
}

function parseMark(type, item) {
    // type = 'post' or 'page'
    var content = marked(escapeTex(item.content));
    var data = {
        site: sitedata,
        content: content
    };
    data[type] = item;
    var html = templates[type].render(data);
    fs.writeFileSync(webdir + '/' + item.link, html);
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
    sitedata.posts.reverse();
    var data = {
        page: sitedata.pages,
        post: sitedata.posts,
        site: sitedata
    };
    var html = templates['index'].render(data);
    fs.writeFileSync(webdir + '/index.html', html);
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
