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

    this.getType = function () {
        return this.header.qr;
    };

    this.getOpCode = function () {
        return this.header.opcode;
    };

    this.getAA = function(){
        return this.header.aa;
    };

    this.getTC = function(){
        return this.header.tc;
    };

    this.getRD = function(){
        return this.header.rd;
    };

    this.getRA = function(){
        return this.header.ra;
    };

    this.getZ = function(){
        return this.header.z;
    };

    this.getAD = function(){
        return this.header.ad;
    };

    this.getCD = function(){
        return this.header.cd;
    };

    this.getRCode = function(){
        return this.header.rcode;
    };

    this.setIdentification = function (id) {
        this.header.identification = id;
    };

    this.getIdentification = function () {
        return this.header.identification;
    };

    this.setType = function (type) {
        switch (type) {
            case Message.TYPE.QUERY:
            case Message.TYPE.RESPONSE:
                this.header.qr = type;
                break;
            default:
                throw new Error('Unknown DNS message type supplied.');
        }
    };

    this.addQuestionResourceRecord = function (questionResourceRecord) {
        this.header.totalQuestions++;
        this.resourceRecords.questions.push(questionResourceRecord);
    };

    this.addAnswerResourceRecord = function (answerResourceRecord) {
        this.header.totalAnswerRRs++;
        this.resourceRecords.answers.push(answerResourceRecord);
    };

    this.addAuthorityResourceRecord = function (authorityResourceRecord) {
        this.header.totalAuthorityRRs++;
        this.resourceRecords.authorities.push(authorityResourceRecord);
    };

    this.addAdditionalResourceRecord = function (additionalResourceRecord) {
        this.header.totalAdditionalRRs++;
        this.resourceRecords.additionals.push(additionalResourceRecord);
    };
};

Message.prototype = {

    // @todo Replace createBuffer() methods with createRaw(), returning byte arrays

    createBuffer: function () {
        var bytes = [];

        bytes.push( (this.getIdentification() >> 8) & 0xFF );
        bytes.push( this.getIdentification() & 0xFF );

        var flags1 = 0;
        var flags2 = 0;

        flags1 |= (this.getType() << 7); // QR
        flags1 |= ((this.getOpCode() << 4) >> 1); // OPCODE
        flags1 |= ((this.getAA() << 7) >> 5); // aa
        flags1 |= ((this.getTC() << 7) >> 6); // tc
        flags1 |= ((this.getRD() << 7) >> 7); // rd

        flags2 |= (this.getRA() << 7);
        flags2 |= ((this.getZ() << 7) >> 1);
        flags2 |= ((this.getAD() << 7) >> 2);
        flags2 |= ((this.getCD() << 7) >> 3);
        flags2 |= this.getRCode();

        // @todo totals, resource records
        
        bytes.push( flags1 & 0xFF );
        bytes.push( flags2 & 0xFF );

        //var questions = this.getQuestions();

        //buffer.writeUInt16BE(questions.length);

        return new Buffer(bytes);
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
    message.header.opcode = (flags << 1) >> 12;
    message.header.aa = (flags << 5) >> 15;
    message.header.tc = (flags << 6) >> 15;
    message.header.rd = (flags << 7) >> 15;
    message.header.ra = (flags << 8) >> 15;
    message.header.z = (flags << 9) >> 15;
    message.header.ad = (flags << 10) >> 15;
    message.header.cd = (flags << 11) >> 15;
    message.header.rcode = (flags << 12) >> 12;
    message.header.totalQuestions = buffer.readUInt16BE(4);
    message.header.totalAnswerRRs = buffer.readUInt16BE(6);
    message.header.totalAuthorityRRs = buffer.readUInt16BE(8);
    message.header.totalAdditionalRRs = buffer.readUInt16BE(10);

    var dataBuffer = buffer.slice(12);
    var rr;
    var i;

    for (i = 0; i < message.header.totalQuestions; i++) {
        rr = QuestionResourceRecord.parse(dataBuffer);
        message.resourceRecords.questions.push(rr);
        dataBuffer = dataBuffer.slice(rr.length);
    }

    for (i = 0; i < message.header.totalAnswerRRs; i++) {
        rr = AnswerResourceRecord.parse(dataBuffer);
        message.resourceRecords.answers.push(rr);
        dataBuffer = dataBuffer.slice(rr.length);
    }

    for (i = 0; i < message.header.totalAuthorityRRs; i++) {
        rr = AnswerResourceRecord.parse(dataBuffer);
        message.resourceRecords.authorities.push(rr);
        dataBuffer = dataBuffer.slice(rr.length);
    }

    for (i = 0; i < message.header.totalAdditionalRRs; i++) {
        rr = AnswerResourceRecord.parse(dataBuffer);
        message.resourceRecords.additionals.push(rr);
        dataBuffer = dataBuffer.slice(rr.length);
    }


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
