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
var datetitle = require('./utility/datetitle');
var markdown = require('./converter/markdown');
var server = require('./server.js');

var cdir = 'content', tdir = 'template', wdir = 'website';

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

function initialize(back) {
    async.each([cdir, tdir], function(dir, callback){
        if (fs.existsSync(dir)) return callback();
        console.log('Initializing default ' + dir + ' folder...');
        fsextra.copy((path.normalize(__dirname + '/../weblog/' + dir)), dir, callback);
    }, back);
}

function buildSite(back) {
    loadConfig();
    loadPlugins();
    async.series([
        async.apply(readFiles),
        async.apply(renderFiles),
        async.apply(writeFiles),
        async.apply(copyFiles)
    ], back);
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

function loadPlugins() {
    function loadAll(dir) {
        if (!fs.existsSync(dir)) return;
        var files = fs.readdirSync(dir);
        files.forEach(function(item){
            require(dir + '/' + item);
        });
    }
    loadAll(__dirname + '/plugin/content');
    loadAll(__dirname + '/plugin/template');
    loadAll(__dirname + '/plugin/website');
    loadAll(tdir + '/plugin');
}

function readFiles(back) {
    function read(type, back) {
        var folder = cdir + '/' + type;
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
            console.log('Please put ' + type + ' files into ' + folder + ' folder!');
            return back();
        }
        var files = fs.readdirSync(folder);
        async.each(files, function(item, back){
            var idx, basename, ext;
            idx = item.lastIndexOf('.');
            if (idx > -1) {
                basename = item.slice(0, idx);
                ext = item.slice(idx);
            } else back();
            fs.readFile(cdir + '/' + type + '/' + item, 'utf8', function(err, text){
                if (err) throw err;
                pushData(type, basename, text);
                back();
            });
        }, function(err){
            if (err) throw err;
            if (type == 'post') sortPosts();
            back();
        });
    }
    async.parallel([
        async.apply(read, 'post'),
        async.apply(read, 'page')
    ], back);
}

function renderFiles(back) {
    function render(type, back){
        async.each(sitedata[type], function(item, back){
            item.content = markdown(sitedata, item.body);
            back();
        }, back);
    }
    async.parallel([
        async.apply(render, 'posts'),
        async.apply(render, 'pages')
    ], back);
}

function writeFiles(back) {
    async.each(exports.plugins.website, function(task, back){
        task(sitedata, exports.envs);
        back();
    }, back);
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
        async.apply(copy, tdir, ['include', 'layout', 'plugin', 'config.yml'])
    ], back);
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

function runServer() {
    server.start(sitedata, wdir);
}

exports.envs = {
    cdir: cdir,
    tdir: tdir,
    wdir: wdir
}

exports.plugins = {
    content: [],
    template: {},
    website: []
};

exports.extend = {
    content: function(task){
        exports.plugins.content.push(task);
    },
    template: function(tag, task, ends){
        exports.plugins.template[tag] = function(indent, parser){
            var content = this.tokens ? this.tokens.join('') : '';
            var result = task(this.args, content)
                        .replace(/\\/g, '\\\\')
                        .replace(/"/g, '\\"')
                        .replace(/\n/g, '\\n')
                        .replace(/\r/g, '\\r');
            return '_output += "' + result + '";\n';
        };
        if (ends) exports.plugins.template[tag].ends = true;
    },
    website: function(task){
        exports.plugins.website.push(task);
    }
};

exports.start = function() {
    var t1 = new Date();
    async.series([
        async.apply(initialize),
        async.apply(buildSite)
    ], function(err, results){
        if (err) throw err;
        var t2 = new Date();
        console.log('\nYour website has been successfully generated in ' + (t2 - t1) / 1000 + ' seconds');
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
    writeFiles(function(err){
        if (err) throw err;
        console.log('Website has been updated for file "' + name + '.md"');
    });
}

global.jekyde = module.exports;
