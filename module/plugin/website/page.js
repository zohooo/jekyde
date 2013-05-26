
var swig = require('../../converter/swig');

jekyde.extend.website(function(site){
    var outputs = [];
    var pages = site.pages;
    for (var i = 0; i < pages.length; i++) {
        var item = pages[i];
        var data = {
            site: site,
            article: item,
            page: true
        };
        var html = swig('page', data);
        outputs.push([item.link, html]);
    }
    return outputs;
});
