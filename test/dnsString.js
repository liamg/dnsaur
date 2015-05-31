var expect = require('chai').expect;
var DNSString = require('../lib/dnsString.js');

describe('DNSString', function(){
    describe("encode()", function(){
        it("should return a byte array encoded in DNS notation format when supplied with a domain name as a string", function(){
            expect(DNSString.encode('google.com')).to.deep.equal([6, 103, 111, 111, 103, 108, 101, 3, 99, 111, 109, 0]);
        });
    });
    describe("decode()", function(){
        it("should return a domain name as a string when supplied with a byte array encoded in DNS notation format", function(){
            expect(DNSString.decode([6, 103, 111, 111, 103, 108, 101, 3, 99, 111, 109, 0])).to.equal('google.com');
        });
    });
});