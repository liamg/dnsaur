module.exports = {

    toString: function (buffer) {

        var string = '';
        if (buffer.length === 4) { // ipv4
            string = buffer[0] + '.' + buffer[1] + '.' +buffer[2] + '.' +buffer[3];
        } else { // ipv6
            var b;
            for(var i = 0; i < buffer.length; i++) {
                    if (i > 0 && i % 2 === 0) {
                        string += ':';
                    }
                b = buffer[i].toString(16);
                if(b.length === 1) b = '0' + b;
                string += b;
            }
        }
        return string;
    },

    toBytes: function (string) {

        var bytes = [];
        var parts;
        if (string.indexOf('.') === -1) {
            //ipv6
            string = string.replace(/:/g, '');
            parts = string.match(/.{2}/g);
            if(parts === null){
                throw new Error('Invalid IP address: ' + string);
            }
            parts.forEach(function (part) {
                bytes.push(parseInt(part, 16));
            });
        } else {
            //ipv4
            parts = string.split('.');
            parts.forEach(function (part) {
                bytes.push(parseInt(part, 10));
            });
        }
        return bytes;
    }

};