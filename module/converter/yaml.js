
var jsyaml = require('js-yaml');

exports.parse = function(text) {
    var re = /^---(\n|\r\n|\r)([\w\W]+?)\1---\1([\w\W]*)/, result = re.exec(text);
    var page = {};
    if (result) {
        page = jsyaml.load(result[2]);
        page.head = result[2];
        page.body = result[3];
    } else {
        page.head = '';
        page.body = text;
    }
    return page;
}

exports.load = function(head) {
    return jsyaml.load(head);
}
