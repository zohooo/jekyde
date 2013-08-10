
(function() {

if (!window.console) window.console = {log : function() {}};

var code = document.getElementById('codearea');
var show = document.getElementById('showarea');
var writer = {
    type: 'post',
    screen: 'large',
    mode: 'edit',
    index: null,
    name: null,
    text: ''
};

$(function() {
    writer.type = (location.search == '?page') ? 'page' : 'post';
    $('#nav-' + writer.type).addClass('current');
    var option = location.hash.split('|');
    writer.name = option[0].slice(1);
    if (option[1]) writer.index = option[1];
    doResize();
    signIn();
});

$(window).resize(function() {
    doResize();
});

function doResize() {
    writer.screen = ($(window).width() > 540) ? 'large' : 'small';
    writer.mode = (writer.screen == 'large') ? 'edit' : 'code';
    var ht = $(window).height() - $('#header').height();
    $('#file-edit').height(ht);
    $('#codewrap').height(ht);
    $('#codearea').height(ht);
    $('#showwrap').height(ht);
    $('#showarea').height(ht);
    resizeEditor(writer.mode);
}

function signIn() {
    $.get('../r/auth', function(auth){
        var info, pass;
        switch (auth) {
            case 'none':
            case 'connected':
                return initContent();
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
         .done(initContent)
         .fail(function(){alert('Wrong Password!')});
    });
}

function initContent() {
    loadMathJax();
    initWriter();
    bindHandler();
}

function initWriter() {
    function dateString(){
        var d = new Date();
        function pad(n){return n < 10 ? '0' + n : n}
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' '
             + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    }
    if (writer.index) { // edit article
        var url = '../r/' + writer.type + '/' + writer.index;
        $.get(url, function(article){
            writer.text = '---\n' + article.head + '\n---\n' + article.body;
            initEditor();
        });
    } else { // new article
        var rand = randomString(4);
        writer.text = '---\ntitle: Some Title ' + rand + '\ndate: ' + dateString() + '\n---\n\nWrite here';
        initEditor();
    }
}

function bindHandler() {
    $('#button-save').click(function(e){
        var url = '../r/' + writer.type + '/' + writer.name;
        var data = {
            index: writer.index,
            source: code.value
        };
        $.ajax({
            type: 'PUT',
            url: url,
            data: data,
            success: success
        });
        function success() {
            location.href = 'browser.html?' + writer.type;
        }
    });
    $('#codemove').click(function(){
        if (writer.screen == 'large' && writer.mode == 'code') {
            resizeEditor('edit');
        } else {
            resizeEditor('show');
            preview();
        }
    });
    $('#showmove').click(function(){
        if (writer.screen == 'large' && writer.mode == 'show') {
            resizeEditor('edit');
        } else {
            resizeEditor('code');
        }
    });
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
            '  tex2jax: {inlineMath: [["$","$"], ["\\\\(","\\\\)"]],\n' +
            '            displayMath: [["$$","$$"], ["\\\\[","\\\\]"]],\n' +
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

function resizeEditor(mode) {
    var c = document.getElementById('codewrap');
    var s = document.getElementById('showwrap');
    switch (mode) {
        case 'edit':
            c.style.display = 'block';
            c.style.left = 0 + 'px';
            c.style.width = '50%';
            s.style.display = 'block';
            s.style.left = '50%';
            s.style.width = '';
            break;
        case 'code':
            c.style.display = 'block';
            c.style.left = 0 + 'px';
            c.style.width = '100%';
            s.style.display = 'none';
            break;
        case 'show':
            c.style.display = 'none';
            s.style.display = 'block';
            s.style.left = 0 + 'px';
            s.style.width = '100%';
            break;
    }
    writer.mode = mode;
}

function initEditor() {
    resizeEditor(writer.mode);
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
    if (writer.mode == 'code') return;
    function typeMath() {
        if (window.MathJax) {
            MathJax.Hub.Typeset(show);
        } else {
            setTimeout(arguments.callee, 100);
        }
    }
    if (writer.latex) {
        show.innerHTML = marked(escapeTex(getBody(code.value)));
        typeMath();
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
