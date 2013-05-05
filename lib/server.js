
var path = require("path");
var express = require('express');

function start(sitedata, webdir) {
    var app = express();
    var base = sitedata.baseurl;

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
    app.get(base + 'r/posts/:id', function(req, res){
        res.send({
            id: req.params.id,
            content: 'get some post'
        });
    });
    app.post(base + 'r/posts', function(req, res){
        res.send('create new post');
    });
    app.put(base + 'r/posts/:id', function(req, res){
        res.send({
            id: req.params.id,
            content: 'update some post'
        });
    });

    app.get(base + 'r/pages', function(req, res){
        res.send(sitedata.pages);
    });

    var port = sitedata.port;
    app.listen(port, 'localhost');
    console.log('Server running at http://localhost:' + port + base + 'w')
}

module.exports = {
    start: start
};
