var ResourceRecord = require('./resourceRecord').ResourceRecord;
var AnswerResourceRecord = require('./resourceRecord').AnswerResourceRecord;
var QuestionResourceRecord = require('./resourceRecord').QuestionResourceRecord;

// http://www.zytrax.com/books/dns/ch15/

var Message = function () {

    this.header = {
        identification: Math.floor(Math.random() * 0xFFFF),      // 2 bytes, unique query/response identifier
        qr: 0,                          // 1 bit, 0=query, 1=response
        opcode: Message.OPCODE.QUERY,   // 4 bits Operation type
        aa: 0,                          // 1 bit Authoritative Answer
        tc: 0,                          // 1 bit Truncated
        rd: 0,                          // 1 bit Recursion desired - don't have to support this, just leave it set to zero
        ra: 0,                          // 1 bit Recursion available
        z: 0,                           // 1 bit Reserved
        ad: 0,                          // 1 bit Reserved
        cd: 0,                          // 1 bit Reserved
        rcode: Message.RCODE.NOERROR,   // 4 bits Response code. Ignored on request.
        totalQuestions: 0,              // 2 bytes
        totalAnswerRRs: 0,              // 2 bytes
        totalAuthorityRRs: 0,           // 2 bytes
        totalAdditionalRRs: 0           // 2 bytes
    };

    this.resourceRecords = {
        questions: [],
        answers: [],
        authorities: [],
        additionals: []
    };
};

Message.prototype = {

    toString: function(){ // @todo Build this to mimic dig!
        return JSON.stringify(this);
    },

    createRaw: function () {
        var bytes = [];

        bytes.push((this.getIdentification() >> 8) & 0xFF);
        bytes.push(this.getIdentification() & 0xFF);

        var flags1 = 0;
        var flags2 = 0;

        flags1 |= ((this.getType() << 7) & 0xFF); // QR
        flags1 |= (((this.getOpCode() << 4) & 0xFF) >> 1); // OPCODE
        flags1 |= (((this.getAA() << 7) & 0xFF) >> 5); // aa
        flags1 |= (((this.getTC() << 7) & 0xFF) >> 6); // tc
        flags1 |= (((this.getRD() << 7) & 0xFF) >> 7); // rd

        flags2 |= ((this.getRA() << 7) & 0xFF);
        flags2 |= (((this.getZ() << 7) & 0xFF) >> 1);
        flags2 |= (((this.getAD() << 7) & 0xFF) >> 2);
        flags2 |= (((this.getCD() << 7) & 0xFF) >> 3);
        flags2 |= this.getRCode();

        bytes.push(flags1 & 0xFF);
        bytes.push(flags2 & 0xFF);

        bytes.push((this.getQuestionCount() >> 8) & 0xFF);
        bytes.push(this.getQuestionCount() & 0xFF);
        bytes.push((this.getAnswerCount() >> 8) & 0xFF);
        bytes.push(this.getAnswerCount() & 0xFF);
        bytes.push((this.getAuthorityCount() >> 8) & 0xFF);
        bytes.push(this.getAuthorityCount() & 0xFF);
        bytes.push((this.getAdditionalCount() >> 8) & 0xFF);
        bytes.push(this.getAdditionalCount() & 0xFF);

        this.getQuestions().forEach(function (resourceRecord) {
            bytes = bytes.concat(resourceRecord.createRaw());
        });

        this.getAnswers().forEach(function (resourceRecord) {
            bytes = bytes.concat(resourceRecord.createRaw());
        });

        this.getAuthorities().forEach(function (resourceRecord) {
            bytes = bytes.concat(resourceRecord.createRaw());
        });

        this.getAdditionals().forEach(function (resourceRecord) {
            bytes = bytes.concat(resourceRecord.createRaw());
        });

        return bytes;
    },

    getType: function () {
        return this.header.qr;
    },

    getOpCode: function () {
        return this.header.opcode;
    },

    getAA: function () {
        return this.header.aa;
    },

    getTC: function () {
        return this.header.tc;
    },

    getRD: function () {
        return this.header.rd;
    },

    getRA: function () {
        return this.header.ra;
    },

    getZ: function () {
        return this.header.z;
    },

    getAD: function () {
        return this.header.ad;
    },

    getCD: function () {
        return this.header.cd;
    },

    getRCode: function () {
        return this.header.rcode;
    },

    setIdentification: function (id) {
        this.header.identification = id;
    },

    getIdentification: function () {
        return this.header.identification;
    },

    setType: function (type) {
        switch (type) {
            case Message.TYPE.QUERY:
            case Message.TYPE.RESPONSE:
                this.header.qr = type;
                break;
            default:
                throw new Error('Unknown DNS message type supplied.');
        }
    },

    addQuestionResourceRecord: function (questionResourceRecord) {
        this.header.totalQuestions++;
        this.resourceRecords.questions.push(questionResourceRecord);
    },

    addAnswerResourceRecord: function (answerResourceRecord) {
        this.header.totalAnswerRRs++;
        this.resourceRecords.answers.push(answerResourceRecord);
    },

    addAuthorityResourceRecord: function (authorityResourceRecord) {
        this.header.totalAuthorityRRs++;
        this.resourceRecords.authorities.push(authorityResourceRecord);
    },

    addAdditionalResourceRecord: function (additionalResourceRecord) {
        this.header.totalAdditionalRRs++;
        this.resourceRecords.additionals.push(additionalResourceRecord);
    },

    getQuestionCount: function () {
        return this.header.totalQuestions;
    },

    getQuestions: function () {
        return this.resourceRecords.questions;
    },

    getAnswerCount: function () {
        return this.header.totalAnswerRRs;
    },

    getAnswers: function () {
        return this.resourceRecords.answers;
    },

    getAuthorityCount: function () {
        return this.header.totalAuthorityRRs;
    },

    getAuthorities: function () {
        return this.resourceRecords.authorities;
    },

    getAdditionalCount: function () {
        return this.header.totalAdditionalRRs;
    },

    getAdditionals: function () {
        return this.resourceRecords.additionals;
    }
};

Message.parse = function (buffer) {

    var message = new Message();

    if (buffer.length < 12) { // DNS message headers are always 12 bytes
        throw new Error("Malformed DNS message.");
    }

    message.header.identification = buffer.readUInt16BE(0);

    var flags = buffer.readUInt16BE(2);

    message.header.qr = flags >> 15;
    message.header.opcode = ((flags << 1) & 0xffff) >> 12;
    message.header.aa = ((flags << 5) & 0xffff) >> 15;
    message.header.tc = ((flags << 6) & 0xffff) >> 15;
    message.header.rd = ((flags << 7) & 0xffff) >> 15;
    message.header.ra = ((flags << 8) & 0xffff) >> 15;
    message.header.z = ((flags << 9) & 0xffff) >> 15;
    message.header.ad = ((flags << 10) & 0xffff) >> 15;
    message.header.cd = ((flags << 11) & 0xffff) >> 15;
    message.header.rcode = ((flags << 12) & 0xffff) >> 12;
    message.header.totalQuestions = buffer.readUInt16BE(4);
    message.header.totalAnswerRRs = buffer.readUInt16BE(6);
    message.header.totalAuthorityRRs = buffer.readUInt16BE(8);
    message.header.totalAdditionalRRs = buffer.readUInt16BE(10);

    var dataBuffer = buffer.slice(12);
    var rr;
    var i;

    console.log('PARSED HEADERS');
    console.log(message.toString());
    console.log('');

    console.log('RDATA BUFFER');
    console.log(dataBuffer);
    console.log('');

    for (i = 0; i < message.header.totalQuestions; i++) {
        rr = QuestionResourceRecord.parse(dataBuffer);
        message.resourceRecords.questions.push(rr);
        dataBuffer = dataBuffer.slice(rr.length);
    }

    console.log('RDATA BUFFER');
    console.log(dataBuffer);
    console.log('');

    for (i = 0; i < message.header.totalAnswerRRs; i++) {
        rr = AnswerResourceRecord.parse(dataBuffer);
        message.resourceRecords.answers.push(rr);
        dataBuffer = dataBuffer.slice(rr.length);
    }

    console.log('RDATA BUFFER');
    console.log(dataBuffer);
    console.log('');

    for (i = 0; i < message.header.totalAuthorityRRs; i++) {
        rr = AnswerResourceRecord.parse(dataBuffer);
        message.resourceRecords.authorities.push(rr);
        dataBuffer = dataBuffer.slice(rr.length);
    }

    console.log('RDATA BUFFER');
    console.log(dataBuffer);
    console.log('');

    for (i = 0; i < message.header.totalAdditionalRRs; i++) {
        rr = AnswerResourceRecord.parse(dataBuffer);
        message.resourceRecords.additionals.push(rr);
        dataBuffer = dataBuffer.slice(rr.length);
    }

    console.log('RDATA BUFFER');
    console.log(dataBuffer);
    console.log('');

    return message;
};

Message.TYPE = {
    QUERY: 0,
    RESPONSE: 1
};

Message.OPCODE = {
    QUERY: 0,
    IQUERY: 1,
    STATUS: 2
};

Message.RCODE = {
    NOERROR: 0,
    FORMATERROR: 1,
    SERVERFAILURE: 2,
    NAMEERROR: 3,
    NOTIMPLEMENTED: 4,
    REFUSED: 5
};

module.exports = Message;
