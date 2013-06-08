
(function() {

if (!window.console) window.console = {log : function() {}};

var code = document.getElementById('codearea');
var show = document.getElementById('showarea');
var writer = {
    type: (location.search == '?page') ? 'page' : 'post',
    list: null,
    start: 0,
    limit: 15,
    index: null,
    name: null,
    text: ''
};

$(function() {
    $('#nav-' + writer.type).addClass('current');
    doResize();
    signIn();
});

$(window).resize(function() {
    doResize();
});

function doResize() {
    var ht = $(window).height() - $('#header').height();
    var wd = $(window).width() / 2;
    $('#file-edit').height(ht);
    $('#codewrap').height(ht);
    $('#codearea').height(ht);
    $('#showwrap').height(ht);
    $('#showarea').height(ht);
    $('#codewrap').width(wd);
    $('#showwrap').width(wd);
}

function signIn() {
    $.get('../r/auth', function(auth){
        var info, pass;
        switch (auth) {
            case 'none':
            case 'connected':
                return initWriter();
            case 'empty':
                info = 'Please setup your password:';
                break;
            case 'required':
                info = 'Please enter your password:';
                break;
        }
        while (!pass) {
            pass = window.prompt(info, '');
        }
        $.post('../r/auth/in', {pass: pass})
         .done(initWriter)
         .fail(function(){alert('Wrong Password!')});
    });
}

function initWriter() {
    initBrowser();
    bindHandler();
    loadMathJax();
}

function initBrowser() {
    var url = '../r/' + writer.type + 's';
    $.get(url, function(items){
        writer.list = items;
        writer.start = 0;
        showFiles();
        $('#file-list').fadeIn();
        $('#button-new').show();
    });
}

function bindHandler() {
    if (history.pushState) {
        window.onpopstate = initBrowser;
    }
    $('#file-list').click(function(e){
        var $target = $(e.target);
        if ($target.is('span')) {
            writer.index = $target.parent().parent().attr('data-i');
            var article = writer.list[writer.index];
            writer.name = article.filename;
            writer.text = '---\n' + article.head + '\n---\n' + article.body;
            if ($target.hasClass('item-edit')) {
                if (history.pushState) {
                    history.pushState({}, '', location.href + '#edit');
                }
                initEditor();
            } else if ($target.hasClass('item-name')) {
                fileRename($target.attr('title'));
            } else if ($target.hasClass('item-delete')) {
                fileDelete();
            } else if ($target.hasClass('newer')) {
                writer.start -= writer.limit;
                showFiles();
            } else if ($target.hasClass('older')) {
                writer.start += writer.limit;
                showFiles();
            }
        }
    });
    $('#button-new').click(function(e){
        function dateString(){
            var d = new Date();
            function pad(n){return n < 10 ? '0' + n : n}
            return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' '
                 + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
        }
        var rand = randomString(4);
        var name = window.prompt('Please enter new page name:', 'name-' + rand + '.md');
        if (!name) return;
        name = (name.slice(-3) == '.md') ? name.slice(0,-3) : name;
        if (findFile(name)) {
            alert('The same filename already exists!');
            return;
        }
        writer.name = name;
        writer.text = '---\ntitle: Some Title ' + rand + '\ndate: ' + dateString() + '\n---\n\nWrite here';
        initEditor();
    });
    $('#button-save').click(function(e){
        var url = '../r/' + writer.type + '/' + writer.name;
        var data = {
            type: writer.type,
            filename: writer.name,
            source: code.value
        };
        $.ajax({
            type: 'PUT',
            url: url,
            data: data,
            dataType: "json",
            success: function(data) {
                console.log(data);
                initBrowser();
            }
        });
    });
}

function showFiles() {
    $('#file-edit').hide();
    $('#button-save').hide();
    var start = writer.start, limit = writer.limit;
    var items = writer.list.slice(start, start + limit);
    var content = '<table>';
    $.each(items, function(i, v){
        var a = v.metadate;
        var date = a[0] + '-' + a[1] + '-' + a[2] + ' ' + a[3] + ':' + a[4];
        var name = v.filename + '.md';
        var arrow = '';
        if (i == 0 && start > 0) arrow = '<span class="newer">&uarr;</span>';
        if (i == limit - 1 && start + limit < writer.list.length) arrow = '<span class="older">&darr;</span>';
        content += '<tr data-i="' + (start + i) + '">'
                  + '<td><span class="item-date">' + date + '</span></td>'
                  + '<td><span class="item-title">' + v.title + '</span></td>'
                  + '<td><span class="item-name" title="' + name + '">Rename</span></td>'
                  + '<td><span class="item-edit">Edit</span></td>'
                  + '<td><span class="item-delete">Delete</span></td>'
                  + '<td class="cell-special">' + arrow + '</td>'
                  + '</tr>';
    });
    content += '</table>';
    $('#information').html(content);
    $('#information tr:even').addClass('even');
}

function fileRename(oldname) {
    var name = window.prompt('Please enter new filename for the ' + writer.type, oldname);

    if (!name) return;
    name = (name.slice(-3) == '.md') ? name.slice(0,-3) : name;
    if (name == writer.name) return;
    if (findFile(name)) {
        alert('The same filename already exists!');
        return;
    }

    var url = '../r/' + writer.type + '/' + writer.name;
    var data = {
        type: writer.type,
        newname: name
    };
    $.post(url, data, function(data) {
            console.log(data);
            initBrowser();
    });
}

function fileDelete() {
    if (confirm('Do you really want to delete this article?')) {
        var url = '../r/' + writer.type + '/' + writer.name;
        var data = {
            type: writer.type
        };
        $.ajax({
            type: 'DELETE',
            url: url,
            data: data,
            dataType: "json",
            success: function(data) {
                console.log(data);
                initBrowser();
            }
        });
    }
}

function findFile(name) {
    var list = writer.list;
    for (var i = 0; i < list.length; i++) {
        if (list[i].filename == name) return true;
    }
    return false;
}

function randomString(size) {
    var text = "";
    var possible = "0123456789";
    for (var i=0; i < size; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}

function loadMathJax() {
    $.get('../r/config/latex', function(data){
        writer.latex = data.latex;
        if (!data.latex) return;

        var script = document.createElement('script');
        script.type = 'text/x-mathjax-config';
        script[(window.opera ? 'innerHTML' : 'text')] =
            'MathJax.Hub.Config({\n' +
            '  skipStartupTypeset: true,\n' +
            '  showProcessingMessages: false,\n' +
            '  tex2jax: {inlineMath: [["$","$"], ["\\(","\\)"]],\n' +
            '            displayMath: [["$$","$$"], ["\\[","\\]"]],\n' +
            '            processEnvironments: false},\n' +
            '  "HTML-CSS": { imageFont: null }\n' +
            '});'
        var head = document.getElementsByTagName("head")[0];
        head.appendChild(script);

        /* There is some path problem in loading local mathjax with jquery
        $.getScript('mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML');
        */
        script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML';
        head.appendChild(script);
    });
}

function initEditor() {
    $('#file-list').hide();
    $('#button-new').hide();
    code.value = writer.text;
    preview();
    $('#file-edit').fadeIn();
    $('#codearea').on('keyup', preview).on('cut paste', timerview);
    $('#button-save').show();
}

function timerview() {
    setTimeout(preview, 100);
}

function preview() {
    if (writer.latex) {
        show.innerHTML = marked(escapeTex(getBody(code.value)));
        if (window.MathJax) MathJax.Hub.Typeset(show);
    } else {
        show.innerHTML = marked(getBody(code.value));
    }
}

function getBody(text) {
    var re = /^---(\n|\r\n|\r)([\w\W]+?)\1---\1([\w\W]*)/, result = re.exec(text);
    return (result ? result[3] : text);
}

function escapeTex(text) {
    var out = text.replace(/(\${1,2})((?:\\.|[^$])*)\1/g, function(m){
        m = m.replace(/_/g, '\\_')
             .replace(/</g, '\\lt ')
             .replace(/\|/g, '\\vert ')
             .replace(/\[/g, '\\lbrack ')
             .replace(/\\{/g, '\\lbrace ')
             .replace(/\\}/g, '\\rbrace ')
             .replace(/\\\\/g, '\\\\\\\\');
        return m;
    });
    return out;
}

})();
