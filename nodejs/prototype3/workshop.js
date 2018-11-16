var nio = require('./skein');

const EventEmitter = require('events');

const MODE_KNIT         = 0;
const MODE_UNKNIT       = 1;

const CHUNK_METHOD_BYTES        = "bytes";
const CHUNK_METHOD_MARK         = "mark";


class Stitch
{
	constructor(cman, seqnum, options)
	{
		this._seqnum = seqnum;
		this._cman = cman;
		this._options = options;

		let refcount = this._cman.refTable.refcount || 0;
		this._refidx = new Array(refcount).fill([0]);
		this._refmem = new Array(refcount);

		this._toolStack = [];
		this._state = 0;
	}

	/**
	 *
	 * @param refnum, a sequence number of a reference
	 * @param idx   ,
	 * @param cycle , Nth of making knots
	 * @returns {*|number}
	 */
	nextRefidx(refnum, idx, cycle)
	{
		if ( cycle > 0 && this._refidx[refnum][cycle] == 0 )
			// 이전 주기의 최대값을 챙긴다.
			this._refidx[refnum][cycle] = this._refidx[refnum][cycle - 1];

		let next = -1;

		if ( idx == -1 ) next = this._refidx[refnum][cycle]++;
		else
		{
			next = idx + (cycle > 0 ? this._refidx[refnum][cycle - 1] : 0);
			if ( idx >= this._refidx[refnum][cycle] ) this._refidx[refnum][cycle] = idx + 1;
		}

		return next;
	}

	refmemById(refid)
	{
		let rr = this._cman.refTable.getRef(refid);
		return this.refmemByNum(rr.__refnum);
	}

	refmemByNum(refnum)
	{
		let mem = this._refmem[refnum];
		if ( mem === undefined ) mem = this._refmem[refnum] = [];
		return mem;
	}

	get toolStack() { return this._toolStack; }
	get isDone() { return false; /* TODO implements */ }

	setRefValue(refnum, value, idx, cycle)
	{
		let vmap = this.refmemByNum(refnum);
		let vidx = this.nextRefidx(refnum, idx, cycle);
		vmap[vidx] = value;
	}

	// TODO default value
	getRefValue(refnum, idx, cycle)
	{
		let vmap = this.refmemByNum(refnum);
		let vidx = this.nextRefidx(refnum, idx, cycle);
		return vmap[vidx];
	}
}

class RefTable
{
	constructor()
	{
		this._seq = [];
		this._map = {};
	}

	addRef(refid, ref)
	{
		if ( refid === undefined ) return undefined;
		if ( refid in this._map ) return this._map[refid];

		let s = this._seq.length;
		this._seq[s] = ref;
		this._map[refid] = ref;

		ref.__refid = refid;
		ref.__refnum = s;

		return ref;
	}

	getRef(refid)
	{
		return this._map[refid];
	}

	getRefnumById(refid)
	{
		return refid in this._map ? this._map[refid].__refnum : -1;
	}

	getRefByNum(seqnum)
	{
		if ( seqnum < this._seq.length )
		{
			return this._seq[seqnum];
		}

		return undefined;
	}

	get refcount() { return this._seq.length; }
}

class CraftsMan
{
	constructor()
	{
		this._workStitch = undefined;
		this._stitches = [];
		this._stitchSeq = 0;
		// refid map, refid <-> index to maximize a performance
		this._refTable = new RefTable();
	}

	shiftStitch()
	{
		return this._stitches.shift();
	}

	newStitch(options)
	{
		let ops = options || {};

		this._workStitch = new Stitch(this, this._stitchSeq++, ops);
		this._stitches.push(this._workStitch);

		return this._workStitch;
	}

	get stitch() { return this._workStitch; }
	get refTable() { return this._refTable; }
}


const __PROCESS_STATE = { NONE:-1, RUN:1, DONE:0, ERROR:-2 };
class Process
{
	constructor()
	{
		this._state = Process.State.NONE;
		this._tools = [];
	}

	static get State() { return __PROCESS_STATE; }
	get state() { return this._state; }
	get tools() { return this._tools; }

	static ready(workshop, spec)
	{
		let ps = new Process();

		try
		{
			for ( let k = 0; k < spec.process.length; k++ )
			{
				let toolId = spec.process[k];
				ps._tools.push(workshop.toolMap[toolId]);
			}
		}
		catch(e)
		{
		}

		return ps;
	}

	unknit(cman, skein)
	{
		let stitch = cman.stitch;

		// if not yet initialized, push tools into stack...
		switch(this._state)
		{
			case Process.State.NONE:
			case Process.State.DONE:
				for ( let k = this._tools.length - 1; k >= 0; k-- ) stitch.toolStack.push(this._tools[k]);
				this._state = Process.State.RUN;
				break;
		}

		//
		try
		{
			while ( stitch.toolStack.length > 0 )
			{
				let tool = stitch.toolStack.pop();
				if ( !tool.unknit(cman, skein) /* done is false */ ) break;
			}
		}
		catch(e)
		{
			this._state = Process.State.ERROR;
		}
		finally
		{
			// if there is not tool in statck, process's working is done.
			if ( stitch.toolStack.length == 0 ) this._state = Process.State.DONE;
		}
	}
}

class Workshop
{
	static setupWorkshop(spec, craftsman)
	{
		var ws = new Workshop(craftsman);

		// store environment...
		ws._env = spec.environment;

		// ready knot tool... ==============================
		ws._toolMap = {};
		for ( let id in spec.tools )
		{
			let toolSpec = spec.tools[id];
			ws._toolMap[id] = Tool.ready(ws, toolSpec);
		}
		// lazy inherit
		Object.values(ws.toolMap).forEach(function(t) {
			t.lazyExtends(ws.toolMap);
		});

		//
		//this._textures = spec.textures;
		ws._processMap = {};
		for ( let id in spec.textures )
		{
			ws._processMap[id] = Process.ready(ws, spec.textures[id]);
		}

		return ws;
	}

	constructor(cman)
	{
		//
		this._craftsman = cman;
	}

	get env() { return this._env; }
	get toolMap() { return this._toolMap; }
	get processMap() { return this._processMap; }
	get craftsman() { return this._craftsman; }

	knit(tid, skein)
	{
		var stitch = this._craftsman.stitch;
		if ( stitch === undefined || stitch.isDone )
		{
			stitch = this._craftsman.newStitch();
		}

		var knot = stitch.knotStack.pop();
		knot.knit();

		this._craftsman.newStitch();
		let t = this._textures[tid];
		let that = this;
		t.process.forEach(function(id) {
			that._tools[id].knit(that._craftsman, skein);
		})
	}

	unknit(pid, skein)
	{
		let stitch = this._craftsman.stitch;
		if ( stitch === undefined || stitch.isDone )
		{
			this._craftsman.newStitch();
		}

		let ps = this._processMap[pid];
		ps.unknit(this._craftsman, skein);
	}
}

const SpecMethodHelper =
{
	methodFunc: function(m) {

		if ( m.startsWith("bit") )
		{
			let detail = m.substring(m.indexOf('.') + 1);
			let tokens = /\s*(([bB])\s*\(\s*(\d+)\s*,\s*(\d+)\s*\))\s*/.exec(detail);


		}
		else
			return __knot_libs[spec.method];
	}
};

var __tool_libs = {

	parseFlow: function(cman, spec)
	{
		if ( typeof spec === "string" )
		{

		}
		else if ( spec.syntax !== undefined )
		{
			// KNOT
			return Knot.ready(cman, spec);
		}
	},
}


class Tool
{
	constructor(spec)
	{
		this._spec = spec;
	}

	static ready(ws, spec, mode)
	{
		let tool = new Tool(spec);

		tool._log = spec.log;

		// inherits ==========
		if ( spec.extends )
		{
			tool._extends = spec.extends;
		}

		// subtools ==========
		if ( spec.subtools )
		{
			tool._subtools = [];
			spec.subtools.forEach(function(e) { tool._subtools.push(Tool.ready(ws, e)); });
		}
		// chunk =============
		if ( spec.chunk )
		{
			tool._chunkModule = ChunkModuleKit.setup(spec.chunk);
		}

		// knots =============
		tool._knots = [];
		if ( spec.knots && spec.knots.length )
		{
			for ( var i = 0; i < spec.knots.length; i++ )
			{
				tool._knots.push(__tool_libs.parseFlow(ws.craftsman, spec.knots[i]));
			}
		}

		// if knots and no chunk ==
		if ( tool._chunkModule === undefined && tool._knots.length > 0 )
		{
			let sz = 0;
			tool._knots.forEach(function(t) { sz += t.minimum; });
			tool._chunkModule = ChunkModuleKit.setup({method:"bytes", size:sz});
		}

		return tool;
	}

	get knots() { return this._knots; }
	get subtools() { return this._subtools; }
	get superTool() { return this._superTool; }
	get chunkModule() { return this._chunkModule; }
	get log() { return this._log; }

	_chunk(cman, skein)
	{
		return this._chunkModule.chunk(cman, skein)
	}

	lazyExtends(toolMap)
	{
		if ( this._extends ) this._superTool = toolMap[this._extends];
		if ( this._subtools )
		{
			this._subtools.forEach(function(t) { t.lazyExtends(toolMap); });
		}
	}

	knit(cman, skein)
	{
		let log = this._log || (this._superTool ? this._superTool.log : undefined);
		if ( log ) console.log(log);

		return this._knit(cman, skein);
	}

	unknit(cman, skein)
	{
		let log = this._log || (this._superTool ? this._superTool.log : undefined);
		if ( log ) console.log(log);

		// if use chunk?, then subtools must unknit of chunked subskein.
		let subskein = skein;
		let chunkModule = this._chunkModule || (this._superTool ? this._superTool.chunkModule : undefined);
		if ( chunkModule )
		{
			subskein = chunkModule.chunk(cman, skein);
			if ( subskein === undefined ) return false;
		}

		let result = this._unknit(cman, subskein);

		//
		if ( result )
		{
			let subtools = this._subtools || (this._superTool ? this._superTool.subtools : undefined);
			if ( subtools )
			{
				let stitch = cman.stitch;
				subtools.reverse().forEach(function(t) { stitch.toolStack.push(t); })
			}
		}

		return result;

		/*
		var pieceBuf = this._chunk(cman, skein);
		for ( var i = 0; i < this._flow.length; i++ )
		{
			this._flow[i].unknit(cman, pieceBuf);
		}
		*/
	}

	_knit(cman, skein)
	{
		let knots = this._knots || (this._superTool ? this._superTool.knots : undefined);
		if ( knots )
		{
			knots.forEach(function(k) {
				k.knit(cman, skein);
			});
		}

		return true;
	}

	_unknit(cman, skein)
	{
		let knots = this._knots || (this._superTool ? this._superTool.knots : undefined);
		if ( knots )
		{
			knots.forEach(function(k) {
				k.unknit(cman, skein);
			});
		}

		return true;
	}

	_compileFunctions(recipes)
	{
		var func = [];

		// if "ref" is defined, data have to be parsed into a value
		if ( recipes.mode === undefined && recipes.ref !== undefined )
		{
			recipes.mode = "bin.big_endian"; // TODO have to be set by default.
		}

		// 1st function is getting a value
		if ( recipes.mode !== undefined )
		{
			var f = $knotFunctions[recipes.mode];
			func.push(f.bind(this));
		}

		// 2nd, ref
		var ref = recipes.ref;
		if ( ref !== undefined )
		{
			func.push($knotFunctions["assign"].bind(this, ref));
		}

		return func;
	}
}



const __knot_libs = {
	"bin.big_endian": {
		"knit": function (skein, sz, val) {
			skein.putUInt(val, sz);
			console.log("bin.big_endian, sz=" + sz + ", value=" + val);
		},

		"unknit": function (skein, sz) {
			let val = skein.getUInt(sz);
			console.log("bin.big_endian, sz=" + sz + ", value=" + val);
			return val;
		},
	}
	,
	"bin.little_endian": {
		"knit":function(cman, skein, sz) {
			skein.order = YARN_LITTLE_ENDIAN;
			cman.value = skein.getUInt(sz);
			console.log("bin.little_endian, sz=" + sz + ", value=" + cman.value);
			return 0;
		},

		"unknit":function(cman, skein, sz) {
			skein.order = YARN_LITTLE_ENDIAN;
			skein.putUInt(cman.value, sz);
			console.log("bin.little_endian, sz=" + sz + ", value=" + cman.value);
		},
	}
	,
	"bit": {
		"knit":function() {

		}
	}
	,
	createKnot: function(cman, syntax)
	{
		if ( syntax === undefined ) throw new Error("A knot's syntax is undefined");

		if ( syntax.startsWith("bit") )
		{
			let defstr = syntax.substring(syntax.indexOf('.') + 1);
			console.debug("new BitKnot, defs=" + defstr);
			return BitKnot.parse(cman, defstr);
		}
		else if ( syntax.startsWith("bin") )
		{
			let defstr = syntax.substring(syntax.indexOf('.') + 1);
			console.debug("new BinaryKnot, defs=" + defstr);
			return BinaryKnot.parse(cman, defstr);
		}
	}
	,

	parseConst: function(spec)
	{
		if ( spec === undefined ) return undefined;
		if ( !Array.isArray(spec)) throw "const must be array";
		if ( spec.length == 0 ) return undefined;

		let _const = [];

		try
		{
			spec.forEach(function(c) {

				if ( !isNaN(c) ) _const.push(c);
				else
				{
					let tokens = c.split(':');
					if ( tokens.length != 1 && tokens.length != 2 )
						throw "invalid const definition";

					// if there are two elements, 1st element is a type. 2nd element is a value
					// if one, 1st element is a value, the type is string(default)
					let _type = tokens.length == 1 ? "s" : tokens[0];
					let _val  = tokens.length == 1 ? tokens[0] : tokens[1];

					switch(_type)
					{
						case 's': _const.push(_val); break;
						case 'b': _const.push(parseInt(_val, 2)); break;
						case 'd': _const.push(parseInt(_val, 10)); break;
						case 'h': _const.push(parseInt(_val, 16)); break;
						case 'f': _const.push(parseFloat(_val)); break;
						default:
							throw "unsupported const type:" + _type;
					}
				}
			});
		}
		catch(e)
		{
			throw "invalid const definition";
		}

		return _const;
	}
}


class Knot
{
	constructor(defs, options)
	{
		this._defs = defs;
		this._options = options;
	}

	static ready(cman, spec)
	{
		try
		{
			let knot = __knot_libs.createKnot(cman, spec.syntax);
			knot._spec = spec || {};
			knot._spec.iter = spec.iter === undefined ? 1 : spec.iter;
			knot._localRefid = spec.refid;
			knot._localRef = cman.refTable.addRef(spec.refid, {});

			// const =============
			knot._const = __knot_libs.parseConst(spec.const);

			return knot;
		}
		catch(e)
		{
			console.error(e.message, e);
		}
	}

	get minimum() { return this._minimum; }

	knit(cman, skein, loop = 1)
	{
		let cycle = 0;
		for ( var i = 0; i < loop; i++ )
		{
			this._knit(cman, skein, cycle++);
		}
	}

	unknit(cman, skein)
	{
		let cycle = 0;

		while(skein.hasRemaining())
		{
			this._unknit(cman, skein, cycle++);
		}
	}

	_compileNeedSize(sz)
	{
		if ( isNaN(sz) )
		{

		}
		else
			return function() { return sz; }
	}

	_getValue(stitch, defref, defidx, cycle)
	{
		try
		{
			let ref = defref || this._localRef;
			let vv = undefined;

			return ref ? stitch.getRefValue(ref.__refnum, defidx, cycle) : this._const[defidx];
		}
		catch(e)
		{
		}

		return 0;
	}

	_setValue(stitch, val, defref, defidx, cycle)
	{
		try
		{
			let ref = defref || this._localRef;
			if ( ref !== undefined ) stitch.setRefValue(ref.__refnum, val, defidx, cycle);
		}
		catch(e)
		{
		}
	}

}

__bit_abfunc = function(a, b, v)
{
	return a * v + b;
}

__bit_masks = [ 0, 0b1, 0b11, 0b111, 0b1111, 0b11111, 0b111111, 0b1111111, 0b11111111 ];

class BitKnot extends Knot
{
	static parse(cman, defstr)
	{
		let tokens = null;
		let re = /\s*([bB])\s*(\d+)\s*\[\s*(\w+)?\s*:\s*(\d+)\s*\]\s*/g;
		let defs = [];
		let offset = 0;

		while( (tokens = re.exec(defstr)) !== null )
		{
			let def = {};
			def.bB = tokens[1] == 'b';
			def.sz = parseInt(tokens[2]);
			def.refid = tokens[3];
			def.ref = cman.refTable.addRef(def.refid, {});
			def.idx = isNaN(tokens[4]) ? -1 : parseInt(tokens[4]);
			def.mask = __bit_masks[def.sz];
			def.func = __bit_abfunc.bind(def, def.bB ? 1 : -1, def.bB ? 0 : def.mask);
			def.offset = offset;

			defs.push(def);
			offset += def.sz;
		}

		let knot = new BitKnot(defs);
		knot._minimum = 1;

		return knot;
	}

	_knit(cman, skein, cycle)
	{
		let bb = 0;
		let stitch = cman.stitch;

		for ( let i = 0; i < this._defs.length; i++ )
		{
			let vv = this._getValue(stitch, this._defs[i].ref, this._defs[i].idx, cycle);

			vv = this._defs[i].func(vv & this._defs[i].mask);
			bb |= vv << (8 - this._defs[i].offset - this._defs[i].sz);
		}

		skein.put(bb);
	}

	_unknit(cman, skein, cycle)
	{
		let bb = skein.get();
		let stitch = cman.stitch;

		for ( let i = 0; i < this._defs.length; i++ )
		{
			let vv = bb >> (8 - this._defs[i].offset - this._defs[i].sz);
			vv = vv & this._defs[i].mask;

			this._setValue(stitch, vv, this._defs[i].ref, this._defs[i].idx, cycle);
		}
	}
}

class BinaryKnot extends Knot
{
	static parse(cman, defstr)
	{
		let tokens = null;
		let re = /\s*([bB])\s*(\d+)(?:\s*\[\s*(\w+)?\s*:\s*(\d+)\s*\])?\s*/g;
		let defs = [];

		let idxGlobalOffset = 0;
		let idxRefOffset = {};
		let minimum = 0;

		while( (tokens = re.exec(defstr)) !== null )
		{
			let def = {};

			def.bB = tokens[1] == 'b';
			def.sz = parseInt(tokens[2]);
			def.refid = tokens[3];
			def.ref = cman.refTable.addRef(def.refid, {});
			def.idx = isNaN(tokens[4]) ? -1 : parseInt(tokens[4]);

			defs.push(def);
			minimum += def.sz;
		}

		let knot = new BinaryKnot(defs, {idxGlobalOffset:idxGlobalOffset, idxRefOffset:idxRefOffset});
		knot._minimum = minimum;

		return knot;
	}

	_knit(cman, skein, cycle)
	{
		let stitch = cman.stitch;

		for ( let i = 0; i < this._defs.length; i++ )
		{
			let vv = this._getValue(stitch, this._defs[i].ref, this._defs[i].idx, cycle);

			skein.order = this._defs[i].bB ? nio.Skein.BIG_ENDIAN : nio.Skein.LITTLE_ENDIAN;
			skein.putUInt(vv, this._defs[i].sz);
		}
	}

	_unknit(cman, skein, cycle)
	{
		let stitch = cman.stitch;

		for ( let i = 0; i < this._defs.length; i++ )
		{
			skein.order = this._defs[i].bB ? nio.Skein.BIG_ENDIAN : nio.Skein.LITTLE_ENDIAN;
			let vv = skein.getUInt(this._defs[i].sz);

			this._setValue(stitch, vv, this._defs[i].ref, this._defs[i].idx, cycle);
		}
	}

}

class ChunkModuleKit
{
	static setup(def)
	{
		if ( def.method === undefined ) throw "chunk method is not defined";

		var m = undefined;
		switch(def.method)
		{
			case CHUNK_METHOD_BYTES: m = new ChunkModuleBytes(def); break;
			case CHUNK_METHOD_MARK : m = new ChunkModuleMark(def); break;
			default:
				throw "unsupported chunk method=" + def.method;
		}

		return m;
	}
}

class ChunkModule
{
	/**
	 * get chunk and put a chunk to cman
	 *
	 * @param skein
	 * @return if there is a chunk then a skein's cut otherwise undefined
	 */
	chunk(cman, skein)
	{

	}

	made(cman, skein)
	{

	}
}

class ChunkModuleBytes
{
	constructor(def)
	{
		this._remain = 0;
		this._needSize = this._compileNeedSize(def.size);
	}

	chunk(cman, skein)
	{
		var sz = this._needSize();
		if ( skein.remaining() < sz ) return undefined;

		return skein.cut(sz);
	}

	made(cman, skein)
	{
		var sz = this._needSize();
		if ( sz == undefined ) return true;

		return skein.remaining() >= sz;
	}

	/**
	 *
	 * @param sz a definition of a size
	 * @private
	 */
	_compileNeedSize(sz)
	{
		if ( isNaN(sz) )
		{
			// TODO implement
		}
		else
			return function() { return sz; }
	}
}

class ChunkModuleMark
{
	constructor(def)
	{
		this._markInclude = def.markInclude === undefined ? 3 : def.markInclude;
		this._startMark = def.start;
		this._endMark = def.end;
		this._reset();
	}

	chunk(cman, skein)
	{
		try
		{
			let dup = skein.duplicate();

			while(dup.hasRemaining())
			{
				let bb = dup.get();
				cman.chunkbuf.put(bb);

				switch(this._state)
				{
					// check first
					case 0:
						this._pos_0 = cman.chunkbuf.position - 1;       // a position of a begin of start mark
						_checkStart(bb);
						break;

					// continue to check start marks
					case 1:
						_checkStart(bb);
						break;

					// data
					case 2:
						this._pos_1 = cman.chunkbuf.position - 1;       // a position of data
						// continue to check end mark

					// check end
					case 3:
						this._pos_2 = cman.chunkbuf.position - 1;       // a position of a begin of end mark
						_checkEnd(bb);
						break;

					// continue to check end marks
					case 4:
						this._pos_3 = cman.chunkbuf.position - 1;
						_checkEnd(bb);
						if ( this._state != 5 ) break;

					// all is OK
					case 5:
						this._reset();

						// check whether there is data
						if ( this._markInclude != 0 || this._pos_1 != this._pos_2 )
						{
							let posS = (this._markInclude & 2) == 0 ? this._pos_1 : this._pos_0;
							let posE = (this._markInclude & 1) == 0 ? this._pos_2 : this._pos_3;
							let part = skein.duplicate();
							part.position = posS;
							part.limit = posE + 1;

							return true;
						}
				}
			}

			skein.mark();
		}
		catch(e)
		{
			this._reset();
		}

		return false;
	}

	_reset()
	{
		this._checkStart = this._startMark === undefined ? 0 : this._startMark.length;
		this._checkEnd = this._endMark === undefined ? 0 : this._endMark.length;

		// if there is no start's mark then skip checking start.
		this._state = this._checkStart == 0 ? 2 : 0;
	}

	_checkStart(bb)
	{
		let idx = this._startMark.length - this._checkStart;

		if ( bb == this._startMark[idx] )
		{
			this._checkStart = this._checkStart - 1;
			this._state = this._checkStart === 0 ? 2 : 1;
		}
		else
		{
			this._reset();
		}
	}

	_checkEnd(bb)
	{
		let idx = this._endMark.length - this._checkEnd;

		if ( bb == this._endMark[idx] )
		{
			this._checkEnd = this._checkEnd - 1;
			this._state = this._checkEnd === 0 ? 5 : 4;
		}
		else
		{
			// reset indicators for checking end
			this._checkEnd = this._endMark === undefined ? 0 : this._endMark.length;
			this._state = 3;
		}
	}
}

module.exports = {
	version: "0.1"

	, setupWorkshop: function(spec, ee)
	{
		return Workshop.setupWorkshop(spec, ee);
	}
	, CraftsMan:CraftsMan
	, Tool:Tool
}