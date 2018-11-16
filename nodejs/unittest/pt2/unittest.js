var fs = require('fs');
var path = require('path');
var nio = require('../../prototype2/skein');
var assert = require('assert');

var rewire = require("rewire");
var ws = rewire('../../prototype2/workshop');

describe("TestEnv", function() {

	it("assertEnv", function() {
		console.log("__dirname=" + __dirname);
		var spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_env.json'), 'utf8'));
		var workshop = ws.setupWorkshop(spec, undefined);

		assert.equal(workshop.env.version, "1.0");
		assert.equal(workshop.env.protocol, "NONE");
		assert.equal(workshop.env.comments, "This is a json file for testing environment section");
		assert.equal(workshop.env.author, "ZCUBE");
		assert.equal(workshop.env.licenced, "CC-BY");
	});
});

describe("TestStitch", function() {

	const __ctx = {
		cman: undefined
	};

	before(function() {
		__ctx.cman = new ws.CraftsMan();
		__ctx.cman.refTable.addRef("VAR1", {name:"VAR1"});
	});

	it("testRefidx", function() {
		let StitchType = ws.__get__("Stitch");
		let stitch = new StitchType(__ctx.cman, 1);

		assert.equal(stitch.nextRefidx(0, 0, 0), 0);
		assert.equal(stitch.nextRefidx(0, 1, 0), 1);
	})
});

describe("TestRefTable", function() {

	it("test1", function() {
		let RefTableType = ws.__get__("RefTable");
		let table = new RefTableType();

		table.addRef("R1", {name:"R1"});
		assert.equal(table.refcount, 1);

		table.addRef("R2", {name:"R2"});
		table.addRef("R3", {name:"R3"});
		table.addRef("R4", {name:"R4"});
		assert.equal(table.refcount, 4);
		assert.equal(table.getRef("R2").__refnum, 1);
		assert.equal(table.getRefByNum(3).__refid, "R4");
	});
});

describe("TestCraftsMan", function() {

	it("test1", function() {
		let cman = new ws.CraftsMan();

		cman.newStitch();
		cman.newStitch();
		let stitch = cman.shiftStitch();
		assert.equal(stitch._seqnum, 0);
		stitch = cman.shiftStitch();
		assert.equal(stitch._seqnum, 1);
	});

	it("test_workingRefmemById", function() {
		let cman = new ws.CraftsMan();
		let table = cman.refTable;
		table.addRef("R1", {name:"R1"});
		let ref2 = table.addRef("R2", {name:"R2"});
		table.addRef("R3", {name:"R3"});

		cman.newStitch();
		let stitch = cman.stitch;
		let refmem = stitch.refmemById("R2");
		assert.ok(Array.isArray(refmem));

		refmem.push(100);
		let refmem2 = stitch.refmemByNum(ref2.__refnum);
		assert.equal(refmem[0], refmem2[0]);
	});
});

describe("TestKnot", function() {

	const __ctx = {
		cman: undefined
	};

	before(function() {
		__ctx.cman = new ws.CraftsMan();
		__ctx.cman.refTable.addRef("VAR1", {name:"VAR1"});
	});

	it("testBit1", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('{"syntax":"bit.b2[:0]b2[:1]b2[:2]b2[:3]", "refid":"VAR1"}');
		let knot = ws.__get__("Knot").ready(cman, spec);

		// knit
		let skein = nio.Skein.allocate(1024);
		let testVal = [1, 2, 3, 0];

		let stitch = cman.newStitch();
		let mem = stitch.refmemById("VAR1");
		testVal.forEach(function(e) { mem.push(e); })

		knot.knit(cman, skein);
		skein.flip();
		assert.equal(skein.remaining(), 1);
		let bb = skein.get();
		assert.equal(bb, 0b01101100);

		// unknit
		skein.reset();
		stitch = cman.newStitch();
		knot.unknit(cman, skein);

		mem = stitch.refmemById("VAR1");
		assert.equal(mem.length, testVal.length);
		for ( var i = 0; i < testVal.length; i++ )
		{
			assert.equal(mem[i], testVal[i]);
		}
	});

	it("testBinary1", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('{"syntax":"bin.b4", "refid":"VAR1"}');
		let knot = ws.__get__("Knot").ready(cman, spec);

		let skein = nio.Skein.allocate(1024);
		let testVal = [0x010234FA];
		let stitch = cman.newStitch();
		let mem = stitch.refmemById("VAR1");
		testVal.forEach(function(e) { mem.push(e); })

		knot.knit(cman, skein);
		skein.flip();
		assert.equal(skein.remaining(), 4);
		assert.equal(skein.get(), 0x01);
		assert.equal(skein.get(), 0x02);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0xFA);

		skein.reset();
		stitch = cman.newStitch();
		knot.unknit(cman, skein);

		mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], testVal[0]);
	});

	it("testBinary2", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('{"syntax":"bin.B4", "refid":"VAR1"}');
		let knot = ws.__get__("Knot").ready(cman, spec);

		let skein = nio.Skein.allocate(1024);
		let testVal = [0x010234FA];
		let stitch = cman.newStitch();
		let mem = stitch.refmemById("VAR1");
		testVal.forEach(function(e) { mem.push(e); })

		knot.knit(cman, skein);
		skein.flip();
		assert.equal(skein.remaining(), 4);
		assert.equal(skein.get(), 0xFA);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0x02);
		assert.equal(skein.get(), 0x01);

		skein.reset();
		stitch = cman.newStitch();
		knot.unknit(cman, skein);

		mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], testVal[0]);
	});

	it("testBinary3", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('{"syntax":"bin.b2b4", "refid":"VAR1"}');
		let knot = ws.__get__("Knot").ready(cman, spec);

		let skein = nio.Skein.allocate(1024);
		let testVal = [0x1234, 0x010234FA];
		let stitch = cman.newStitch();
		let mem = stitch.refmemById("VAR1");
		testVal.forEach(function(e) { mem.push(e); })

		knot.knit(cman, skein);
		skein.flip();
		assert.equal(skein.remaining(), 6);
		assert.equal(skein.get(), 0x12);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0x01);
		assert.equal(skein.get(), 0x02);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0xFA);

		skein.reset();
		stitch = cman.newStitch();
		knot.unknit(cman, skein);

		mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], testVal[0]);
		assert.equal(mem[1], testVal[1]);
	});


	it("testBinary-index", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('{"syntax":"bin.b2[:1]b4[:0]", "refid":"VAR1"}');
		let knot = ws.__get__("Knot").ready(cman, spec);

		let skein = nio.Skein.allocate(1024);
		let testVal = [0x010234FA, 0x1234];
		let stitch = cman.newStitch();
		let mem = stitch.refmemById("VAR1");
		testVal.forEach(function(e) { mem.push(e); })

		knot.knit(cman, skein);
		skein.flip();
		assert.equal(skein.remaining(), 6);
		assert.equal(skein.get(), 0x12);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0x01);
		assert.equal(skein.get(), 0x02);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0xFA);

		skein.reset();
		stitch = cman.newStitch();
		knot.unknit(cman, skein);

		mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], testVal[0]);
		assert.equal(mem[1], testVal[1]);
	});

});


describe("TestChunk", function() {

	it("testChunkModuleKit", function() {
		let spec = JSON.parse('{"method":"bytes", "size":4}');
		let kit = ws.__get__("ChunkModuleKit").setup(spec);
		assert.ok("ChunkModuleBytes" === kit.constructor.name);

		spec = JSON.parse('{"method":"mark", "start":[], "end":[], "markInclude":3}');
		kit = ws.__get__("ChunkModuleKit").setup(spec);
		assert.ok("ChunkModuleMark" === kit.constructor.name);

	});

	it("testChunkModuleBytes", function() {
		let spec = JSON.parse('{"method":"bytes", "size":4}');
		let kit = ws.__get__("ChunkModuleKit").setup(spec);
		assert.ok("ChunkModuleBytes" === kit.constructor.name);

		let skein = nio.Skein.wrap(new Buffer([0,1,2,3,0,0,0,2,0,1]));
		let chunk = kit.chunk(undefined, skein);

		assert.ok(chunk);
		assert.equal(chunk.remaining(), 4);
		assert.equal(chunk.get(), 0);
		assert.equal(chunk.get(), 1);
		assert.equal(chunk.get(), 2);
		assert.equal(chunk.get(), 3);

		// 2nd case
		skein = nio.Skein.allocate(1024)
		skein.put(0);
		skein.put(2);
		skein.flip();
		chunk = kit.chunk(undefined, skein);
		assert.ok(chunk === undefined);

		skein.compact();
		skein.put(4);
		skein.flip();
		chunk = kit.chunk(undefined, skein);
		assert.ok(chunk === undefined);

		skein.compact();
		skein.put(6);
		skein.flip();
		chunk = kit.chunk(undefined, skein);
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
			let kit = ws.__get__("ChunkModuleKit").setup(spec);
			assert.ok("ChunkModuleMark" === kit.constructor.name);
		}
		catch(e)
		{
			assert.AssertionError
		}
	});
});


describe("TestTool", function() {

	const __ctx = {
		cman: undefined
	};

	before(function() {
		__ctx.cman = new ws.CraftsMan();
		__ctx.cman.refTable.addRef("VAR1", {name:"VAR1"});
	});

	it("testReady", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let tool = ws.__get__("Tool").ready(cman, spec.tools["PP1"]);

		assert.equal(tool.flow.length, 1);
	});

	it("testSimple", function() {
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let tool = ws.__get__("Tool").ready(cman, spec.tools["PP1"]);
		let skein = nio.Skein.wrap(new Buffer([0,1,2,6]));

		let stitch = cman.newStitch();
		tool.unknit(cman, skein);

		let mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], 0x0206);
		assert.equal(mem[1], 0x0001);
	});


	it("testSimple2", function() {
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let tool = ws.__get__("Tool").ready(cman, spec.tools["PP2"]);
		let skein = nio.Skein.wrap(new Buffer([0,1,2,6, 3,4,5,6]));

		let stitch = cman.newStitch();
		tool.unknit(cman, skein);

		let mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], 0x0206);
		assert.equal(mem[1], 0x0001);
		assert.equal(mem[2], 0x0506);
		assert.equal(mem[3], 0x0304);
	});

});


describe("TestWorkshop", function() {

	const __ctx = {
		cman: undefined
	};

	before(function() {
		__ctx.cman = new ws.CraftsMan();
		__ctx.cman.refTable.addRef("VAR1", {name:"VAR1"});
	});

	it("testSetup", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let workshop = ws.setupWorkshop(spec, cman);

		assert.equal(Object.keys(workshop.tools).length, 2);
	});

	it("testKnit", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let workshop = ws.setupWorkshop(spec, cman);

		let skein = nio.Skein.allocate(1024);
		workshop.knit("T1", skein);


	});


	it("test.unknit", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let workshop = ws.setupWorkshop(spec, cman);

		let skein = nio.Skein.wrap(new Buffer([0,1,2,6, 3,4,5,6]));
		workshop.unknit("T2", skein);


	});

});

