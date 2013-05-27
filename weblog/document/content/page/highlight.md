---
title: Code Highlighting
---

Jekyde supports code highlighting. For example, writing the following code

<pre>
```javascript
var express = require('express');
var app = express();
app.get('/', function(req, res){
  res.send('hello world');
});
app.listen(4040);
```
</pre>

will get the result:

```javascript
var express = require('express');
var app = express();
app.get('/', function(req, res){
  res.send('hello world');
});
app.listen(4040);
```
