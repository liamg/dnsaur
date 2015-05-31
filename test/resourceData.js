var expect = require('chai').expect;
var AResourceData = require('../lib/resourceData.js').AResourceData;

// @todo Tests for other RData types

describe('AResourceData', function(){
    describe("parse()", function(){
        it("should accept a buffer containing an IPv4 address and store the address as 4 bytes in the address property", function(){
            var ard = AResourceData.parse([127,0,0,1]);
            expect(ard.address).to.deep.equal([127,0,0,1]);
        });
    });
    describe("setAddress()", function(){
        it("should accept a human readable IPv4 address and store the address as 4 bytes in the address property", function(){
            var ard = new AResourceData();
            ard.setAddress('127.0.0.1')
            expect(ard.address).to.deep.equal([127,0,0,1]);
        });
    });
    describe("getAddress()", function(){
        it("should return the stored IP address in human readable format", function(){
            var ard = new AResourceData();
            ard.setAddress('127.0.0.1')
            expect(ard.getAddress()).to.equal('127.0.0.1');
        });
    });
    describe("createRaw()", function(){
        it("should return a byte array containing the internally stored IP address", function(){
            var ard = new AResourceData();
            ard.setAddress('127.0.0.1')
            expect(ard.createRaw()).to.deep.equal([127,0,0,1]);
        });
    });
});