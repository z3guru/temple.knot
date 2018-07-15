const EventEmitter = require('events');

const __recipes = {

	"checksum.crc16": {
		"crc16":{
			"hook":function(ctx, yarn) {
				let stich = ctx.stich;
				let checksum = stich.__crc16_checksum;

				while ( yarn.hasRemaining() )
				{
					checksum += yarn.get();
				}
			},
		},
	},

	"bin":{
		"big_endian": {
			"knit": function (ctx, yarn) {
				ctx.value = yarn.getUInt(ctx.size);
				console.log("bin.big_endian, sz=" + ctx.size + ", value=" + ctx.value);
				return ctx.value;
			},

			"unknit": function (ctx, yarn) {
				yarn.putUInt(ctx.value, ctx.size);
				console.log("bin.big_endian, sz=" + ctx.size + ", value=" + ctx.value);
			},
		},
		"little_endian": {
			"knit":function(ctx, yarn) {
				yarn.order = YARN_LITTLE_ENDIAN;
				ctx.value = yarn.getUInt(ctx.size);
				console.log("bin.little_endian, sz=" + ctx.size + ", value=" + ctx.value);
				return 0;
			},

			"unknit":function(ctx, yarn) {
				yarn.order = YARN_LITTLE_ENDIAN;
				yarn.putUInt(ctx.value, ctx.size);
				console.log("bin.little_endian, sz=" + ctx.size + ", value=" + ctx.value);
			},
		},
	},


	"ascii":{
		"knit":function(ctx, yarn) {
			ctx.value = 0;
			yarn.skip(ctx.size);
			console.log("ascii, sz=" + ctx.size);
			return 0;
		},

		"unknit": function(ctx, yarn) {
			ctx.value = 0;
			yarn.skip(ctx.size);
			console.log("ascii, sz=" + ctx.size);
		},
	},
	"assign": {
		"knit":function(name, ctx) {
			ctx.ref[name] = ctx.value;
		},

		"unknit": function(name, ctx) {
			ctx.value = ctx.ref[name];
		}
	},
};

class Workshop
{
	static createWorkshop(spec, ee)
	{
		var ws = new Workshop();
		ws.unknitProcess = new Process(ee);
		ws.unknitProcess.prepare(spec.knots);

		ws.knitProcess = new KnitProcess();
		ws.knitProcess.prepare(spec.knots);

		return ws;
	}

	get unknitProcess() { return this._unknitProcess; }
	set unknitProcess(p) { this._unknitProcess = p; }

	get knitProcess() { return this._knitProcess; }
	set knitProcess(p) { this._knitProcess = p; }

};

class CraftsMan
{
	prepare(spec, ee)
	{
		this._knitProcess = new KnitProcess();
		this._knitProcess.prepare(spec.knots);
	}
}

const YARN_LITTLE_ENDIAN    = 0;
const YARN_BIG_ENDIAN       = 1;


class Yarn
{
	/**
	 *
	 * @param param a size of a buffer OR a buffer from Buffer
	 */
	constructor(param, order)
	{
		if ( param instanceof Buffer ) this._buf = param;
		else if ( typeof(param) === "number") this._buf = new Buffer(param);
		else
			throw "invalid parameters";

		this._mark = this._position = 0;
		this._limit = this._buf.length;
		this.order = order === undefined ? YARN_BIG_ENDIAN : order;
	}

	static allocate(sz)
	{
		return new Yarn(sz);
	}

	static wrap(bbuf)
	{
		var yarn = new Yarn(bbuf.length);
		yarn.putBuffer(bbuf);

		return yarn;
	}

	get capacity() { return this._buf.length; }

	get limit() { return this._limit }
	set limit(val) { this._limit = val; }

	get position() { return this._position }
	set position(val) { this._position = val; }

	remaining() { return this._limit - this._position; }
	hasRemaining() { return this.remaining() > 0; }

	put(b)
	{
		if ( this.remaining == 0 ) throw "Buffer overflow";
		this._buf.writeInt8(b, this._position++);
	}

	get()
	{
		if ( this.remaining == 0 ) throw "Buffer overflow";
		return this._buf.readInt8(this._position++);
	}

	putInt(vv, sz)
	{
		if ( this.remaining < sz ) throw "Buffer overflow";
		this._writeInt.call(this._buf, vv, this._position, sz);
		this._position += sz;
	}

	getInt(sz)
	{
		if ( this.remaining < sz ) throw "Buffer overflow";
		var value = this._readInt.call(this._buf, this._position, sz);
		this._position += sz;

		return value;
	}

	putUInt(vv, sz)
	{
		if ( this.remaining < sz ) throw "Buffer overflow";
		this._writeUInt.call(this._buf, vv, this._position, sz);
		this._position += sz;
	}

	getUInt(sz)
	{
		if ( this.remaining < sz ) throw "Buffer overflow";
		var value = this._readUInt.call(this._buf, this._position, sz);
		this._position += sz;

		return value;
	}

	putFloat(vv)
	{
		if ( this.remaining < 4 ) throw "Buffer overflow";
		this._writeFloat.call(this._buf, vv, this._position);
		this._position += 4;
	}

	getFloat()
	{
		if ( this.remaining < 4 ) throw "Buffer overflow";
		var value = this._readFloat.call(this._buf, this._position);
		this._position += 4;

		return value;
	}

	putDouble(vv)
	{
		if ( this.remaining < 8 ) throw "Buffer overflow";
		this._writeDouble.call(this._buf, vv, this._position);
		this._position += 8;
	}

	getDouble()
	{
		if ( this.remaining < 8 ) throw "Buffer overflow";
		var value = this._readDouble.call(this._buf, this._position);
		this._position += 8;

		return value;
	}

	putBuffer(bbuf, pos, offset)
	{
		if ( bbuf.length > this.remaining ) throw "Buffer overflow";

		var ppos = isNaN(pos) ? 0 : pos;
		var ooff = isNaN(offset) ? bbuf.length : offset;
		bbuf.copy(this._buf, this._position, ppos, ppos + ooff)
	}

	get order() { return this._order; }
	set order(ord)
	{
		if ( ord == YARN_LITTLE_ENDIAN )
		{
			this._order = YARN_LITTLE_ENDIAN;

			this._readInt = this._buf.readIntLE;
			this._readUInt = this._buf.readUIntLE;
			this._readFloat = this._buf.readFloatLE;
			this._readDouble = this._buf.readDoubleLE;

			this._writeInt = this._buf.writeIntLE;
			this._writeUInt = this._buf.writeUIntLE;
			this._writeFloat = this._buf.writeFloatLE;
			this._writeDouble = this._buf.writeDoubleLE;
		}
		else
		{
			this._order = YARN_BIG_ENDIAN;

			this._readInt = this._buf.readIntBE;
			this._readUInt = this._buf.readUIntBE;
			this._readFloat = this._buf.readFloatBE;
			this._readDouble = this._buf.readDoubleBE;

			this._writeInt = this._buf.writeIntBE;
			this._writeUInt = this._buf.writeUIntBE;
			this._writeFloat = this._buf.writeFloatBE;
			this._writeDouble = this._buf.writeDoubleBE;
		}
	}

	clear()
	{
		this._mark = this._position = 0;
		this._limit = this.buf.length;
	}

	flip()
	{
		this._limit = this._position;
		this._mark = this._position = 0;
	}

	rewind()
	{
		this._mark = this._position = 0;
	}

	mark()
	{
		this._mark = this._position;
	}

	reset()
	{
		this._position = this._mark;
	}

	compact()
	{
		this.buf.copy(this.buf, 0, this._position, this._limit);
		this._limit = this._limit - this._position;
		this._position = 0;
	}

	skip(sz)
	{
		if ( sz > this.remaining ) throw "Buffer overflow";
		this._position += sz;
	}

	cut(sz)
	{
		let piece = new Yarn(this._buf, this.order);
		piece._position = this._position;
		piece._limit = this._position + sz;

		return piece;
	}
}

class Tool
{
	constructor(knot)
	{
		this._needSize = this._compileNeedSize(knot.size);
		this._functions = this._compileFunctions(knot.recipes);
	}

	run(ctx, yarn)
	{
		var piece = yarn.cut(ctx.size);
		piece.mark();

		for ( var i = 0; i < this._functions.length; i++ )
		{
			this._functions[i](ctx, piece);
			piece.reset();
		}
	}

	//  TODO cacheable
	get needSize() { return this._needSize(); }


	/**
	 *
	 * @param sz a definition of a size
	 * @private
	 */
	_compileNeedSize(sz)
	{
		if ( isNaN(sz) )
		{

		}
		else
			return function() { return sz; }
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

class Process
{
	/**
	 * @param ee    a _notifier function to be called when a transaction of a communication will be ended
	 */
	constructor(ee)
	{
		this._tools = [];
		this._ref = {};

		this._state = UNKNIT_STATE_INIT;

		/** stich sequence number */
		this._seq = 0;

		/** a information of current stich */
		this._stich = undefined;

		this._notifier = ee;
	}

	prepare(knots)
	{
		for ( var i = 0; i < knots.length; i++ )
		{
			this.addTool(new Tool(knots[i]));
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



class KnitProcess
{
	constructor()
	{
		this._tools = [];
		this._state = -1;
		this._ref = {};
	}

	prepare(knots)
	{
		for ( var i = 0; i < knots.length; i++ )
		{
			this.addTool(new KnitTool(knots[i]));
		}
	}

	addTool(tool)
	{
		this._tools.push(tool);
	}

	resetState()
	{
		this._state = -1;
	}

	notifyEnd()
	{

	}

	notifyError()
	{

	}

	execute(yarn, refmap)
	{
		while(true)
		{
			var next = this._state + 1;
			if ( next >= this._tools.length )
			{
				this.notifyError();
				this.resetState();
				next = 0;
			}

			// check size for verifying whether all data is prepared.
			var sz = this._tools[next].needSize;
			if (yarn.remaining() < sz) return false;

			// run
			var ctx = {size: sz, ref: refmap === undefined ? this._ref : refmap};
			this._tools[next].run(ctx, yarn);

			// check last state..
			this._state = next;
			if ( (next + 1) >= this._tools.length ) {
				//this.notifyStich();
				//this.resetState();

				return;
			}
		}
	}
}

const UNKNIT_STATE_INIT     = 0;

class UnknitProcess
{
	/**
	 * @param ee    a _notifier function to be called when a transaction of a communication will be ended
	 */
	constructor(ee)
	{
		this._tools = [];
		this._ref = {};

		this._state = UNKNIT_STATE_INIT;

		/** stich sequence number */
		this._seq = 0;

		/** a information of current stich */
		this._stich = undefined;

		this.eventEmitter = ee;
	}

	prepare(knots)
	{
		for ( var i = 0; i < knots.length; i++ )
		{
			this.addTool(new UnknitTool(knots[i]));
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

	get eventEmitter() { return this._eventEmitter; }
	set eventEmitter(ee)
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
	{this._eventEmitter.emit("stichError", ecode, msg);
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
			var ctx = {size: sz, ref: this._stich.refmap};
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

class KnitTool
{
	constructor(knot)
	{
		this._needSize = this._compileNeedSize(knot.size);
		this._functions = this._compileFunctions(knot.recipes);
	}

	run(ctx, yarn)
	{
		ctx.size = this._needSize.call();

		for ( var i = 0; i < this._functions.length; i++ )
		{
			this._functions[i](ctx, yarn);
		}
	}

	//  TODO cacheable
	get needSize() { return this._needSize(); }


	/**
	 *
	 * @param sz a definition of a size
	 * @private
	 */
	_compileNeedSize(sz)
	{
		if ( isNaN(sz) )
		{

		}
		else
			return function() { return sz; }
	}

	_compileFunctions(recipes)
	{
		var func = [];

		if ( recipes.ref !== undefined )
		{
			var ref = recipes.ref;
			func.push($KnitFunctions["assign"].bind(this, ref));
		}

		// if "ref" is defined, data have to be parsed into a value
		if ( recipes.mode === undefined )
		{
			recipes.mode = "bin.big_endian"; // TODO have to be set by default.
		}


		var f = $KnitFunctions[recipes.mode];
		func.push(f.bind(this));

		return func;
	}

};

class UnknitTool
{
	constructor(knot)
	{
		this._needSize = this._compileNeedSize(knot.size);
		this._functions = this._compileFunctions(knot.recipes);
	}

	run(ctx, yarn)
	{
		for ( var i = 0; i < this._functions.length; i++ )
		{
			this._functions[i](ctx, yarn);
		}
	}

	//  TODO cacheable
	get needSize() { return this._needSize(); }


	/**
	 *
	 * @param sz a definition of a size
	 * @private
	 */
	_compileNeedSize(sz)
	{
		if ( isNaN(sz) )
		{

		}
		else
			return function() { return sz; }
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
};

var $knotFunctions = {

	"bin.big_endian": function(ctx, yarn) {
		ctx.value = yarn.getUInt(ctx.size);
		console.log("bin.big_endian, sz=" + ctx.size + ", value=" + ctx.value);
		return ctx.value;
	},

	"bin.little_endian": function(ctx, yarn) {
		yarn.order = YARN_LITTLE_ENDIAN;
		ctx.value = yarn.getUInt(ctx.size);
		console.log("bin.little_endian, sz=" + ctx.size + ", value=" + ctx.value);
		return 0;
	},

	"ascii": function(ctx, yarn) {
		ctx.value = 0;
		yarn.skip(ctx.size);
		console.log("ascii, sz=" + ctx.size);
		return 0;
	},

	"assign": function(name, ctx) {
		ctx.ref[name] = ctx.value;
	}

}


var $KnitFunctions = {

	"bin.big_endian": function(ctx, yarn) {
		yarn.putUInt(ctx.value, ctx.size);
		console.log("bin.big_endian, sz=" + ctx.size + ", value=" + ctx.value);
	},

	"bin.little_endian": function(ctx, yarn) {
		yarn.order = YARN_LITTLE_ENDIAN;
		yarn.putUInt(ctx.value, ctx.size);
		console.log("bin.little_endian, sz=" + ctx.size + ", value=" + ctx.value);
	},

	"ascii": function(ctx, yarn) {
		ctx.value = 0;
		yarn.skip(ctx.size);
		console.log("ascii, sz=" + ctx.size);
	},

	"assign": function(name, ctx) {
		ctx.value = ctx.ref[name];
	}

}

class UnknitCallback extends EventEmitter {}

module.exports = {
	version: "0.1"

	, setupWorkshop: function(spec, ee)
	{
		return Workshop.createWorkshop(spec, ee);
	}

	, Yarn:Yarn
	, UnknitCallback:UnknitCallback
}