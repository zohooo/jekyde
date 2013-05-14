/**
 * Jekyde - static blog generator, server and writer
 * Copyright (c) 2013 zohooo (MIT Licensed)
 * https://github.com/zohooo/jekyde
 */

var fs = require('fs');
var path = require("path");
var express = require('express');

var builder = require('./builder.js');

function start(sitedata, webdir) {
    var app = express();
    var base = sitedata.baseurl;

    app.use(express.bodyParser());

    app.use(base, express.static(webdir));

    app.get(new RegExp('^' + base + '[wW]$'), function(req, res){
        res.redirect(base + 'w/');
    });
    app.use(base + 'w', express.static(path.normalize(__dirname + '/../writer'), {redirect: true}));

    app.get(base + 'r/posts', function(req, res){
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.set('Expires', '-1');
        res.send(JSON.stringify(sitedata.posts, function(key, value){
            if (key !== 'previous' && key !== 'next') return value;
        }));
    });
    app.get(base + 'r/post/:filename', function(req, res){
        res.send('fetched');
    });
    app.post(base + 'r/post/:filename', rename);
    app.put(base + 'r/post/:filename', modify);
    app.del(base + 'r/post/:filename', remove);

    app.get(base + 'r/pages', function(req, res){
        res.set('Expires', '-1');
        res.send(sitedata.pages);
    });
    app.post(base + 'r/page/:filename', rename);
    app.put(base + 'r/page/:filename', modify);
    app.del(base + 'r/page/:filename', remove);

    app.get(base + 'r/config/:key', function(req, res){
        var key = req.params.key;
        var result = {}; result[key] = sitedata[key];
        res.json(result);
    });

    var port = sitedata.port;
    app.listen(port, 'localhost');
    console.log(['',
                 'Website was successfully generated and web server is running.',
                 'Press Esc to stop server, or press Enter to regenerate website.',
                 'Please open your browser and visit http://localhost:' + port + base + 'w',
                 ''].join('\n'));
    readStdin();
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
                builder.reload();
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

function rename(req, res){
    var data = req.body;
    var dir = 'content/' + data.type + '/';
    var oldname = req.params.filename;
    fs.rename( dir + oldname + '.md', dir + data.newname + '.md', function(err) {
        if (err) throw err;
        res.send({
            name: data.newname,
            message: 'renamed'
        });
        builder.update({
            mode: 'rename',
            type: data.type,
            name: oldname,
            newname: data.newname
        });
    });
}

function modify(req, res){
    var name = req.params.filename;
    var data = req.body;
    fs.writeFile('content/' + data.type + '/' + name + '.md', data.source, function (err) {
        if (err) throw err;
        res.send({
            name: name,
            message: 'created or modified'
        });
        builder.update({
            mode: 'modify',
            type: data.type,
            name: name,
            text: data.source
        });
    });
}

function remove(req, res){
    var name = req.params.filename;
    var data = req.body;
    fs.unlink('content/' + data.type + '/' + name + '.md', function(err) {
        if (err) throw err;
        res.send({
            name: name,
            message: 'removed'
        });
        builder.update({
            mode: 'remove',
            type: data.type,
            name: name
        });
    });
}

module.exports = {
    start: start
};
