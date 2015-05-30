module.exports = {

    toString: function (buffer) {
        var string = '';
        if (buffer.length === 4) { // ipv4
            string = buffer.join('.');
        } else { // ipv6
            buffer.forEach(function (byte) {
                if (string.length > 0 && string.length % 4 === 0) {
                    string += ':';
                }
                string += byte.toString(16);
            });
        }
        return string;
    },

    toBuffer: function (string) {
        var buffer = new Buffer();
        var parts;
        if (string.indexOf('.') === -1) {
            //ipv6
            string = string.replace(':', '');
            parts = string.match(/.{2}/g);
            parts.forEach(function (part) {
                buffer.writeInt8(parseInt(part, 16));
            });
        } else {
            parts = string.split('.');
            parts.forEach(function (part) {
                buffer.writeInt8(parseInt(part, 10));
            });
        }
        return buffer;
    }

};