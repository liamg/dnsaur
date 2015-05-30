var util = require('util');
var DNSString = require('./dnsString');
var ResourceData = require('./resourceData');

var ResourceRecord = function () {

    this.name = '';
    this.type = '';
    this.rrClass = '';
    this.length = 0;

};

ResourceRecord.prototype = {
    getRecordType: function () {
        return require('./util.js').invertObject(ResourceRecord.TYPE)[this.type];
    }
};

var QuestionResourceRecord = function () {

};
util.inherits(QuestionResourceRecord, ResourceRecord);

var AnswerResourceRecord = function () {

    this.name = '';
    this.type = '';
    this.rrClass = '';
    this.length = 0;
    this.ttl = '';
    this.resourceDataLength = 0;
    this.resourceData = null;

};
util.inherits(AnswerResourceRecord, ResourceRecord);

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