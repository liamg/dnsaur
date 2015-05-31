var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var Message = require('./message');
var ResourceRecord = require('./resourceRecord').ResourceRecord;
var AnswerResourceRecord = require('./resourceRecord').AnswerResourceRecord;
var AResourceData = require('./resourceData').AResourceData;
var Client = require('./client');

// @todo Add options to all classes
// @todo Add proxy fallback mode - if operation isn't supported, pass the unedited packet to a fallback DNS server and proxy back the response
// @todo Emit some useful events

/**
 * DNS Server component
 * @constructor
 */
function Server() {
    this.udpSocket = dgram.createSocket("udp4");

    this.client = new Client();

    this.udpSocket.on("message", function (msg, rinfo) {
        this.handleRequest(msg, rinfo);
    }.bind(this));

    this.udpSocket.on("close", function () {
        this.emit('close');
    }.bind(this));

    this.udpSocket.on("error", function (error) {
        this.emit('error', error);
    }.bind(this));

    this.runningQueries = [];
}
util.inherits(Server, EventEmitter);

/**
 * Store an "in progress" query. Responses will be constructed as queries come back from other servers.
 * @param query     Message
 * @param response  Message
 * @param address   Address
 */
Server.prototype.addRunningQuery = function (query, response, address) {

    // @todo add timestamps here so we can detect failed queries by timeouts and return only successful records
    this.runningQueries.push({
        query: query,
        response: response,
        address: address
    });
};

/**
 * Update once or more "in progress" queries with a resposne from another server
 * @param response Message
 */
Server.prototype.updateRunningQuery = function (response) {

    var i, j, query, arr;

    var answers = response.getAnswers();
    for(i = 0; i < response.getAnswerCount(); i++){
        for(j = 0; j < this.runningQueries.length; j++){
            query = this.runningQueries[j].query;
            if( query.getName() === answers[i].getName() &&
                query.getType() === answers[i].getType() &&
                query.getClass() === answers[i].getClass()
            ){
                arr = new AnswerResourceRecord();
                arr.setName(query.getName());
                arr.setType(query.getType());
                arr.setClass(query.getClass());
                arr.setResourceData(answers[i].getResourceData());
                this.runningQueries[j].response.addAnswerResourceRecord(arr);
            }
        }
    }

    var authorities = response.getAuthorities();
    for(i = 0; i < response.getAuthorityCount(); i++){
        for(j = 0; j < this.runningQueries.length; j++){
            query = this.runningQueries[j].query;
            if( query.getName() === authorities[i].getName() &&
                query.getType() === authorities[i].getType() &&
                query.getClass() === authorities[i].getClass()
            ){
                arr = new AnswerResourceRecord();
                arr.setName(query.getName());
                arr.setType(query.getType());
                arr.setClass(query.getClass());
                arr.setResourceData(authorities[i].getResourceData());
                this.runningQueries[j].response.addAuthorityResourceRecord(arr);
            }
        }
    }

    this.sendCompletedQueries();
};

/**
 * Check all "in progress" queries to see if we have any with enough data to send a response for
 */
Server.prototype.sendCompletedQueries = function(){
    var running, query;
    var remove = [];
    for(var j = 0; j < this.runningQueries.length; j++) {
        running = this.runningQueries[j];
        query = this.runningQueries[j].query;
        if(query.getQuestionCount() <= running.response.getAnswerCount() + running.response.getAuthorityCount()){
            this.sendResponse(running.response, running.address);
            remove.push(j);
        }
    }
    remove.forEach(function(index){
        this.runningQueries.splice(index, 1);
    }.bind(this));
};

Server.prototype.close = function () {
    this.udpSocket.close();
};

Server.prototype.handleRequest = function (data, address) {

    console.log('RAW:');
    console.log(data);
    console.log('');

    var query = Message.parse(data);

    console.log('REBUILT:');
    console.log(new Buffer(query.createRaw()));
    console.log('');

    if (query.getType() !== Message.TYPE.QUERY) {
        // this isn't a question - ignore.
        return;
    }

    this.emit('queryReceived', query, address);

    var response = new Message();
    response.setType(Message.TYPE.RESPONSE);
    response.setIdentification(query.getIdentification());

    var qrr, arr, rdata;
    var resolvedInternally = false;

    var fallbackQuery = new Message();
    fallbackQuery.setIdentification(query.getIdentification());
    fallbackQuery.setType(query.getType());

    for (var i = 0; i < query.header.totalQuestions; i++) {

        resolvedInternally = false;

        qrr = query.resourceRecords.questions[i];

        arr = new AnswerResourceRecord();
        arr.setName(qrr.getName());
        arr.setType(qrr.getType());
        arr.setClass(qrr.getClass());

        switch (qrr.type) {
            case ResourceRecord.TYPE.A:

                // @todo: resolution logic here
                if(qrr.getName() === 'butt') {
                    rdata = new AResourceData();
                    rdata.setAddress('127.0.0.1');
                    arr.setResourceData(rdata);
                    response.addAnswerResourceRecord(arr);
                }
                break;
            default:
                // @todo log the fact we have no idea what this is...
                break;
        }

        if(!resolvedInternally){
            fallbackQuery.addQuestionResourceRecord(qrr);
        }
    }

    this.addRunningQuery(query, response, address);

    if(fallbackQuery.getQuestionCount() > 0){ // if we have unanswered questions to send to fallback, do so here

        this.client.on('querySent', function(query, address){
            this.emit('querySent', query, address);
        }.bind(this));

        this.client.on('responseReceived', function(response, address){
            this.emit('responseReceived', response, address);
        }.bind(this));

        this.client.sendQuery(query, function(response){
            this.updateRunningQuery(response);
        }.bind(this));
    }

    this.sendCompletedQueries();
};

Server.prototype.sendResponse = function(response, address){
    var buffer = new Buffer(response.createRaw());
    this.udpSocket.send(buffer, 0, buffer.length, address.port, address.address);
    this.emit('responseSent', response, address);
};

Server.prototype.listen = function (port) {
    port = typeof port === 'undefined' ? 53 : port;
    this.udpSocket.bind(port);
};

module.exports = Server;
