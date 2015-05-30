var AnswerResourceRecord = require('./resourceRecord').AnswerResourceRecord;
var QuestionResourceRecord = require('./resourceRecord').QuestionResourceRecord;

var Message = function () {

    this.header = {
        identification: Math.floor(Math.random() * 0xFFFF),      // 2 bytes, unique query/response identifier
        qr: 0,                  // 1 bit, 0=query, 1=response
        opcode: 0,              // 4 bits
        aa: 0,                  // 1 bit
        tc: 0,                  // 1 bit
        rd: 0,                  // 1 bit
        ra: 0,                  // 1 bit
        z: 0,                   // 1 bit
        ad: 0,                  // 1 bit
        cd: 0,                  // 1 bit
        rcode: 0,               // 4 bits
        totalQuestions: 0,      // 2 bytes
        totalAnswerRRs: 0,      // 2 bytes
        totalAuthorityRRs: 0,   // 2 bytes
        totalAdditionalRRs: 0   // 2 bytes
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
    getBuffer: function () {
        var buffer = new Buffer(0xFFFF);

        buffer.writeUInt16BE(this.getIdentification(), 0);

        var flags = 0;

        flags |= (this.getType() << 15); // QR

        /// @todo Finish this off. Too tired tonight...

        buffer.writeUInt16BE(flags, 2);

        //var questions = this.getQuestions();

        //buffer.writeUInt16BE(questions.length);

        return buffer;
    }
};

Message.TYPE = {
    QUERY: 0,
    RESPONSE: 1
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

module.exports = Message;
