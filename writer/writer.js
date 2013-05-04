
$(function() {
    var url = '../r/' + writer.type;
    $.get(url, function(items){
        writer.data = items;
        var content = '<table>';
        $.each(items, function(i, v){
           content += '<tr><td>' + v.id + '</td><td>' + v.title + '</td><td>' + 'Edit' + '</td><td>' + 'Delete' + '</td></tr>';
        });
        content += '</table>';
        $('#content').html(content);
    });
});
