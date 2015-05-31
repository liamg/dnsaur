var dnsaur = require('./dnsaur');
var ResourceRecord = require('./resourceRecord').ResourceRecord;

console.log('');
console.log('');

var server = new dnsaur.Server();
server.on('queryReceived', function(query, address){
    console.log('');
    console.log('Query received from ' + address.address + ':' + address.port);
    console.log(query.toString());
    console.log('');
});
server.on('responseSent', function(response, address){
    console.log('');
    console.log('Response sent to ' + address.address + ':' + address.port);
    console.log(response.toString());
    console.log('');
});
server.on('querySent', function(query, address){
    console.log('');
    console.log('Query sent to ' + address.address + ':' + address.port);
    console.log(query.toString());
    console.log('');
});
server.on('responseReceived', function(response, address){
    console.log('');
    console.log('Response received from ' + address.address + ':' + address.port);
    console.log(response.toString());
    console.log('');
});
server.listen();

console.log('');
console.log('');