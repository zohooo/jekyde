/**
 * Jekyde - static blog builder, server and writer
 * Copyright (c) 2013 zohooo (MIT Licensed)
 * https://github.com/zohooo/jekyde
 */

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var express = require('express');

var builder = require('../builder/builder.js');
var querier = require('../builder/utility/querier.js');

function start(site, webdir) {
    var app = express();
    var base = site.root;

    if (site.password) {
        var data = loadHash();
        if (data.salt && data.hash) {
            app.set('salt', data.salt);
            app.set('hash', data.hash);
        }
    }

    app.use(express.bodyParser());
    app.use(express.cookieParser());

    app.use(base, express.static(webdir));
    app.get(new RegExp('^' + base + '[wW]$'), function(req, res){
        res.redirect(base + 'w/');
    });
    app.use(base + 'w', express.static(path.normalize(__dirname + '/../writer'), {redirect: true}));

    app.get(base + 'r/auth', function(req, res){
        res.set('Expires', '-1');
        if (!site.password) return res.send('none');
        if (req.cookies && req.cookies.token) {
            if (req.cookies.token == app.get('token')) {
                return res.send('connected');
            } else {
                res.clearCookie('token', {path: base + 'r'});
            }
        }
        if (app.get('hash')) {
            res.send('required');
        } else {
            res.send('empty');
        }
    });
    app.post(base + 'r/auth/in', function(req, res){
        var salt = app.get('salt');
        var hash = app.get('hash');
        var pass = req.body.pass;
        var code, token;
        if (salt && hash) {
            if (checkHash(salt, hash, pass)) {
                code = 200;
            } else {
                code = 401;
            }
        } else {
            var data = makeHash(pass);
            app.set('salt', data.salt);
            app.set('hash', data.hash);
            code = 200;
        }
        if (code == 200) {
            token = crypto.randomBytes(64).toString('hex');
            app.set('token', token);
            res.cookie('token', token, {path: base + 'r', expires: new Date(Date.now() + 24*3600000)});
        }
        res.send(code);
    });
    app.post(base + 'r/auth/out', function(req, res){
        res.clearCookie('token', {path: base + 'r'});
    });
    app.all(base + 'r/*', function(req, res, next){
        if (!site.password || (req.cookies && req.cookies.token == app.get('token'))) {
            next();
        } else {
            res.send(401);
        }
    });

    app.get(new RegExp('^' + base + 'r/(posts|pages)$'), function(req, res){
        var type = req.params[0];
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.set('Expires', '-1');
        res.send(querier.getAll(type));
    });
    app.get(new RegExp('^' + base + 'r/(post|page)/(\\d+)$'), function(req, res){
        var type = req.params[0], index = req.params[1];
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.set('Expires', '-1');
        res.send(querier.getOne(type + 's', index));
    });
    app.all(new RegExp('^' + base + 'r/(post|page)/([\\w\\W]+)$'), function(req, res){
        var type = req.params[0], name = req.params[1], body = req.body;
        switch (req.method) {
            case 'POST':
                res.send(rename(type, name, body));
                break;
            case 'PUT':
                res.send(modify(type, name, body));
                break;
            case 'DELETE':
                res.send(remove(type, name, body));
                break;
            default:
                res.send(400);
        }
    });

    app.get(base + 'r/config/:key', function(req, res){
        var key = req.params.key;
        var result = {}; result[key] = site[key];
        res.json(result);
    });

    var port = process.env.PORT || process.env.VCAP_APP_PORT || site.port;
    if (site.password) {
        app.listen(port);
    } else {
        app.listen(port, 'localhost');
    }
    console.log('Please open your browser and visit http://localhost:' + port + base + 'w');
    readStdin();
}

function loadHash() {
    var output = {};
    if (fs.existsSync('./package.json')) {
        var input = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        if (input.salt && input.hash) {
            output.salt = input.salt;
            output.hash = input.hash;
        }
    }
    return output;
}

function makeHash(password) {
    if (fs.existsSync('./package.json')) {
        var output = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    } else {
        var output = {};
    }
    var salt = crypto.randomBytes(64).toString('base64');
    var hash = shaHash(password + salt);
    output.salt = salt; output.hash = hash;
    fs.writeFileSync('./package.json', JSON.stringify(output, null, 4), 'utf8');
    return {salt: salt, hash: hash};
}

function checkHash(salt, hash, password) {
    var validHash = shaHash(password + salt);
    return hash === validHash;
}

function shaHash(string) {
    return crypto.createHash('sha512').update(string).digest('hex');
}

function readStdin() {
    var stdin = process.stdin;
    if (!stdin.setRawMode) return;

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
    console.log('Press Esc to stop server, or press Enter to regenerate website\n');
}

function rename(type, name, data) {
    var dir = 'content/' + type + '/';
    var newname = data.newname;
    try {
        fs.renameSync(dir + name + '.md', dir + newname + '.md');
        builder.update({
            mode: 'rename',
            type: type,
            name: name,
            newname: newname
        });
        return 200;
    } catch (err) {
        console.log(err);
        return 400;
    }
}

function modify(type, name, data) {
    // created or modified
    var source = data.source;
    try {
        fs.writeFileSync('content/' + type + '/' + name + '.md', source);
        builder.update({
            mode: 'modify',
            type: type,
            name: name,
            text: source
        });
        return 200;
    } catch (err) {
        console.log(err);
        return 400;
    }
}

function remove(type, name, data){
    try {
        fs.unlinkSync('content/' + type + '/' + name + '.md');
        builder.update({
            mode: 'remove',
            type: type,
            name: name,
        });
        return 200;
    } catch (err) {
        console.log(err);
        return 400;
    }
}

module.exports = {
    start: start
};
