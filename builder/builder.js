/**
 * Jekyde - static blog builder, server and writer
 * Copyright (c) 2013 zohooo (MIT Licensed)
 * https://github.com/zohooo/jekyde
 */

var fs = require('fs');
var path = require('path');
var async = require('async');
var fsextra = require('fs-extra');

var yaml = require('./converter/yaml.js');
var markdown = require('./converter/markdown.js');
var updater = require('./utility/updater.js');
var server = require('../server/server.js');

var cdir = 'content', tdir = 'template', wdir = 'website';
var site = updater.site;

function initialize(back) {
    async.each([cdir, tdir], function(dir, callback){
        if (fs.existsSync(dir)) return callback();
        console.log('Initializing default ' + dir + ' folder...');
        fsextra.copy((path.normalize(__dirname + '/../example/default/' + dir)), dir, callback);
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
            site[x] = data[x];
        }
        var base = site.root;
        if (base[base.length-1] !== '/') {
            console.log('[Warning] root should end with "/"');
            site.root += '/';
        }
        var link1 = site.post_link, link2 = site.page_link;
        if (link1[0] == '/') {
            site.post_link = link1.slice(1);
        }
        if (link2[0] == '/') {
            site.page_link = link2.slice(1);
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
        async.each(site[type], function(item, back){
            var content = item.body;
            item.content = markdown(site, content);
            if (type == 'posts') {
                var excerpt;
                var idx = content.search(/\n<!-- *more *-->\n/);
                if (idx == -1) {
                    idx = content.indexOf('\n\n');
                }
                if (idx != -1) {
                    excerpt = content.slice(0, idx);
                } else {
                    excerpt = content;
                }
                item.excerpt = markdown(site, excerpt);
            }
            back();
        }, back);
    }
    async.parallel([
        async.apply(render, 'posts'),
        async.apply(render, 'pages')
    ], back);
}

function writeFiles(back) {
    var outputs = [];
    exports.plugins.website.forEach(function(task){
        outputs = outputs.concat(task(site, exports.envs));
    });
    async.each(outputs, function(item, back){
        fsextra.outputFile(wdir + '/' + item[0], item[1], back);
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

function jsonPackage() {
    var input, output;
    input = JSON.parse(fs.readFileSync(path.normalize(__dirname + '/../package.json'), 'utf8'));
    if (fs.existsSync('./package.json')) {
        output = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    } else {
        output = {};
    }
    output.name = 'jekyde';
    output.version = input.version;
    output['private'] = true;
    output.main = 'node_modules/jekyde/jekyde';
    output.scripts = {
        start: 'node node_modules/jekyde/jekyde'
    };
    output.engines = input.engines;
    output.dependencies = {
        jekyde: input.version
    }
    fs.writeFileSync('./package.json', JSON.stringify(output, null, 4), 'utf8');
}

function runServer() {
    server.start(site, wdir);
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
        jsonPackage();
        runServer();
    });
}

exports.reload = function() {
    site.posts = [];
    site.pages = [];
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
