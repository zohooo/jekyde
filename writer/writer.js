
(function() {

var code = document.getElementById('codearea');
var show = document.getElementById('showarea');
var writer = {
    type: (location.search == '?page') ? 'page' : 'post',
    data: null,
    index: null
};

$(function() {
    var url = '../r/' + writer.type + 's';
    $('#nav-' + writer.type).addClass('current');
    $.get(url, function(items){
        writer.data = items;
        var content = '<table>';
        $.each(items, function(i, v){
           content += '<tr data-i="' + i + '"><td>' + v.id + '</td><td>' + v.title + '</td>'
                      + '<td class="item-edit">Edit</td><td class="item-delete">Delete</td></tr>';
        });
        content += '</table>';
        $('#infomation').html(content);
        bindHandler();
    });
    doResize();
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

function bindHandler() {
    $('#file-list').click(function(e){
        var $target = $(e.target);
        if ($target.is('td')) {
            writer.index = $target.parent().attr('data-i');
            if ($target.hasClass('item-edit')) {
                initEditor();
            } else if ($target.hasClass('item-delete')) {
                confirm('Do you really want to delete this article?');
            }
        }
    });
}

function initEditor() {
    $('#file-list').hide();
    code.value = writer.data[writer.index].source;
    preview();
    $('#file-edit').fadeIn();
    $('#codearea').on('keyup', preview).on('cut paste', timerview);
}

function timerview() {
    setTimeout(preview, 100);
}

function preview() {
    show.innerHTML = marked(code.value);
}

})();
