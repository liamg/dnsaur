var util = require('util');
var DNSString = require('./dnsString');
var ip = require('./ip');

var ResourceData = function () {

};

ResourceData.parse = function (buffer, type) {

    var ResourceRecord = require('./resourceRecord').ResourceRecord;

    var rData = null;

    switch (type) {
        case ResourceRecord.TYPE.A:
            rData = AResourceData.parse(buffer);
            break;
        case ResourceRecord.TYPE.NS:
            rData = NSResourceData.parse(buffer);
            break;
        case ResourceRecord.TYPE.MX:
            rData = MXResourceData.parse(buffer);
            break;
        case ResourceRecord.TYPE.PTR:
            rData = PTRResourceData.parse(buffer);
            break;
        case ResourceRecord.TYPE.SOA:
            rData = SOAResourceData.parse(buffer);
            break;
        default:
            throw new Error('Unknown resource data type: ' + type);
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
AResourceData.prototype.createRaw = function() {
    return ip.toBytes(this.address);
};

var NSResourceData = function () {
    this.name = null;
};
NSResourceData.parse = function (buffer) {
    var nsRData = new NSResourceData();
    nsRData.name = DNSString.decode(buffer);
    return nsRData;
};
NSResourceData.prototype.createRaw = function(){
    return DNSString.encode(this.name);
};

var PTRResourceData = function () {
    this.name = null;
};
util.inherits(PTRResourceData, NSResourceData);
PTRResourceData.parse = function (buffer) {
    var ptrRData = new PTRResourceData();
    ptrRData.name = DNSString.decode(buffer);
    return ptrRData;
};

var MXResourceData = function () {
    this.preference = null;
    this.mailExchanger = null;
};
MXResourceData.parse = function (buffer) {
    var mxRData = new MXResourceData();
    mxRData.preference = buffer.readUInt16BE(0);
    mxRData.mailExchanger = DNSString.decode(buffer.slice(2));
    return mxRData;
};
MXResourceData.prototype.createRaw = function(){
    var bytes = [];
    bytes.push((this.preference >> 8) & 0xFF);
    bytes.push((this.preference) & 0xFF);
    return bytes.concat(DNSString.toBytes(this.mailExchanger));
};

var SOAResourceData = function () {
    this.primaryNS = '';
    this.adminMailbox = '';
    this.serialNumber = 0;
    this.refreshInterval = 0;
    this.retryInterval = 0;
    this.expirationLimit = 0;
    this.minimumTTL = 0;
};
SOAResourceData.parse = function (buffer) {

    var rData = new SOAResourceData();
    rData.primaryNS = DNSString.decode(buffer);
    buffer = buffer.slice(rData.primaryNS.length + 2);
    rData.adminMailbox = DNSString.decode(buffer);
    buffer = buffer.slice(rData.adminMailbox.length + 2);
    
    rData.serialNumber = buffer.readUInt32BE(0);
    rData.refreshInterval = buffer.readUInt32BE(4);
    rData.retryInterval = buffer.readUInt32BE(8);
    rData.expirationLimit = buffer.readUInt32BE(12);
    rData.minimumTTL = buffer.readUInt32BE(16);
    
    return rData;
};
SOAResourceData.prototype.createRaw = function(){
    var bytes = [];

    bytes = bytes.concat(DNSString.toBytes(this.primaryNS));
    bytes = bytes.concat(DNSString.toBytes(this.adminMailbox));

    bytes.push((this.serialNumber >> 24) & 0xFF);
    bytes.push((this.serialNumber >> 16) & 0xFF);
    bytes.push((this.serialNumber >> 8) & 0xFF);
    bytes.push((this.serialNumber) & 0xFF);

    bytes.push((this.refreshInterval >> 24) & 0xFF);
    bytes.push((this.refreshInterval >> 16) & 0xFF);
    bytes.push((this.refreshInterval >> 8) & 0xFF);
    bytes.push((this.refreshInterval) & 0xFF);

    bytes.push((this.retryInterval >> 24) & 0xFF);
    bytes.push((this.retryInterval >> 16) & 0xFF);
    bytes.push((this.retryInterval >> 8) & 0xFF);
    bytes.push((this.retryInterval) & 0xFF);

    bytes.push((this.expirationLimit >> 24) & 0xFF);
    bytes.push((this.expirationLimit >> 16) & 0xFF);
    bytes.push((this.expirationLimit >> 8) & 0xFF);
    bytes.push((this.expirationLimit) & 0xFF);

    bytes.push((this.minimumTTL >> 24) & 0xFF);
    bytes.push((this.minimumTTL >> 16) & 0xFF);
    bytes.push((this.minimumTTL >> 8) & 0xFF);
    bytes.push((this.minimumTTL) & 0xFF);

    return bytes;
};

module.exports = {
    ResourceData: ResourceData,
    AResourceData: AResourceData,
    MXResourceData: MXResourceData,
    PTRResourceData: PTRResourceData,
    NSResourceData: NSResourceData,
    SOAResourceData: SOAResourceData
};
