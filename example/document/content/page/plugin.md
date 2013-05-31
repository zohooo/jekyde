---
title: Make Plugins
---

You may extend Jekyde through the following three types of plugins.

1. Content plugins for extending Markdown syntax
2. Template plugins for creating new Swig tags
3. Website plugins for generating more webpages

Content Plugins
---------------

The following code is the builtin gist plugin:

```javascript
jekyde.extend.content(function(site, text){
    return text.replace(
        /\n\^\^ *gist +(\w+)\n/g,
        '<script src="https://gist.github.com/$1.js"></script>'
    );
});
```

With this gist plugin, you can insert a gist in your markdown file with a single line like this:

    ^^gist 12345678

Template Plugins
----------------

The following code is the builtin ctime plugin:

```javascript
jekyde.extend.template('ctime', function(args, content){
    return (new Date()).toISOString();
}, false);
```

With this plugin, you can insert current time into your template file with this code:

    {{ ctime }}

Website Plugins
---------------

The following code is part of the builtin atom plugin:

```javascript
jekyde.extend.website(function(site){
    var atom = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    '    <title><![CDATA[' + site.title + ']]></title>',
    '    <link href="' + site.host + site.root + 'atom.xml" ref="self"/>',
    '    <link href="' + site.host + site.root + '"/>',
    '    <id>' + site.host + site.root + '</id>',
    '    <updated>' + new Date().toISOString() + '</updated>',
    content,
    '</feed>'
    ].join('\n');
    return [['atom.xml', atom]];
});
```

This plugin generates atom feed file `atom.xml` inside root folder.

Your Plugins
------------

You may put your plugins into `template/plugin` folder.


