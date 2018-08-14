var fs = require('fs');
var path = require('path');
var ws = require('../../prototype2/workshop');
var nio = require('../../prototype2/yarn');

var assert = require('assert');

describe("TestEnv", function() {

	it("assertEnv", function() {
		console.log("__dirname=" + __dirname);
		var spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_env.json'), 'utf8'));
		var workshop = knot.setupWorkshop(spec, undefined);

		assert.equal(workshop.env.version, "1.0");
		assert.equal(workshop.env.protocol, "NONE");
		assert.equal(workshop.env.comments, "This is a json file for testing environment section");
		assert.equal(workshop.env.author, "ZCUBE");
		assert.equal(workshop.env.licenced, "CC-BY");
	});
});


describe("TestKnot", function() {
	it("testRef", function() {
		let spec = JSON.parse('{"method":"bin.big_endian", "size":4, "ref":"VAR1"}');
		let knot = ws.Knot.ready(spec);
		let cman = new ws.CraftsMan();

		let yarn = nio.Yarn.allocate(1024);
		let testVal = [24765];
		cman.ref["VAR1"] = testVal;

		knot.knit(cman, yarn);
		assert.equal(yarn.position, 4);

		yarn.flip();
		assert.equal(yarn.remaining(), 4);

		knot.unknit(cman, yarn);
		assert.equal(cman.ref["VAR1"][0], testVal);
	});

	it("testIter", function() {
		let spec = JSON.parse('{"method":"bin.big_endian", "size":4, "ref":"VAR1", "iter":3}');
		let knot = ws.Knot.ready(spec);
		let cman = new ws.CraftsMan();

		let yarn = nio.Yarn.allocate(1024);
		let testVal = [2345, 12, 9876];
		cman.ref["VAR1"] = testVal;

		knot.knit(cman, yarn);
		assert.equal(yarn.position, 12);
		yarn.flip();
		assert.equal(yarn.remaining(), 12);

		knot.unknit(cman, yarn);
		assert.equal(cman.ref["VAR1"].length, testVal.length);
		assert.equal(cman.ref["VAR1"][0], testVal[0]);
		assert.equal(cman.ref["VAR1"][1], testVal[1]);
		assert.equal(cman.ref["VAR1"][2], testVal[2]);
	});


	it("testBit", function() {
		let spec = JSON.parse('{"method":"bit.big_endian", "size":4, "ref":"VAR1", "iter":3}');
		let knot = ws.Knot.ready(spec);
		let cman = new ws.CraftsMan();

		let yarn = nio.Yarn.allocate(1024);
		let testVal = [2345, 12, 9876];
		cman.ref["VAR1"] = testVal;

		knot.knit(cman, yarn);
		assert.equal(yarn.position, 12);
		yarn.flip();
		assert.equal(yarn.remaining(), 12);

		knot.unknit(cman, yarn);
		assert.equal(cman.ref["VAR1"].length, testVal.length);
		assert.equal(cman.ref["VAR1"][0], testVal[0]);
		assert.equal(cman.ref["VAR1"][1], testVal[1]);
		assert.equal(cman.ref["VAR1"][2], testVal[2]);
	});

});


describe("TestChunk", function() {

	it("testChunkModuleKit", function() {
		let spec = JSON.parse('{"method":"bytes", "size":4}');
		let kit = knot.ChunkModuleKit.setup(spec);
		assert.ok("ChunkModuleBytes" === kit.constructor.name);

		spec = JSON.parse('{"method":"mark", "start":[], "end":[], "markInclude":3}');
		kit = knot.ChunkModuleKit.setup(spec);
		assert.ok("ChunkModuleMark" === kit.constructor.name);

	});

	it("testChunkModuleBytes", function() {
		let spec = JSON.parse('{"method":"bytes", "size":4}');
		let kit = knot.ChunkModuleKit.setup(spec);
		assert.ok("ChunkModuleBytes" === kit.constructor.name);

		let yarn = nio.Yarn.wrap(new Buffer([0,1,2,3,0,0,0,2,0,1]));
		let chunk = kit.chunk(yarn);

		assert.ok(chunk);
		assert.equal(chunk.remaining(), 4);
		assert.equal(chunk.get(), 0);
		assert.equal(chunk.get(), 1);
		assert.equal(chunk.get(), 2);
		assert.equal(chunk.get(), 3);

		// 2nd case
		yarn = nio.Yarn.allocate(1024)
		yarn.put(0);
		yarn.put(2);
		yarn.flip();
		chunk = kit.chunk(yarn);
		assert.ok(chunk === undefined);

		yarn.compact();
		yarn.put(4);
		yarn.flip();
		chunk = kit.chunk(yarn);
		assert.ok(chunk === undefined);

		yarn.compact();
		yarn.put(6);
		yarn.flip();
		chunk = kit.chunk(yarn);
		assert.ok(chunk);
		assert.equal(chunk.remaining(), 4);
		assert.equal(chunk.get(), 0);
		assert.equal(chunk.get(), 2);
		assert.equal(chunk.get(), 4);
		assert.equal(chunk.get(), 6);

	});

	it("testChunkModuleMark", function() {
		let spec = JSON.parse('{"method":"mark", "markInclude":3}');
		try
		{
			let kit = knot.ChunkModuleKit.setup(spec);
		}
		catch(e)
		{
			assert.AssertionError
		}
		assert.ok("ChunkModuleMark" === kit.constructor.name);

	});
});

describe("TestComposite", function() {

	it("testReady", function() {
		let spec = JSON.parse('{"chunk":{"method":"bytes", "size":4}, "composites":[{"chunk":{"method":"bits", "size":2}, "iterate":"0"}]}');
		let tool = Tool.ready(spec);
		assert.equal(tool.subTools.length == 1);
	});



});

describe("TestTool", function() {

	it("testReady", function() {
		let spec = JSON.parse('{"chunk":{"method":"bytes", "size":4}, "composites":[{"chunk":{"method":"bits", "size":2}, "iterate":"0"}]}');
		let tool = Tool.ready(spec);
		assert.equal(tool.subTools.length == 1);
	});

});


