var fs = require('fs');
var path = require('path');
var assert = require('assert');

var nio = require('../../prototype2/skein');


describe("TestYarnUtils", function() {

	it("test_itoa", function() {
		assert.equal(nio.Util.itoa(0x0F, 2), "F");
		assert.equal(nio.Util.itoa(0x0F, 2, '0'), "0F");
		assert.equal(nio.Util.itoa(0x000F, 4), "F");
		assert.equal(nio.Util.itoa(0x00F0, 4), "F0");
		assert.equal(nio.Util.itoa(0x0F00, 4), "F00");
		assert.equal(nio.Util.itoa(0xF000, 4), "F000");
		assert.equal(nio.Util.itoa(0x000F, 4, '0'), "000F");
		assert.equal(nio.Util.itoa(0x00F0, 4, '0'), "00F0");
		assert.equal(nio.Util.itoa(0x0F00, 4, '0'), "0F00");
		assert.equal(nio.Util.itoa(0xF000, 4, '0'), "F000");

		assert.equal(nio.Util.itoa(0x000F), "F");
		assert.equal(nio.Util.itoa(0x00F0), "F0");
		assert.equal(nio.Util.itoa(0x0F00), "F00");
		assert.equal(nio.Util.itoa(0xF000), "F000");

		assert.equal(nio.Util.itoa(0x000F, 3), "F");
		assert.equal(nio.Util.itoa(0x00F0, 3), "F0");
		assert.equal(nio.Util.itoa(0x0F00, 3), "F00");
		assert.equal(nio.Util.itoa(0xF000, 3), "000");
		assert.equal(nio.Util.itoa(0x000F, 3, ' '), "  F");
		assert.equal(nio.Util.itoa(0x00F0, 3, ' '), " F0");
		assert.equal(nio.Util.itoa(0x0F00, 3, ' '), "F00");
		assert.equal(nio.Util.itoa(0xF000, 3, ' '), "000");
	});

	/*
	it("test_itoa_performance1", function() {

		let s = [];
		for ( let i = 0; i < 20000; i++ )
		{
			s[i] = String.fromCharCode(0x30, 0x32, 0x33, 0x34, 0x36);
		}
	});

	it("test_itoa_performance1", function() {

		let s = [];
		for ( let i = 0; i < 20000; i++ )
		{
			let cc = [];
			for ( let k = 0; k < 5; k++ )
			{
				cc[k] = 0x30 + k;
			}
			s[i] = String.fromCharCode.apply(String, cc);
		}
	});


	it("test_itoa_performance2", function() {

		let s = [];
		for ( let i = 0; i < 20000; i++ )
		{
			s[i] = '';
			for ( let k = 0; k < 5; k++ )
			{
				s[i] = s[i] + 'A';
			}
		}
	});
	*/
});

describe("TestYarn", function() {

	it("testWrap", function() {
		let buf = nio.Yarn.wrap([0x30,0x31,0x32,0x33]);
		assert.equal(buf.get(), 0x30);
		assert.equal(buf.getShort(), 0x3132);
		assert.equal(buf.get(), 0x33);

		buf = nio.Yarn.wrap(new Buffer([0x35,0x36,0x37,0x38]));
		assert.equal(buf.get(), 0x35);
		assert.equal(buf.getShort(), 0x3637);
		assert.equal(buf.get(), 0x38);
	});

	it("testToString", function() {
		let buf = nio.Yarn.wrap([0x30,0x31,0x32,0x33,0x34,0x35,0x36,0x37,0x38,0x39,0x41,0x42,0x43,0x44,0x45,0x46, 0x30,0x31,0x00,0x00]);
		console.log(buf.toHexString());
	});

});