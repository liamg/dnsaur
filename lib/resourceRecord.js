var util = require('util');
var DNSString = require('./dnsString');
var ResourceData = require('./resourceData').ResourceData;

var ResourceRecord = function () {
    this.name = '';
    this.type = ResourceRecord.TYPE.A;
    this.class = ResourceRecord.CLASS.IN;
    this.length = 0;
};
ResourceRecord.prototype = {
    toString: function(){
        return JSON.stringify(this);
    },
    getRecordType: function () {
        return require('./util.js').invertObject(ResourceRecord.TYPE)[this.type];
    },
    createRaw: function () {
        var bytes = DNSString.encode(this.name);
        bytes.push((this.type >> 8) & 0xFF);
        bytes.push(this.type & 0xFF);
        bytes.push((this.class >> 8) & 0xFF);
        bytes.push(this.class & 0xFF);
        return bytes;
    },
    getName: function () {
        return this.name;
    },
    setName: function (name) {
        this.name = name;
    },
    getType: function () {
        return this.type;
    },
    setType: function (type) {
        this.type = type;
    },
    getClass: function () {
        return this.class;
    },
    setClass: function (rrClass) {
        this.class = rrClass;
    }
};


var QuestionResourceRecord = function () {

};
util.inherits(QuestionResourceRecord, ResourceRecord);

QuestionResourceRecord.parse = function (buffer) {

    var rr = new QuestionResourceRecord();

    rr.name = DNSString.decode(buffer);

    var offset = buffer[0] === 0 ? 1 : rr.name.length + 2;

    rr.type = buffer.readUInt16BE(offset);
    offset += 2;

    if (rr.type === ResourceRecord.TYPE.OPT) {
        return OptResourceRecord.parse(buffer);
    }

    rr.class = buffer.readUInt16BE(offset);
    offset += 2;

    rr.length = offset;

    return rr;
};

var AnswerResourceRecord = function () {

    this.name = '';
    this.type = ResourceRecord.TYPE.A;
    this.class = ResourceRecord.CLASS.IN;
    this.length = 0;
    this.ttl = '';
    this.resourceDataLength = 0;
    this.resourceData = null;

};
util.inherits(AnswerResourceRecord, ResourceRecord);

AnswerResourceRecord.parse = function (buffer) {

    var rr = new AnswerResourceRecord();

    rr.name = DNSString.decode(buffer);

    var offset = buffer[0] === 0 ? 1 : rr.name.length + 2;

    rr.type = buffer.readUInt16BE(offset);
    offset += 2;

    if (rr.type === ResourceRecord.TYPE.OPT) {
        return OptResourceRecord.parse(buffer);
    }

    rr.class = buffer.readUInt16BE(offset);
    offset += 2;

    rr.ttl = buffer.readUInt32BE(offset);
    offset += 4;

    rr.resourceDataLength = buffer.readUInt16BE(offset);
    offset += 2;

    rr.resourceData = ResourceData.parse(buffer.slice(offset, offset + rr.resourceDataLength), rr.type);
    rr.length = offset + rr.resourceDataLength;

    return rr;
};

AnswerResourceRecord.prototype.setTTL = function(ttl){
    this.ttl = ttl;
};

AnswerResourceRecord.prototype.getTTL = function(){
    return this.ttl;
};

AnswerResourceRecord.prototype.getResourceDataLength = function(){
    return this.resourceDataLength;
};

AnswerResourceRecord.prototype.getResourceData = function () {
    return this.resourceData;
};
AnswerResourceRecord.prototype.setResourceData = function (rData) {
    this.resourceData = rData;
    this.resourceDataLength = rData.createRaw().length;
};

AnswerResourceRecord.prototype.createRaw = function () {
    var bytes = DNSString.encode(this.name);
    bytes.push((this.type >> 8) & 0xFF);
    bytes.push(this.type & 0xFF);
    bytes.push((this.class >> 8) & 0xFF);
    bytes.push(this.class & 0xFF);
    bytes.push((this.ttl >> 24) & 0xFF);
    bytes.push((this.ttl >> 16) & 0xFF);
    bytes.push((this.ttl >> 8) & 0xFF);
    bytes.push(this.ttl & 0xFF);
    bytes.push((this.resourceDataLength >> 8) & 0xFF);
    bytes.push(this.resourceDataLength & 0xFF);

    if(this.resourceData !== null) {
        bytes = bytes.concat(this.resourceData.createRaw());
    }

    return bytes;
};

var OptResourceRecord = function () {
    this.name = '';
    this.type = ResourceRecord.TYPE.OPT;
    this.udpPayloadSize = 4096;
    this.flags = 0;
    this.resourceDataLength = 0;
    this.resourceData = null;
};
OptResourceRecord.parse = function (buffer) {
    var rr = new OptResourceRecord();

    rr.name = DNSString.decode(buffer); // should always be [0] => ''

    var offset = buffer[0] === 0 ? 1 : rr.name.length + 2;

    rr.type = buffer.readUInt16BE(offset); // should always be 0x29 (41) - OPT
    offset += 2;

    rr.udpPayloadSize = buffer.readUInt16BE(offset);
    offset += 2;

    rr.flags = buffer.readUInt32BE(offset);
    offset += 4;

    rr.resourceDataLength = buffer.readUInt16BE(offset);
    offset += 2;

    rr.resourceData = ResourceData.parse(buffer.slice(offset, offset + rr.resourceDataLength), rr.type);
    rr.length = offset + rr.resourceDataLength;

    return rr;
};
OptResourceRecord.prototype.createRaw = function () {

    var bytes = DNSString.encode(this.name); // [0]

    bytes.push((this.type >> 8) & 0xFF);
    bytes.push((this.type) & 0xFF);

    bytes.push((this.udpPayloadSize >> 8) & 0xFF);
    bytes.push((this.udpPayloadSize) & 0xFF);

    bytes.push((this.flags >> 24) & 0xFF);
    bytes.push((this.flags >> 16) & 0xFF);
    bytes.push((this.flags >> 8) & 0xFF);
    bytes.push((this.flags) & 0xFF);

    bytes.push((this.resourceDataLength >> 8) & 0xFF);
    bytes.push((this.resourceDataLength) & 0xFF);

    return bytes.concat(this.resourceData.createRaw());
};

// http://www.tcpipguide.com/free/t_DNSNameServerDataStorageResourceRecordsandClasses-3.htm#Table_166
ResourceRecord.TYPE = {
    A: 1,
    NS: 2,
    CNAME: 5,
    SOA: 6,
    PTR: 12,
    MX: 15,
    TXT: 16,
    OPT: 41
};

ResourceRecord.CLASS = {
    IN: 1
};

module.exports = {
    ResourceRecord: ResourceRecord,
    QuestionResourceRecord: QuestionResourceRecord,
    AnswerResourceRecord: AnswerResourceRecord,
    OptResourceRecord: OptResourceRecord
};