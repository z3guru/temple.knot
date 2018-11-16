var fs = require('fs');
var path = require('path');
var nio = require('./skein');
var assert = require('assert');

var rewire = require("rewire");
var ws = rewire('./workshop');

describe("TestProcess", function() {

	const __ctx = {
		workshop: undefined
		, cman: undefined
	};

	before(function() {
		__ctx.cman = new ws.CraftsMan();
		__ctx.cman.refTable.addRef("VAR1", {name:"VAR1"});
	});

	class SimpleTool
	{
		unknit(stitch, skein) { return true; /*done*/ }
	}

	class CantDoneTool
	{
		unknit(stitch, skein) {
			stitch.toolStack.push(this);
			return false; /*done*/
		}
	}

	it("testAllDone", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('[]');

		let ProcessType = ws.__get__("Process");
		let pp = new ProcessType();

		pp.tools.push(new SimpleTool());
		pp.tools.push(new SimpleTool());
		pp.tools.push(new SimpleTool());

		let stitch = cman.newStitch();
		let skein = nio.Skein.wrap(new Buffer([0,1,2,3,0,0,0,2,0,1]));
		pp.unknit(stitch, skein);
		assert.equal(pp.state, ProcessType.State.DONE);
	});

	it("testNotDone", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('[]');

		let ProcessType = ws.__get__("Process");
		let pp = new ProcessType();

		pp.tools.push(new SimpleTool());
		pp.tools.push(new CantDoneTool());
		pp.tools.push(new SimpleTool());

		let stitch = cman.newStitch();
		let skein = nio.Skein.wrap(new Buffer([0,1,2,3,0,0,0,2,0,1]));
		pp.unknit(stitch, skein);
		assert.equal(pp.state, ProcessType.State.RUN);
		assert.equal(stitch.toolStack.length, 2);

		pp.unknit(stitch, skein);
		assert.equal(pp.state, ProcessType.State.RUN);
		assert.equal(stitch.toolStack.length, 2);
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

		assert.equal(Object.keys(workshop.toolMap).length, 2);
		assert.equal(Object.keys(workshop.processMap).length, 2);
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
		workshop.unknit("T3", skein);
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

	it("testReady2", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let tool = ws.__get__("Tool").ready(cman, spec.tools["GroupTool"]);

		assert.equal(tool.subtools.length, 2);
	});

	it("testGroupTool", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let tool = ws.__get__("Tool").ready(cman, spec.tools["GroupTool"]);

		let stitch = cman.newStitch();
		tool.unknit(stitch, nio.Skein.wrap(new Buffer([0,1,2,6])));

		assert.equal(stitch.toolStack.length, 2);
	});

	it("testChunk", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let shop = ws.setupWorkshop(spec, cman);
		let tool = shop.toolMap['CHUNK_4BYTES'];

		let stitch = cman.newStitch();
		let skein = nio.Skein.allocate(1024);

		skein.put(0);
		skein.put(1);
		skein.flip();
		let result = tool.unknit(stitch, skein);
		assert.ok(result === false);

		skein.compact();
		skein.put(2);
		skein.flip();
		result = tool.unknit(stitch, skein);
		assert.ok(result === false);

		skein.compact();
		skein.put(3);
		skein.flip();
		result = tool.unknit(stitch, skein);
		assert.ok(result === true);
	});

	it("testChunkAndKnot", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let shop = ws.setupWorkshop(spec, cman);
		let tool = shop.toolMap['CHUNK_4BYTES'];

		let stitch = cman.newStitch();
		let skein = nio.Skein.allocate(1024);

		skein.put(0);
		skein.put(1);
		skein.flip();
		let result = tool.unknit(cman, skein);
		assert.ok(result === false);

		skein.compact();
		skein.put(2);
		skein.flip();
		result = tool.unknit(cman, skein);
		assert.ok(result === false);

		skein.compact();
		skein.put(3);
		skein.flip();
		result = tool.unknit(cman, skein);
		assert.ok(result === true);

		let mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], 0x0203);
		assert.equal(mem[1], 0x0001);
	});

	it("testNoChunk", function() {
		console.log("__dirname=" + __dirname);
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let shop = ws.setupWorkshop(spec, cman);
		let tool = shop.toolMap['NOCHUNK'];

		let stitch = cman.newStitch();
		let skein = nio.Skein.allocate(1024);

		skein.put(0);
		skein.put(1);
		skein.flip();
		let result = tool.unknit(cman, skein);
		assert.ok(result === false);

		skein.compact();
		skein.put(2);
		skein.flip();
		result = tool.unknit(cman, skein);
		assert.ok(result === false);

		skein.compact();
		skein.put(3);
		skein.flip();
		result = tool.unknit(cman, skein);
		assert.ok(result === true);

		let mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], 0x0203);
		assert.equal(mem[1], 0x0001);
	});

	//
	it("testSimple", function() {
		let spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './test_tool.json'), 'utf8'));
		let cman = __ctx.cman;
		let shop = ws.setupWorkshop(spec, cman);
		let tool = shop.toolMap['CHUNK_4BYTES'];

		let skein = nio.Skein.allocate(1024);
		let testVal = [0x5678, 0x1234];
		let stitch = cman.newStitch();
		let mem = stitch.refmemById("VAR1");
		testVal.forEach(function(e) { mem.push(e); })

		tool.knit(cman, skein);
		skein.flip();
		assert.equal(skein.remaining(), 4);
		assert.equal(skein.get(), 0x12);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0x56);
		assert.equal(skein.get(), 0x78);

		skein.reset();
		stitch = cman.newStitch();
		tool.unknit(cman, skein);

		mem = stitch.refmemById("VAR1");
		assert.equal(mem[0], testVal[0]);
		assert.equal(mem[1], testVal[1]);
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

	it("testBinary-def", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('{"syntax":"bin.b2[VAR1:1]b4[VAR2:0]"}');
		let knot = ws.__get__("Knot").ready(cman, spec);

		let skein = nio.Skein.allocate(1024);
		let stitch = cman.newStitch();

		let mem = stitch.refmemById("VAR1");
		[0x010234FA, 0x1234].forEach(function(e) { mem.push(e); })
		mem = stitch.refmemById("VAR2");
		[0xA1A2A3A4, 0x5678].forEach(function(e) { mem.push(e); })

		knot.knit(cman, skein);
		skein.flip();
		assert.equal(skein.remaining(), 6);
		assert.equal(skein.get(), 0x12);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0xA1);
		assert.equal(skein.get(), 0xA2);
		assert.equal(skein.get(), 0xA3);
		assert.equal(skein.get(), 0xA4);

		skein.reset();
		stitch = cman.newStitch();
		knot.unknit(cman, skein);

		mem = stitch.refmemById("VAR1");
		assert.equal(mem[1], 0x1234);
		mem = stitch.refmemById("VAR2");
		assert.equal(mem[0], 0xA1A2A3A4);
	});

	it("testConst", function() {
		let cman = __ctx.cman;
		let spec = JSON.parse('{"syntax":"bin.b2[:1]b4[:0]", "const":["h:0x10234FA", "h:0x1234"]}');
		let knot = ws.__get__("Knot").ready(cman, spec);

		let skein = nio.Skein.allocate(1024);

		knot.knit(cman, skein);
		skein.flip();
		assert.equal(skein.remaining(), 6);
		assert.equal(skein.get(), 0x12);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0x01);
		assert.equal(skein.get(), 0x02);
		assert.equal(skein.get(), 0x34);
		assert.equal(skein.get(), 0xFA);
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


describe("TestKnotLibs", function() {

	it("testParseConst", function() {
		let knotlib = ws.__get__("__knot_libs");

		// invalid arguments
		try
		{
			knotlib.parseConst(1);
			assert.AssertionError
		}
		catch(e) { }

		let c = knotlib.parseConst(undefined);
		assert.equal(c, undefined);
		c = knotlib.parseConst([]);
		assert.equal(c, undefined);
		c = knotlib.parseConst([123]);
		assert.equal(c[0], 123);
		c = knotlib.parseConst(["123"]);
		assert.equal(c[0], "123");
		c = knotlib.parseConst(["s:ABCD"]);
		assert.equal(c[0], "ABCD");
		c = knotlib.parseConst(["h:ABCD"]);
		assert.equal(c[0], 0xABCD);
		c = knotlib.parseConst(["b:1011001"]);
		assert.equal(c[0], 0b1011001);
		c = knotlib.parseConst(["d:1011001"]);
		assert.equal(c[0], 1011001);
		c = knotlib.parseConst(["f:101"]);
		assert.equal(c[0], 101.0);
	});
});

describe("TestStitch", function() {

	const __ctx = {
		cman: undefined
	};

	before(function() {
		__ctx.cman = new ws.CraftsMan();
		__ctx.cman.refTable.addRef("VAR1", {name:"VAR1"});
		__ctx.cman.refTable.addRef("VAR2", {name:"VAR2"});
	});

	it("testRefmemByNum", function() {
		let StitchType = ws.__get__("Stitch");
		let stitch = new StitchType(__ctx.cman, 0);

		let mem = stitch.refmemByNum(0);
		assert.equal(mem.length, 0);
		mem.push(0);
		mem.push(1);
		assert.equal(mem.length, 2);

		mem = stitch.refmemByNum(1);
		assert.equal(mem.length, 0);
		mem.push(0);
		mem.push(1);
		assert.equal(mem.length, 2);
	});

	it("testRefmemByNum2", function() {
		let StitchType = ws.__get__("Stitch");
		let stitch = new StitchType(__ctx.cman, 0);

		let mem = stitch.refmemByNum(0);
		mem = stitch.refmemByNum(1);
		mem = stitch.refmemByNum(0);
		assert.equal(mem.length, 0);
		mem.push(0);
		mem.push(1);
		assert.equal(mem.length, 2);

		mem = stitch.refmemByNum(1);
		assert.equal(mem.length, 0);
		mem.push(0);
		mem.push(1);
		assert.equal(mem.length, 2);
	});
});