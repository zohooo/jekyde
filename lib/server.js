
var path = require("path");
var express = require('express');

function start(sitedata, webdir) {
    var app = express();

    app.use(express.static(webdir));
    app.use('/w', express.static(path.normalize(__dirname + '/../writer')));

    app.get('/r/posts', function(req, res){
        res.set('Content-Type', 'application/json; charset=utf-8');
        res.send(JSON.stringify(sitedata.posts, function(key, value){
            if (key !== 'previous' && key !== 'next') return value;
        }));
    });
    app.get('/r/posts/:id', function(req, res){
        res.send({
            id: req.params.id,
            content: 'get some post'
        });
    });
    app.post('/r/posts', function(req, res){
        res.send('create new post');
    });
    app.put('/r/posts/:id', function(req, res){
        res.send({
            id: req.params.id,
            content: 'update some post'
        });
    });

    app.get('/r/pages', function(req, res){
        res.send(sitedata.pages);
    });

    app.listen(4040, 'localhost');
    console.log('Server running at http://localhost:4040/w')
}

module.exports = {
    start: start
};
