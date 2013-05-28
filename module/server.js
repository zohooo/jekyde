/**
 * Jekyde - static blog generator, server and writer
 * Copyright (c) 2013 zohooo (MIT Licensed)
 * https://github.com/zohooo/jekyde
 */

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var express = require('express');

var builder = require('./builder.js');

function start(site, webdir) {
    var app = express();
    var base = site.root;

    app.use(express.bodyParser());
    app.use(express.cookieParser());

    app.use(base, express.static(webdir));
    app.get(new RegExp('^' + base + '[wW]$'), function(req, res){
        res.redirect(base + 'w/');
    });
    app.use(base + 'w', express.static(path.normalize(__dirname + '/../writer'), {redirect: true}));

    app.get(base + 'r/auth', function(req, res){
        if (!site.password) return res.send('none');
        if (req.cookies && req.cookies.token) {
            if (req.cookies.token == app.get('token')) {
                return res.send('connected');
            } else {
                res.clearCookie('token', {path: '/r'});
            }
        }
        if (app.get('auth')) {
            res.send('required');
        } else {
            res.send('empty');
        }
    });
    app.post(base + 'r/auth/in', function(req, res){
        var auth = app.get('auth');
        var pass = req.body.pass;
        var code, token;
        if (auth) {
            if (auth === pass) {
                code = 200;
            } else {
                code = 401;
            }
        } else {
            app.set('auth', pass);
            code = 200;
        }
        if (code == 200) {
            token = crypto.randomBytes(64).toString('hex');
            app.set('token', token);
            res.cookie('token', token, {path: '/r'});
        }
        res.send(code);
    });
    app.post(base + 'r/auth/out', function(req, res){
        res.clearCookie('token', {path: '/r'});
    });
    app.all(base + 'r/*', function(req, res, next){
        if (!site.password || (req.cookies && req.cookies.token == app.get('token'))) {
            next();
        } else {
            res.send(401);
        }
    });

    app.get(base + 'r/posts', function(req, res){
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.set('Expires', '-1');
        res.send(JSON.stringify(site.posts, function(key, value){
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
        res.send(site.pages);
    });
    app.post(base + 'r/page/:filename', rename);
    app.put(base + 'r/page/:filename', modify);
    app.del(base + 'r/page/:filename', remove);

    app.get(base + 'r/config/:key', function(req, res){
        var key = req.params.key;
        var result = {}; result[key] = site[key];
        res.json(result);
    });

    var port = site.port;
    app.listen(port, 'localhost');
    console.log('Please open your browser and visit http://localhost:' + port + base + 'w\n'
              + 'Press Esc to stop server, or press Enter to regenerate website\n');
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
