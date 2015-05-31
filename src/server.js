var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Message = require('./message');
var ResourceRecord = require('./resourceRecord').ResourceRecord;
var AnswerResourceRecord = require('./resourceRecord').AnswerResourceRecord;

// @todo Add options to all classes
// @todo Add proxy fallback mode - if operation isn't supported, pass the unedited packet to a fallback DNS server and proxy back the response

function Server() {
    this.udpSocket = dgram.createSocket("udp4");

    this.udpSocket.on("message", function (msg, rinfo) {
        this.handleRequest(msg, rinfo);
    }.bind(this));

    this.udpSocket.on("close", function () {
        this.emit('close');
    }.bind(this));

    this.udpSocket.on("error", function (error) {
        this.emit('error', error);
    }.bind(this));
}
util.inherits(Server, EventEmitter);

Server.prototype.close = function () {
    this.udpSocket.close();
};

Server.prototype.handleRequest = function (data, address) {

    var query = Message.parse(data);

    if (query.getType() !== Message.TYPE.QUERY) {
        // this isn't a question - ignore.
        return;
    }

    this.emit('queryReceived', query, address);

    var response = new Message();
    response.setType(Message.TYPE.RESPONSE);
    response.setIdentification(query.getIdentification());

    var rr;

    for (var i = 0; i < query.header.totalQuestions; i++) {

        switch (query.resourceRecords.questions[i].type) {
            case ResourceRecord.TYPE.A:
                rr = new AnswerResourceRecord();
                // @todo: resolution logic
                response.addAnswerResourceRecord(rr);
                break;
            default:
                console.log('Unsupported query type requested: ' + require('./util').invertObject(ResourceRecord.TYPE)[query.resourceRecords.questions[i].type]);
                return; // @todo Act as a proxy and forward these unedited buffers to a foreign server
                break;
        }
    }

    var buffer = response.createBuffer();
    this.udpSocket.send(buffer, 0, buffer.length, address.port, address.address);
    this.emit('responseSent', response, address);
};

Server.prototype.listen = function (port) {
    port = typeof port === 'undefined' ? 53 : port;
    this.udpSocket.bind(port);
};

module.exports = Server;
