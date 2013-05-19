
jekyde.extend.content(function(site, text){
    return text.replace(
        /(\n|\r\n|\r)\^\^ *gist +(\d+)\1/g,
        '<script src="https://gist.github.com/$2.js"></script>'
    );
});
