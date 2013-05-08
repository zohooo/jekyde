
(function() {

var type = (location.search == '?page') ? 'page' : 'post';
$('#nav-' + type).addClass('current');
var writer = {type: type};

$(function() {
    var url = '../r/' + type + 's';
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
    var value = writer.data[writer.index].source;
    $('#file-list').hide();
    $('#codearea')[0].value = value;
    $('#showarea').html(marked(value));
    $('#file-edit').fadeIn();
}

})();
