
(function() {

var code = document.getElementById('codearea');
var show = document.getElementById('showarea');
var writer = {
    type: (location.search == '?page') ? 'page' : 'post',
    data: null,
    index: null,
    name: null,
    text: ''
};

$(function() {
    doResize();
    initBrowser();
    bindHandler();
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

function initBrowser() {
    $('#file-edit').hide();
    $('#button-save').hide();
    var url = '../r/' + writer.type + 's';
    $('#nav-' + writer.type).addClass('current');
    $.get(url, function(items){
        writer.data = items;
        var content = '<table>';
        $.each(items, function(i, v){
            if (writer.type == 'post') {
                var a = v.filename.split('-');
                name = a[0] + '-' + a[1] + '-' + a[2] + ' ' + a[3] + ':' + a[4];
            } else {
                name = v.filename + '.md';
            }
            content += '<tr data-i="' + i + '"><td>' + name + '</td><td>' + v.title + '</td>'
                      + '<td class="item-edit">Edit</td><td class="item-delete">Delete</td></tr>';
        });
        content += '</table>';
        $('#infomation').html(content);
        $('#file-list').fadeIn();
        $('#button-new').show();
    });
}

function bindHandler() {
    $('#file-list').click(function(e){
        var $target = $(e.target);
        if ($target.is('td')) {
            writer.index = $target.parent().attr('data-i');
            var article = writer.data[writer.index];
            writer.name = article.filename;
            writer.text = '---\n' + article.head + '\n---\n' + article.body;
            if ($target.hasClass('item-edit')) {
                initEditor();
            } else if ($target.hasClass('item-delete')) {
                confirm('Do you really want to delete this article?');
            }
        }
    });
    $('#button-new').click(function(e){
        function dateString(d){
            function pad(n){return n < 10 ? '0' + n : n}
            return [d.getFullYear(),
                pad(d.getMonth() + 1),
                pad(d.getDate()),
                pad(d.getHours()),
                pad(d.getMinutes())].join('-');
        }
        if (writer.type == 'post') {
            var d = new Date();
            writer.name = dateString(d);
        } else {
            var name = window.prompt('Please enter new file name:', 'noname.md');
            if (name) {
                writer.name = (name.slice(-3) == '.md') ? name.slice(0,-3) : name;
            } else return;
        }
        writer.text = '---\ntitle: Some Title\n---\n\nWrite here';
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
    show.innerHTML = marked(getBody(code.value));
}

function getBody(text) {
    var re = /^---(\n|\r\n|\r)([\w\W]+?)\1---\1([\w\W]*)/, result = re.exec(text);
    return (result ? result[3] : text);
}

})();
