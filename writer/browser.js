
(function() {

if (!window.console) window.console = {log : function() {}};

var browser = {
    type: 'post',
    screen: 'large',
    list: null,
    start: 0,
    limit: 15,
    index: null,
    name: 'noname',
};

$(function() {
    browser.type = (location.search == '?page') ? 'page' : 'post';
    $('#nav-' + browser.type).addClass('current');
    doResize();
    signIn();
});

$(window).resize(function() {
    doResize();
});

function doResize() {
    browser.screen = ($(window).width() > 540) ? 'large' : 'small';
    var ht = $(window).height() - $('#header').height();
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
    initBrowser();
    bindHandler();
}

function initBrowser() {
    var url = '../r/' + browser.type + 's';
    $.get(url, function(items){
        browser.list = items;
        browser.start = browser.start || 0;
        showFiles();
        if (history.replaceState) {
            history.replaceState({start: browser.start}, '', location.href);
        }
        $('#file-list').fadeIn();
        $('#button-new').show();
    });
}

function bindHandler() {
    function hashState(start) {
      var href = location.href, hash = location.hash;
      href = href.slice(0, - hash.length) + '#' + start;
      if (history.pushState) {
          history.pushState({start: start}, '', href);
      }
    }
    if (history.pushState) {
        window.onpopstate = function(event) {
            browser.start = (event.state) ? event.state.start : 0;
            initBrowser();
        }
    }
    $('#file-list').click(function(e){
        var $target = $(e.target);
        if ($target.is('span')) {
            var c = $target.attr('class');
            if (c == 'item-edit' || c == 'item-name' || c == 'item-delete') {
                browser.index = $target.parent().parent().attr('data-i');
                browser.name = browser.list[browser.index].filename;
            }
            switch (c) {
                case 'item-edit':
                    fileEdit(browser.index);
                    break;
                case 'item-name':
                    fileRename();
                    break;
                case 'item-delete':
                    fileDelete();
                    break;
                case 'newer':
                    browser.start -= browser.limit;
                    hashState(browser.start);
                    showFiles();
                    break;
                case 'older':
                    browser.start += browser.limit;
                    hashState(browser.start);
                    showFiles();
                    break;
            }
        }
    });
    $('#button-new').click(function(e){
        var rand = randomString(4);
        var name = window.prompt('Please enter new page name:', 'name-' + rand + '.md');
        if (!name) return;
        name = (name.slice(-3) == '.md') ? name.slice(0,-3) : name;
        if (findFile(name)) {
            alert('The same filename already exists!');
            return;
        }
        location.href = 'writer.html?' + browser.type + '#' + name;
    });
}

function showFiles() {
    function largeContent() {
        var content = '<table id="box" class="large">';
        $.each(items, function(i, v){
            var a = v.metadate;
            var date = a[0] + '-' + a[1] + '-' + a[2] + ' ' + a[3] + ':' + a[4];
            var name = v.filename + '.md';
            var arrow = '';
            if (i == 0 && start > 0) arrow = '<span class="newer">&uarr;</span>';
            if (i == limit - 1 && start + limit < browser.list.length) arrow = '<span class="older">&darr;</span>';
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
        return content;
    }

    function smallContent() {
        var content = '<div id="box" class="small">';
        $.each(items, function(i, v){
            var a = v.metadate;
            var date = a[0] + '-' + a[1] + '-' + a[2] + ' ' + a[3] + ':' + a[4];
            var name = v.filename + '.md';
            content += '<div class="row" data-i="' + (start + i) + '">'
                     + '<div class="date"><span class="item-date">' + date + '</span></div>'
                     + '<div class="title"><span class="item-title">' + v.title + '</span></div>'
                     + '<div class="task"><span class="item-name" title="' + name + '">Rename</span>'
                          + '<span class="item-edit">Edit</span>'
                          + '<span class="item-delete">Delete</span></div>'
                     + '</div>';
        });
        content += '</div>';
        var arrow = '';
        if (start > 0) arrow += '<span class="newer">&laquo; Newer</span>';
        if (start + limit < browser.list.length) arrow += '<span class="older">Older &raquo;</span>';
        content +=  '<div class="nav">' +  arrow + '</div>';
        return content;
    }

    var start = browser.start, limit = browser.limit;
    var items = browser.list.slice(start, start + limit);
    var content = (browser.screen == 'large') ? largeContent() : smallContent();
    $('#information').html(content);
    $('#information tr:even').addClass('even');
}

function fileEdit(index) {
    location.href = 'writer.html?' + browser.type + '#' + browser.name + '|' + index;
}

function fileRename() {
    var name = window.prompt('Please enter new filename for the ' + browser.type, browser.name + '.md');

    if (!name) return;
    name = (name.slice(-3) == '.md') ? name.slice(0,-3) : name;
    if (name == browser.name) return;
    if (findFile(name)) {
        alert('The same filename already exists!');
        return;
    }

    var url = '../r/' + browser.type + '/' + browser.name;
    var data = {
        index: browser.index,
        newname: name
    };
    $.post(url, data, initBrowser);
}

function fileDelete() {
    if (confirm('Do you really want to delete this article?')) {
        var url = '../r/' + browser.type + '/' + browser.name;
        var data = {
            index: browser.index
        };
        $.ajax({
            type: 'DELETE',
            url: url,
            data: data,
            success: initBrowser
        });
    }
}

function findFile(name) {
    var list = browser.list;
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

})();
