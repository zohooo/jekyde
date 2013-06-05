
module.exports = function(obj, basename) {
    function setDate(a) {
        if (!a[3]) a[3] = '00';
        if (!a[4]) a[4] = '00';
        if (!a[5]) a[5] = '00';
        obj.date = new Date(a[0] + '-' + a[1] + '-' + a[2] + ' ' + a[3] + ':' + a[4] + ':' + a[5]);
        obj.metadate = a;
    }

    function setTitle(name) {
        if (!obj.name) obj.name = name.toLowerCase();
        if (!obj.title) obj.title = name.replace('-', ' ');
    }

    function reviseDate() {
        var date = obj.date;  // date in yaml header
        if (!date) return;

        // string date format
        re = /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01]) ([01]\d|2[0-3]):([0-5]\d)$/;
        if (typeof date == 'string') {
            ar = re.exec(date);
            if (ar) {
                ar = ar.slice(1);
                setDate(ar);
                return;
            }
        }

        // utc date format
        if (date instanceof Date) {
            obj.date = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
            obj.metadate = dateArray(obj.date);
        }
    }

    function parseDate() {
        // default date format
        var r = [
            /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])-([01]\d|2[0-3])-([0-5]\d)-([0-5]\d)$/,
            /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])-([01]\d|2[0-3])-([0-5]\d)$/,
            /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])$/
        ];
        for (var i = 0; i < r.length; i++) {
            var a = r[i].exec(basename);
            if (a) {
                a = a.slice(1);
                if (!obj.date) setDate(a);
                return;
            }
        }

        // jekyll date format
        var re = /^(\d{4})-(0[1-9]|1[012])-(0[1-9]|[12]\d|3[01])-([\w\W]+)$/;
        var ar = re.exec(basename);
        if (ar) {
            setTitle(ar[4]);
            ar = ar.slice(1, 4);
            if (!obj.date) setDate(ar);
            return;
        }

        // no date in basename
        setTitle(basename);
    }

    reviseDate();
    parseDate();
}

function dateArray(d){
    function pad(n){return n < 10 ? '0' + n : n.toString()}
    return [d.getFullYear(),
        pad(d.getMonth() + 1),
        pad(d.getDate()),
        pad(d.getHours()),
        pad(d.getMinutes()),
        pad(d.getSeconds())];
}
