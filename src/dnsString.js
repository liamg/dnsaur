/**
 * http://www.tcpipguide.com/free/t_DNSNameNotationandMessageCompressionTechnique.htm
 */
module.exports = {

    /**
     * Takes a human readable string and encodes it using DNS name notation
     * @param string Human readable string e.g. www.google.com
     * @returns {Array} Byte array
     */
    encode: function (string) {

        var encoded = [];
        var readLength = 0;
        var j;

        for (var i = 0; i < string.length; i++) {
            if (string[i] === '.') {
                encoded.push(readLength);
                for (j = i - readLength; j < i; j++) {
                    encoded.push(string.charCodeAt(j));
                }
                readLength = 0;
            } else {
                readLength++;
            }
        }
        encoded.push(0);
        return encoded;
    },

    /**
     * Decodes a byte array in domain name notation into a human readable string
     * @param bytes Byte array in DNS notation
     * @returns {string} Huam nreadable string e.g. www.google.com
     */
    decode: function (bytes) {

        var decoded = '';
        var readLength = 0;

        for (var i = 0; i < bytes.length; i++) {
            if (readLength === 0) {
                readLength = bytes[i];
                if (bytes[i] === 0) break;
                decoded = decoded === '' ? '' : decoded + '.';
            } else {
                decoded += String.fromCharCode(bytes[i]);
                readLength--;
            }
        }
        return decoded;
    }
};