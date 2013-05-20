
var marked = require('marked');
var hljs = require('highlight.js');
var builder = require('../builder');

var alias = [
    ['latex', 'tex'],
    ['html', 'xml'],
    ['js', 'javascript'],
    ['coffee', 'coffeescript'],
    ['rb', 'ruby'],
    ['py', 'python'],
    ['pl', 'perl']
];

marked.setOptions({
    langPrefix: 'lang-',
    highlight: function(code, lang) {
        if (!lang || lang == 'plain') return code;
        alias.some(function(v){
            if (lang == v[0]) {
                lang = v[1];
                return true;
            }
        });
        try {
            var result = hljs.highlight(lang, code).value;
        } catch(e) {
            console.log('Warning: Unknown highlight language ' + lang + '!');
            var result = hljs.highlightAuto(code).value;
        }
        return result;
    }
});

module.exports = function(site, text) {
    builder.plugins.content.forEach(function(task){
        text = task(site, text);
    });
    return marked(text);
}
