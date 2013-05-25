/**
 * Jekyde - static blog generator, server and writer
 * Copyright (c) 2013 zohooo (MIT Licensed)
 * https://github.com/zohooo/jekyde
 */

var fs = require('fs');
var path = require('path');
var async = require('async');
var fsextra = require('fs-extra');
var yaml = require('./converter/yaml');
var markdown = require('./converter/markdown');
var updater = require('./utility/updater.js');
var server = require('./server.js');

var cdir = 'content', tdir = 'template', wdir = 'website';
var sitedata = updater.sitedata;

function initialize(back) {
    async.each([cdir, tdir], function(dir, callback){
        if (fs.existsSync(dir)) return callback();
        console.log('Initializing default ' + dir + ' folder...');
        fsextra.copy((path.normalize(__dirname + '/../weblog/default/' + dir)), dir, callback);
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
        var data = yaml.load(text);
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
                updater.pushData(type, basename, text);
                back();
            });
        }, function(err){
            if (err) throw err;
            if (type == 'post') updater.sortData();
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
            updater.pushData(type, name, change.text, true);
            break;
        case 'rename':
            updater.moveData(type, name, change.newname);
            break;
        case 'remove':
            updater.dropData(type, name);
            break;
    }
    if (type == 'post') updater.sortData();
    async.series([
        async.apply(renderFiles),
        async.apply(writeFiles)
    ], function(err){
        if (err) throw err;
        console.log('Website has been updated for file "' + name + '.md"');
    });
}

global.jekyde = module.exports;
