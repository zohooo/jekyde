
jekyde.extend.website(function(site){
    var posts = site.posts.slice(0, 5);

    var content = posts.reduce(function(previous, current){
        previous.push([
        '    <entry>',
        '         <title><![CDATA[' + current.title + ']]></title>',
        '         <link href="' + site.host + current.url + '"></link>',
        '         <updated>' + current.date.toISOString() + '</updated>',
        '         <id>' + current.filename + '</id>',
        '         <summary type="html"><![CDATA[' + current.content + ']]></summary>',
        '    </entry>'
        ].join('\n'));
        return previous;
    }, []).join('\n');

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
