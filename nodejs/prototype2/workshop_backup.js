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
		this._refmem = new Array(refcount).fill([]);

		this._knotStack = [];
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
		return this._refmem[refnum];
	}

	get knotStack() { return this._knotStack; }
	get isDone() { return false; /* TODO implements */ }

	_calcCycleOffset(refnum, cycle)
	{
		
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


class Workshop extends nio.IOApplication
{
	static setupWorkshop(spec, craftsman)
	{
		var ws = new Workshop(spec, craftsman);
		return ws;
	}

	constructor(spec, cman)
	{
		this._env = spec.environment;

		// ready knot tool...
		this._tools = {};
		for ( let id in spec.tools )
		{
			let toolSpec = spec.tools[id];
			this._tools[id] = Tool.ready(cman, toolSpec);
		}

		//
		this._textures = spec.textures;
		//
		this._craftsman = cman;
	}

	get env() { return this._env; }
	get tools() { return this._tools; }
	get textures() { return this._textures; }

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

	unknit(tid, skein)
	{
		var stitch = this._craftsman.stitch;
		if ( stitch === undefined || stitch.isDone )
		{
			stitch = this._craftsman.newStitch();
		}

		var knot = stitch.knotStack.pop();
		knot.unknit(stitch, skein);

		this._craftsman.newStitch();
		let t = this._textures[tid];
		let that = this;
		t.process.forEach(function(id) {
			that._tools[id].unknit(that._craftsman, skein);
		})
	}
}

class Process
{
	/**
	 * @param ee    a _notifier function to be called when a transaction of a communication will be ended
	 */
	constructor(cman)
	{
		this._knitTools = [];
		this._unknitTools = [];
		this._cman = cman;

		/** a information of current stich */
		this._stich = undefined;

		/** */
		this._ref = {};
		//this._state = UNKNIT_STATE_INIT;

		/** stich sequence number */
		this._seq = 0;
		//this._notifier = ee;
	}

	ready(spec)
	{
		let knots = spec.knots;
		if ( knots === undefined ) throw "There is no knots";

		for ( var i = 0; i < knots.length; i++ )
		{
			//this.addTool(new Tool(knots[i]));
			this._knitTools.push(new Tool(knots[i], MODE_KNIT));
			this._unknitTools.push(new Tool(knots[i], MODE_UNKNIT));
		}
	}

	addTool(tool)
	{
		this._tools.push(tool);
	}

	resetState()
	{
		this._state = UNKNIT_STATE_INIT;
		this._stich = {
			seq: this._seq++
			, refmap: { }
		}

		this.notifyStich(false);
	}

	get _notifier() { return this._eventEmitter; }
	set _notifier(ee)
	{
		if ( ee instanceof UnknitCallback ) this._eventEmitter = ee;
		else
			throw "A parameter be inherited from 'UnknitCallback' class";
	}

	notifyStich(isend)
	{
		if ( isend ) this._eventEmitter.emit("stichStart", this._stich);
		else
			this._eventEmitter.emit("stichEnd", this._stich)
	}

	notifyError(ecode, msg)
	{
		this._eventEmitter.emit("stichError", ecode, msg);
	}

	/**
	 *
	 * @param skein
	 * @param refmap
	 * @returns {boolean}
	 */
	execute(skein, refmap)
	{
		while ( this._state < this._tools.length )
		{
			if ( this._state == UNKNIT_STATE_INIT )
			{
				this.resetState();
			}

			var step = this._state;

			// check size for verifying whether all data is prepared.
			var sz = this._tools[step].needSize;
			if (skein.remaining() < sz) return false;

			// unknit
			var ctx = {size:sz, stich:this._stich, ref:this._stich.refmap};
			this._tools[step].run(ctx, skein);

			// check last state..
			this._state++;
			if ( this._state >= this._tools.length )
			{
				this.notifyStich(true);
			}
		}
	}

	_checkEnd()
	{

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

			return knot;
		}
		catch(e)
		{
			console.error(e.message, e);
		}
	}

	knit(cman, skein, loop = 1)
	{
		let cycle = 0;
		for ( var i = 0; i < loop; i++ )
		{
			this._knitImpl(cman, skein, cycle++);
		}
	}

	unknit(cman, skein)
	{
		let cycle = 0;

		while(skein.hasRemaining())
		{
			this._unknitImpl(cman, skein, cycle++);
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

	_calcIndex(cman, ref, idx, cycle)
	{
		return cman.stitch.nextRefidx(ref.__refnum, idx, cycle);
	}

	_safeVMap(cman, ref)
	{
		return cman.stitch.refmemByNum(ref.__refnum);
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

		return new BitKnot(defs);
	}

	_knitImpl(cman, skein, cycle)
	{
		let bb = 0;

		for ( let i = 0; i < this._defs.length; i++ )
		{
			let mem = this._safeVMap(cman, this._defs[i].ref || this._localRef);
			let idx = this._calcIndex(cman, this._defs[i].ref || this._localRef, this._defs[i].idx, cycle);
			let vv = mem[idx] & this._defs[i].mask;
			vv = this._defs[i].func(vv);
			bb |= vv << (8 - this._defs[i].offset - this._defs[i].sz);
		}

		skein.put(bb);
	}

	_unknitImpl(cman, skein, cycle)
	{
		let bb = skein.get();

		for ( let i = 0; i < this._defs.length; i++ )
		{
			let vv = bb >> (8 - this._defs[i].offset - this._defs[i].sz);
			vv = vv & this._defs[i].mask;

			let vmap = this._safeVMap(cman, this._defs[i].ref || this._localRef);
			let idx = this._calcIndex(cman, this._defs[i].ref || this._localRef, this._defs[i].idx, cycle);
			vmap[idx] = vv;
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

		while( (tokens = re.exec(defstr)) !== null )
		{
			let def = {};

			def.bB = tokens[1] == 'b';
			def.sz = parseInt(tokens[2]);
			def.refid = tokens[3];
			def.ref = cman.refTable.addRef(def.refid, {});
			def.idx = isNaN(tokens[4]) ? -1 : parseInt(tokens[4]);

			defs.push(def);
		}

		return new BinaryKnot(defs, {idxGlobalOffset:idxGlobalOffset, idxRefOffset:idxRefOffset});
	}

	_knitImpl(cman, skein, cycle)
	{
		for ( let i = 0; i < this._defs.length; i++ )
		{
			let mem = this._safeVMap(cman, this._defs[i].ref || this._localRef);
			let idx = this._calcIndex(cman, this._defs[i].ref || this._localRef, this._defs[i].idx, cycle);
			let val = mem[idx];
			skein.order = this._defs[i].bB ? nio.Skein.BIG_ENDIAN : nio.Skein.LITTLE_ENDIAN;
			skein.putUInt(val, this._defs[i].sz);
		}
	}

	_unknitImpl(cman, skein, cycle)
	{
		for ( let i = 0; i < this._defs.length; i++ )
		{
			let mem = this._safeVMap(cman, this._defs[i].ref || this._localRef);

			skein.order = this._defs[i].bB ? nio.Skein.BIG_ENDIAN : nio.Skein.LITTLE_ENDIAN;

			let val = skein.getUInt(this._defs[i].sz);
			let idx = this._calcIndex(cman, this._defs[i].ref || this._localRef, this._defs[i].idx, cycle);
			mem[idx] = val;
		}
	}

}

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
	}
}


class Tool
{
	constructor(spec)
	{
		this._spec = spec;
	}

	static ready(cman, spec, mode)
	{
		let tool = new Tool(spec);
		tool._chunkModule = ChunkModuleKit.setup(spec.chunk);
		tool._flow = [];

		//tool._iterate = spec.iterate;
		if ( spec.flow && spec.flow.length )
		{
			for ( var i = 0; i < spec.flow.length; i++ )
			{
				tool._flow.push(__tool_libs.parseFlow(cman, spec.flow[i]));
			}
		}
		return tool;
	}

	get flow() { return this._flow; }

	_chunk(cman, skein)
	{
		return this._chunkModule.chunk(cman, skein)
	}

	knit(cman, skein)
	{
		var pieceBuf = this._chunk(cman, skein);
		for ( var i = 0; i < this._flow.length; i++ )
		{
			this._flow[i].knit(cman, pieceBuf);
		}
	}

	unknit(cman, skein)
	{
		var pieceBuf = this._chunk(cman, skein);
		for ( var i = 0; i < this._flow.length; i++ )
		{
			this._flow[i].unknit(cman, pieceBuf);
		}
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