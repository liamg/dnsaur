var util = require('util');
var DNSString = require('./dnsString');
var ResourceData = require('./resourceData').ResourceData;

var ResourceRecord = function () {
    this.name = '';
    this.type = ResourceRecord.TYPE.A;
    this.rrClass = ResourceRecord.CLASS.IN;
    this.length = 0;
};
ResourceRecord.prototype.getRecordType = function () {
    return require('./util.js').invertObject(ResourceRecord.TYPE)[this.type];
};
ResourceRecord.prototype.createBuffer = function(){
    var bytes = DNSString.encode(this.name);
    bytes.push((this.type >> 8) & 0xFF);
    bytes.push(this.type & 0xFF);
    bytes.push((this.rrClass >> 8) & 0xFF);
    bytes.push(this.rrClass & 0xFF);
    return new Buffer(bytes);
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

    rr.rrClass = buffer.readUInt16BE(offset);
    offset += 2;

    rr.length = offset;

    return rr;
};

var AnswerResourceRecord = function () {

    this.name = '';
    this.type = ResourceRecord.TYPE.A;
    this.rrClass = ResourceRecord.CLASS.IN;
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

    rr.rrClass = buffer.readUInt16BE(offset);
    offset += 2;

    rr.ttl = buffer.readUInt32BE(offset);
    offset += 4;

    rr.resourceDataLength = buffer.readUInt16BE(offset);
    offset += 2;

    rr.resourceData = ResourceData.parse(buffer.slice(offset, offset + rr.resourceDataLength));
    rr.length = offset + rr.resourceDataLength;

    return rr;
};

AnswerResourceRecord.prototype.createBuffer = function(){

    var bytes = DNSString.encode(this.name);
    bytes.push((this.type >> 8) & 0xFF);
    bytes.push(this.type & 0xFF);
    bytes.push((this.rrClass >> 8) & 0xFF);
    bytes.push(this.rrClass & 0xFF);

    bytes.push((this.ttl >> 24) & 0xFF);
    bytes.push((this.ttl >> 16) & 0xFF);
    bytes.push((this.ttl >> 8) & 0xFF);
    bytes.push(this.ttl & 0xFF);

    bytes.push((this.resourceDataLength >> 8) & 0xFF);
    bytes.push(this.resourceDataLength & 0xFF);

    var rDataBytes = Uint8Array(this.resourceData.createBuffer());

    return new Buffer(bytes.concat(rDataBytes));
};

// http://www.tcpipguide.com/free/t_DNSNameServerDataStorageResourceRecordsandClasses-3.htm#Table_166
ResourceRecord.TYPE = {
    A: 1,
    NS: 2,
    CNAME: 5,
    SOA: 6,
    PTR: 12,
    MX: 15,
    TXT: 16
};

ResourceRecord.CLASS = {
    IN: 1
};

module.exports = {
    ResourceRecord: ResourceRecord,
    QuestionResourceRecord: QuestionResourceRecord,
    AnswerResourceRecord: AnswerResourceRecord
};