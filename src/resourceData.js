var util = require('util');
var DNSString = require('./dnsString');

var ResourceData = function () {

};

ResourceData.parse = function (buffer, type) {

    var ResourceRecord = require('./resourceRecord').ResourceRecord;

    var rData = null;

    switch (type) {
        case ResourceRecord.TYPE.A:
            rData = AResourceData.parse(buffer);
            break;
    }

    return rData;
};

var AResourceData = function () {
    this.address = null;
};
AResourceData.parse = function (buffer) {
    var aRData = new AResourceData();
    aRData.address = buffer.slice(0, 4);
    return aRData;
};

module.exports = ResourceData;
