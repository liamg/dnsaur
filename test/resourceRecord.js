var expect = require('chai').expect;
var ResourceRecord = require('../lib/resourceRecord.js').ResourceRecord;
var QuestionResourceRecord = require('../lib/resourceRecord.js').QuestionResourceRecord;
var AnswerResourceRecord = require('../lib/resourceRecord.js').AnswerResourceRecord;
var AResourceData = require('../lib/resourceData.js').AResourceData;

var chai = require("chai");
chai.config.includeStack = true;

describe('ResourceRecord', function(){
    describe("setName()", function(){
        it("should set the internal name property to the given value", function(){
            var rr = new ResourceRecord();
            rr.setName('google.com');
            expect(rr.name).to.equal('google.com');
            rr.setName('');
            expect(rr.name).to.equal('');
            rr.setName('butt');
            expect(rr.name).to.equal('butt');
        });
    });
    describe("getName()", function(){
        it("should return the value of the internal name property", function(){
            var rr = new ResourceRecord();
            rr.name = 'google.com';
            expect(rr.getName()).to.equal('google.com');
        });
    });
    describe("setType()", function(){
        it("should set the internal type property to the given value", function(){
            var rr = new ResourceRecord();
            rr.setType(ResourceRecord.TYPE.A);
            expect(rr.type).to.equal(ResourceRecord.TYPE.A);
            rr.setType(ResourceRecord.TYPE.CNAME);
            expect(rr.type).to.equal(ResourceRecord.TYPE.CNAME);
            rr.setType(ResourceRecord.TYPE.PTR);
            expect(rr.type).to.equal(ResourceRecord.TYPE.PTR);
        });
    });
    describe("getType()", function(){
        it("should return the value of the internal type property", function(){
            var rr = new ResourceRecord();
            rr.type = ResourceRecord.TYPE.SOA;
            expect(rr.getType()).to.equal(ResourceRecord.TYPE.SOA);
            rr.type = ResourceRecord.TYPE.A;
            expect(rr.getType()).to.equal(ResourceRecord.TYPE.A);
        });
    });
    describe("setClass()", function(){
        it("should set the internal class property to the given value", function(){
            var rr = new ResourceRecord();
            rr.setClass(ResourceRecord.CLASS.IN);
            expect(rr.class).to.equal(ResourceRecord.CLASS.IN);
            rr.setClass(7);
            expect(rr.class).to.equal(7);
        });
    });
    describe("getClass()", function(){
        it("should return the value of the internal class property", function(){
            var rr = new ResourceRecord();
            rr.class = ResourceRecord.CLASS.IN;
            expect(rr.getClass()).to.equal(ResourceRecord.CLASS.IN);
            rr.class = 7;
            expect(rr.getClass()).to.equal(7);
        });
    });
});

describe('QuestionResourceRecord', function() {
    describe("createRaw()", function () {
        it("should return a byte array corresponding to the internal properties, formatted as described in the DNS RFC", function () {
            var qrr = new QuestionResourceRecord();

            qrr.setName('google.com');
            qrr.setType(ResourceRecord.TYPE.A);
            qrr.setClass(ResourceRecord.CLASS.IN);

            expect(qrr.createRaw()).to.deep.equal([6, 103, 111, 111, 103, 108, 101, 3, 99, 111, 109, 0, 0, 1, 0, 1]);
        });
    });
    describe("parse()", function () {
        it("should parse a buffer formatted as described in the DNS RFC, into the expected set of properties", function () {
            var qrr = QuestionResourceRecord.parse(new Buffer([6, 103, 111, 111, 103, 108, 101, 3, 99, 111, 109, 0, 0, 1, 0, 1]));

            expect(qrr.getName()).to.equal('google.com');
            expect(qrr.getType()).to.equal(ResourceRecord.TYPE.A);
            expect(qrr.getClass()).to.equal(ResourceRecord.CLASS.IN);
        });
    });
});

describe('AnswerResourceRecord', function() {
    describe("createRaw()", function () {
        it("should return a byte array corresponding to the internal properties, formatted as described in the DNS RFC", function () {
            var arr = new AnswerResourceRecord();

            arr.setName('google.com');
            arr.setType(ResourceRecord.TYPE.A);
            arr.setClass(ResourceRecord.CLASS.IN);
            arr.setTTL(64);

            var rData = new AResourceData();
            rData.setAddress('127.0.0.1');

            arr.setResourceData(rData);

            expect(arr.createRaw()).to.deep.equal([6, 103, 111, 111, 103, 108, 101, 3, 99, 111, 109, 0, 0, 1, 0, 1, 0, 0, 0, 64, 0, 4, 127, 0, 0, 1]);
        });
    });
    describe("parse()", function () {
        it("should parse a buffer formatted as described in the DNS RFC, into the expected set of properties", function () {

            var arr = AnswerResourceRecord.parse(new Buffer([6, 103, 111, 111, 103, 108, 101, 3, 99, 111, 109, 0, 0, 1, 0, 1, 0, 0, 0, 64, 0, 4, 127, 0, 0, 1]));

            var rData = new AResourceData();
            rData.setAddress('127.0.0.1');

            expect(arr.getName()).to.equal('google.com');
            expect(arr.getType()).to.equal(ResourceRecord.TYPE.A);
            expect(arr.getClass()).to.equal(ResourceRecord.CLASS.IN);
            expect(arr.getTTL()).to.equal(64);
            expect(arr.getResourceDataLength()).to.equal(4);
            expect(arr.getResourceData()).to.deep.equal(rData);
        });
    });
});