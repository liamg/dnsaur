var expect = require('chai').expect;
var ip = require('../lib/ip.js');

describe('IP', function(){
    describe("toString()", function(){
        it("should return a human readable IPv4 address when given an array of 4 bytes", function(){
            expect(ip.toString([127,0,0,1])).to.equal('127.0.0.1');
            expect(ip.toString([8,8,8,8])).to.equal('8.8.8.8');
            expect(ip.toString([0,0,0,0])).to.equal('0.0.0.0');
            expect(ip.toString([255,255,255,255])).to.equal('255.255.255.255');
            expect(ip.toString([1,2,3,4])).to.equal('1.2.3.4');
            expect(ip.toString([253,231,123,79])).to.equal('253.231.123.79');
        });
        it("should return a human readable IPv6 address when given an array of 16 bytes", function(){
            expect(ip.toString([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])).to.equal('0000:0000:0000:0000:0000:0000:0000:0000');
            expect(ip.toString([255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255])).to.equal('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
            expect(ip.toString([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16])).to.equal('0102:0304:0506:0708:090a:0b0c:0d0e:0f10');
        });
    });
    describe("toBytes()", function(){
        it("should return an array of 4 bytes when given a human readable IPv4 address", function(){
            expect(ip.toBytes('127.0.0.1')).to.deep.equal([127,0,0,1]);
            expect(ip.toBytes('8.8.8.8')).to.deep.equal([8,8,8,8]);
            expect(ip.toBytes('0.0.0.0')).to.deep.equal([0,0,0,0]);
            expect(ip.toBytes('255.255.255.255')).to.deep.equal([255,255,255,255]);
            expect(ip.toBytes('1.2.3.4')).to.deep.equal([1,2,3,4]);
            expect(ip.toBytes('253.231.123.79')).to.deep.equal([253,231,123,79]);
        });
        it("should return an array of 16 bytes when given a human readable IPv6 address", function(){
            expect(ip.toBytes('0000:0000:0000:0000:0000:0000:0000:0000')).to.deep.equal([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]);
        });
    });
});