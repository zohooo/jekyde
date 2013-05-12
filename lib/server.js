/**
 * Jekyde - static blog generator, server and writer
 * Copyright (c) 2013 zohooo (MIT Licensed)
 * https://github.com/zohooo/jekyde
 */

var fs = require('fs');
var path = require("path");
var express = require('express');

function start(sitedata, webdir) {
    var app = express();
    var base = sitedata.baseurl;

    app.use(express.bodyParser());

    app.use(base, express.static(webdir));

    app.get(new RegExp('^' + base + 'w$'), function(req, res){
        res.redirect(base + 'w/');
    });
    app.use(base + 'w', express.static(path.normalize(__dirname + '/../writer'), {redirect: true}));

    app.get(base + 'r/posts', function(req, res){
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify(sitedata.posts, function(key, value){
            if (key !== 'previous' && key !== 'next') return value;
        }));
    });
    app.get(base + 'r/post/:filename', function(req, res){
        res.send('fetched');
    });
    app.post(base + 'r/post/:filename', rename);
    app.put(base + 'r/post/:filename', update);
    app.del(base + 'r/post/:filename', remove);

    app.get(base + 'r/pages', function(req, res){
        res.send(sitedata.pages);
    });
    app.post(base + 'r/page/:filename', rename);
    app.put(base + 'r/page/:filename', update);
    app.del(base + 'r/page/:filename', remove);

    var port = sitedata.port;
    app.listen(port, 'localhost');
    console.log('Server running at http://localhost:' + port + base + 'w')
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
    });
}

function update(req, res){
    var name = req.params.filename;
    var data = req.body;
    fs.writeFile('content/' + data.type + '/' + name + '.md', data.source, function (err) {
        if (err) throw err;
        res.send({
            name: name,
            message: 'created or updated'
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
            message: 'deleted'
        });
    });
}

module.exports = {
    start: start
};
