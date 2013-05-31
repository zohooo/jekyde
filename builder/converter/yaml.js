
var jsyaml = require('js-yaml');

exports.parse = function(text) {
    text = text.replace(/\r\n|\r/g, '\n');
    var re = /^---\n([\w\W]+?)\n---\n([\w\W]*)/, result = re.exec(text);
    var page = {};
    if (result) {
        page = jsyaml.load(result[1]);
        page.head = result[1];
        page.body = result[2];
    } else {
        page.head = '';
        page.body = text;
    }
    return page;
}

exports.load = function(head) {
    return jsyaml.load(head);
}
