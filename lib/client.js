var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Message = require('./message');
var ResourceRecord = require('./resourceRecord').ResourceRecord;
var OptResourceRecord = require('./resourceRecord').OptResourceRecord;
var QuestionResourceRecord = require('./resourceRecord').QuestionResourceRecord;

// @todo Emit some useful events

var Client = function () {
    this.host = '194.168.4.100';
    this.port = 53;
    this.queries = [];
};
util.inherits(Client, EventEmitter);

Client.prototype.query = function (name, type, callback) {
    var message = new Message();
    message.setType(Message.TYPE.QUERY);

    var qrr = new QuestionResourceRecord();
    qrr.setClass(ResourceRecord.CLASS.IN);
    qrr.setType(type);
    qrr.setName(name);

    message.addQuestionResourceRecord(qrr);

    // Show EDNS support
    var opt = new OptResourceRecord();
    message.addAdditionalResourceRecord(opt);

    this.sendQuery(message, callback);
};

Client.prototype.sendQuery = function (message, callback) {

    var buffer = new Buffer(message.createRaw());
    console.log('BUILT FORWARD')
    console.log(buffer)
    console.log('');

    var socket = dgram.createSocket('udp4');

    this.queries[message.getIdentification()] = {
        socket: socket,
        callback: callback
    };

    socket.on("message", function (data, address) {
        console.log('RAW RESPONSE');
        console.log(data);
        console.log('');
        var response = Message.parse(data);
        this.emit('responseReceived', response, address);
        this.queries[response.getIdentification()].callback(response);
    }.bind(this));

    socket.send(buffer, 0, buffer.length, this.port, this.host);

    this.emit('querySent', message, {address: this.host, port: this.port});
};

module.exports = Client;