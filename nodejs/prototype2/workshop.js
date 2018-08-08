const EventEmitter = require('events');

const MODE_KNIT         = 0;
const MODE_UNKNIT       = 1;

const CHUNK_METHOD_BYTES        = "bytes";
const CHUNK_METHOD_MARK         = "mark";


class CraftsMan
{
	constructor(bufSize)
	{
		this._ref = {};
		//this._chunkbuf = Yarn.allocate(bufSize);
	}

	get chunkbuf() { return this._chunkbuf; }

	get ref() { return this._ref; }
}

class Workshop
{
	static setupWorkshop(spec, craftsman)
	{
		var ws = new Workshop(spec, craftsman);
		return ws;
	}

	constructor(spec, craftsman)
	{
		this._env = spec.environment;

		// prepare knot tool...
		this._tools = {}
		for ( let id in spec.knots )
		{
			let k = spec.knots[id];
			this._tools[id] = new Tool(k);
		}

		//this._process = new Process(craftsman);
		//this._process.prepare(spec);
	}

	get env() { return this._env; }
	get process() { return this._process; }
	set process(p) { this._process = p; }
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

	prepare(spec)
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
	 * @param yarn
	 * @param refmap
	 * @returns {boolean}
	 */
	execute(yarn, refmap)
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
			if (yarn.remaining() < sz) return false;

			// run
			var ctx = {size:sz, stich:this._stich, ref:this._stich.refmap};
			this._tools[step].run(ctx, yarn);

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
			"knit": function (yarn, sz, val) {
				yarn.putUInt(val, sz);
				console.log("bin.big_endian, sz=" + sz + ", value=" + val);
			},

			"unknit": function (yarn, sz) {
				let val = yarn.getUInt(sz);
				console.log("bin.big_endian, sz=" + sz + ", value=" + val);
				return val;
			},
	}
	,
	"bin.little_endian": {
			"knit":function(cman, yarn, sz) {
				yarn.order = YARN_LITTLE_ENDIAN;
				cman.value = yarn.getUInt(sz);
				console.log("bin.little_endian, sz=" + sz + ", value=" + cman.value);
				return 0;
			},

			"unknit":function(cman, yarn, sz) {
				yarn.order = YARN_LITTLE_ENDIAN;
				yarn.putUInt(cman.value, sz);
				console.log("bin.little_endian, sz=" + sz + ", value=" + cman.value);
			},
	},
}

class Knot
{
	constructor()
	{
	}

	static ready(spec)
	{
		let knot = new Knot();
		knot._spec = spec;
		knot._spec.iter = spec.iter === undefined ? 1 : spec.iter;

		knot._compiled_knit = __knot_libs[spec.method].knit.bind(knot);
		knot._compiled_unknit = __knot_libs[spec.method].unknit.bind(knot);
		knot._compiled_size = knot._compileNeedSize(spec.size);

		return knot;
	}

	knit(cman, yarn)
	{
		let sz = this._compiled_size();
		for ( var i = 0; i < this._spec.iter; i++ )
		{
			let val = cman.ref[this._spec.ref][i];
			this._compiled_knit(yarn, sz, val);
		}
	}

	unknit(cman, yarn)
	{
		let sz = this._compiled_size();
		cman.ref[this._spec.ref] = [];

		for ( var i = 0; i < this._spec.iter; i++ )
		{
			let val = this._compiled_unknit(yarn, sz);
			cman.ref[this._spec.ref][i] = val;
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
}

class Tool
{
	constructor(knot)
	{
		this._knot = knot;
	}

	static ready(knot, mode)
	{
		let tool = new Tool(knot);
		tool._chunkModule = ChunkModuleKit.setup(knot.chunk);
		tool._iterate = knot.iterate;

		if ( knot.composites )
		{
			tool._composites = [];
			for ( var i = 0; i < knot.composites.length; i++ )
			{
				tool._composites.add(Tool.ready(knot.composites[i]));
			}
		}
		return tool;
	}

	get subTools() { return this._composites; }

	_chunk(yarn, cman)
	{
		return this._chunkModule.chunk(yarn, cman)
	}

	run(yarn, cman)
	{
		var piece = this._chunk(yarn, cman);
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
	 * @param yarn
	 * @return if there is a chunk then a yarn's cut otherwise undefined
	 */
	chunk(yarn)
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

	chunk(yarn)
	{
		var sz = this._needSize();
		if ( yarn.remaining() < sz ) return undefined;

		return yarn.cut(sz);
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

	chunk(yarn)
	{
		try
		{
			let dup = yarn.duplicate();

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
							let part = yarn.duplicate();
							part.position = posS;
							part.limit = posE + 1;

							return true;
						}
				}
			}

			yarn.mark();
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
	, ChunkModuleKit:ChunkModuleKit
	, CraftsMan:CraftsMan
	, Knot:Knot
}