var fs = require('fs');
var path = require('path');
var ws = require('../../prototype2/workshop');
var nio = require('../../prototype2/skein');

var assert = require('assert');

__bit_abfunc = function(a, b, v)
{
	return a * v + b;
}

__bit_masks = [ 0, 0b1, 0b11, 0b111, 0b1111, 0b11111, 0b111111, 0b1111111, 0b11111111 ];

class BitTool
{
	constructor(ref, bitDefs/*[b|B, idx, sz]*/)
	{
		this._ref = ref;
		this._defs = bitDefs;

		let offset = 0;

		for ( let i = 0; i < this._defs.length; i++ )
		{
			let bB = this._defs[i].bB;  // bB is true then b else B
			let sz = this._defs[i].sz;

			this._defs[i].mask = __bit_masks[sz];
			this._defs[i].func = __bit_abfunc.bind(this._defs[i], bB ? 1 : -1, bB ? 0 : mask);
			this._defs[i].offset = offset;

			offset += sz;
		}
	}

	static parse(ref, defstr)
	{
		let tokens = null;
		let re = /\s*([bB])\s*(\d+)\s*\[\s*(\w+)?\s*:\s*(\d+)\s*\]\s*/g;
		let defs = [];

		while( (tokens = re.exec(defstr)) !== null )
		{
			let def = {};
			for ( var i = 0; i < tokens.length; i++ )
			{
				def.bB = tokens[1] == 'b';
				def.sz = parseInt(tokens[2]);
				def.ref = tokens[3];
				def.idx = tokens[4];
			}

			defs.push(def);
		}

		return new BitTool(ref, defs);
	}

	knit(cman)
	{
		let buf = 0;

		for ( let i = 0; i < this._defs.length; i++ )
		{
			let vmap = this._safeVMap(cman, this._defs[i].ref || this._ref);
			let vv = vmap[this._defs[i].idx] & this._defs[i].mask;
			vv = this._defs[i].func(vv);
			buf |= vv << (8 - this._defs[i].offset - this._defs[i].sz);
		}

		return buf;
	}

	unknit(cman, bb)
	{
		for ( let i = 0; i < this._defs.length; i++ )
		{
			let vmap = this._safeVMap(cman, this._defs[i].ref || this._ref);
			let vv = bb >> (8 - this._defs[i].offset - this._defs[i].sz);
			vv = vv & this._defs[i].mask;
			vmap[this._defs[i].idx] = vv;
		}
	}

	_safeVMap(cman, refKey)
	{
		if ( !(refKey in cman.ref) || !Array.isArray(cman.ref[refKey]) )
		{
			cman.ref[refKey] = [];
		}

		return cman.ref[refKey];
	}
}

describe("TestBitKnot", function() {

	it("testKnit1", function() {
		var knot = new BitTool("VV", [{"bB":true, idx:0, "sz":2}, {"bB":true, idx:1, "sz":2}, {"bB":true, idx:2, "sz":2}, {"bB":true, idx:3, "sz":2}]);
		var cman = { ref: { "VV":[1,2,3,0]}};

		var buf = knot.knit(cman);

		assert.equal(buf, 0b01101100);
	});
	it("testKnit2", function() {
		var knot = new BitTool("VV", [{"bB":true, idx:1, "sz":2}, {"bB":true, idx:2, "sz":2}, {"bB":true, idx:0, "sz":2}, {"bB":true, idx:3, "sz":2}]);
		var cman = { ref: { "VV":[1,2,3,0]}};

		var buf = knot.knit(cman);

		assert.equal(buf, 0b10110100);
	});
	it("testKnit3", function() {
		var knot = new BitTool("VV", [{"bB":true, idx:0, "sz":6}, {"bB":true, idx:1, "sz":2}]);
		var cman = { ref: { "VV":[0o41, 1]}};

		var buf = knot.knit(cman);

		assert.equal(buf, 0b10000101);
	});

	it("testUnknit1", function() {
		var knot = new BitTool("VV", [{"bB":true, idx:0, "sz":2}, {"bB":true, idx:1, "sz":2}, {"bB":true, idx:2, "sz":2}, {"bB":true, idx:3, "sz":2}]);
		var cman = { ref: { "VV":[]}};

		knot.unknit(cman, 0b01101100);

		assert.equal(cman.ref.VV.length, 4);
		assert.equal(cman.ref.VV[0], 1);
		assert.equal(cman.ref.VV[1], 2);
		assert.equal(cman.ref.VV[2], 3);
		assert.equal(cman.ref.VV[3], 0);
	});

	it("testUnknit2", function() {
		var knot = new BitTool("VV", [{"bB":true, idx:1, "sz":2}, {"bB":true, idx:2, "sz":2}, {"bB":true, idx:0, "sz":2}, {"bB":true, idx:3, "sz":2}]);
		var cman = { ref: { "VV":[]}};

		knot.unknit(cman, 0b10110100);

		assert.equal(cman.ref.VV.length, 4);
		assert.equal(cman.ref.VV[0], 1);
		assert.equal(cman.ref.VV[1], 2);
		assert.equal(cman.ref.VV[2], 3);
		assert.equal(cman.ref.VV[3], 0);
	});

	it("testUnknit3", function() {
		var knot = new BitTool("VV", [{"bB":true, idx:0, "sz":6}, {"bB":true, idx:1, "sz":2}]);
		var cman = { ref: { "VV":[]}};

		knot.unknit(cman, 0b10000101);

		assert.equal(cman.ref.VV.length, 2);
		assert.equal(cman.ref.VV[0], 0o41);
		assert.equal(cman.ref.VV[1], 1);
	});

	it("testParse1", function() {
		var knot = BitTool.parse("VV", "b6[:0]b2[:1]");
		var cman = { ref: { "VV":[]}};

		knot.unknit(cman, 0b10000101);
		assert.equal(cman.ref.VV.length, 2);
		assert.equal(cman.ref.VV[0], 0o41);
		assert.equal(cman.ref.VV[1], 1);

		var buf = knot.knit(cman);
		assert.equal(buf, 0b10000101);
	});

	it("testParse2", function() {
		var knot = BitTool.parse("VV", "b6[:0]b2[OT:1]");
		var cman = { ref: { "VV":[], "OT":[]}};

		knot.unknit(cman, 0b10000101);
		assert.equal(cman.ref.VV.length, 1);
		assert.equal(cman.ref.OT.length, 2);
		assert.equal(cman.ref.VV[0], 0o41);
		assert.equal(cman.ref.OT[1], 1);

		var buf = knot.knit(cman);
		assert.equal(buf, 0b10000101);
	});

	it("testCase1", function() {
		var knot = BitTool.parse("VV", "b6[:0]b2[OT:1]");
		var cman = { ref: { }};

		knot.unknit(cman, 0b10000101);
		assert.equal(cman.ref.VV.length, 1);
		assert.equal(cman.ref.OT.length, 2);
		assert.equal(cman.ref.VV[0], 0o41);
		assert.equal(cman.ref.OT[1], 1);

		var buf = knot.knit(cman);
		assert.equal(buf, 0b10000101);
	});

});

