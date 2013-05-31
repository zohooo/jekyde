
jekyde.extend.content(function(site, text){
    return text.replace(/\n\^\^ *jsfiddle +([\w ,%]+)\n/g, function(m, $1){
        var a = $1.split(' '),
            id = a[0],
            tabs = (a[1] && a[1] != 'default') ? a[1] : 'js,resources,html,css,result',
            skin = a[2] ? a[2] : 'light',
            width = a[3] ? a[3] : '100%',
            height = a[4] ? a[4] : '300px';
        return [
        '<iframe',
        '    width="' + width + '" height="' + height + '"',
        '    src="http://jsfiddle.net/' + id + '/embedded/' + tabs + '/' + skin + '/">',
        '</iframe>\n'
        ].join('\n');
    });
});
