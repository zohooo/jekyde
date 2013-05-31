
jekyde.extend.content(function(site, text){
    return text.replace(
        /\n\^\^ *gist +(\w+)\n/g,
        '<script src="https://gist.github.com/$1.js"></script>'
    );
});
