var net = require('net');

const __ascii = [ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
const __utils = {

	itoa: function(bb, sz, pad)
	{
		let s = '';
		let vv = bb;
		let len = isNaN(sz) ? 0 : sz;
		let cnt = 0;

		while(len == 0 || (cnt++ < len))
		{
			let nn = vv & 0x0F;
			s =  __ascii[nn] + s;

			vv = vv >> 4;
			if ( vv == 0 )
			{
				if ( pad !== undefined ) s = s.padStart(sz, pad);
				break;
			}
		}

		return s;
	}
}

class Skein
{
	/**
	 *
	 * @param param a size of a buffer OR a buffer from Buffer
	 */
	constructor(param, order)
	{
		if ( param instanceof Buffer ) this._buf = param;
		else if ( typeof(param) === "number") this._buf = Buffer.alloc(param);
		else if ( Array.isArray(param) ) this._buf = Buffer.from(param);
		else
			throw "invalid parameters";

		this._mark = this._position = 0;
		this._limit = this._buf.length;
		this.order = order === undefined ? Skein.BIG_ENDIAN : order;
	}

	static get LITTLE_ENDIAN()  { return 0; };
	static get BIG_ENDIAN()     { return 1; };
	static allocate(sz)
	{
		return new Skein(sz);
	}

	static wrap(bbuf)
	{
		let yarn = Array.isArray(bbuf) ? new Skein(Buffer.from(bbuf)) : new Skein(bbuf);
		return yarn;
	}

	get buf() { return this._buf; }

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
		this._buf.writeUInt8(b, this._position++);
	}

	get()
	{
		if ( this.remaining == 0 ) throw "Buffer overflow";
		return this._buf.readUInt8(this._position++);
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

	putShort(vv) { this.putShort(vv, 2); }
	getShort() { return this.getInt(2); }

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

	putArray(arr, pos, offset)
	{

	}

	putBuffer(bbuf, pos, offset)
	{
		if ( bbuf.length > this.remaining ) throw "Buffer overflow";

		var ppos = isNaN(pos) ? 0 : pos;
		var ooff = isNaN(offset) ? bbuf.length : offset;
		bbuf.copy(this._buf, this._position, ppos, ppos + ooff)
		this._position = ppos + ooff;
	}

	putSkein(skein, sz)
	{
		if ( sz > this.remaining() ) throw "Buffer overflow";
		if ( sz > skein.remaining() ) throw "Buffer overflow";

		var ppos = skein.position;
		var ooff = sz;
		skein.buf.copy(this._buf, this._position, ppos, ppos + ooff)
		skein.position += ooff;
	}

	get order() { return this._order; }
	set order(ord)
	{
		if ( this._order == ord ) return;

		if ( ord == Skein.LITTLE_ENDIAN )
		{
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
			this._readInt = this._buf.readIntBE;
			this._readUInt = this._buf.readUIntBE;
			this._readFloat = this._buf.readFloatBE;
			this._readDouble = this._buf.readDoubleBE;

			this._writeInt = this._buf.writeIntBE;
			this._writeUInt = this._buf.writeUIntBE;
			this._writeFloat = this._buf.writeFloatBE;
			this._writeDouble = this._buf.writeDoubleBE;
		}

		this._order = ord;
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
		this._position = this._limit - this._position;
		this._limit = this.capacity;
	}

	skip(sz)
	{
		if ( sz > this.remaining ) throw "Buffer overflow";
		this._position += sz;
	}

	/**
	 * make duplicate bufm, but set dup's limit is set by position + sz
	 * and source yarn's position is set by being added sz(consumed)
	 *
	 * @param sz
	 * @returns {Skein}
	 */
	cut(sz)
	{
		let piece = new Skein(this._buf, this.order);
		piece._position = this._position;
		piece._limit = this._position + sz;
		this._position += sz;

		return piece;
	}

	duplicate()
	{
		let dup = new Skein(this._buf, this.order);
		dup._position = this._position;
		dup._limit = this._limit;

		return dup;
	}

	toHexString()
	{
		let dup = this.duplicate();

		let cols = 0;
		let str = '';
		let bin = '';
		let txt = '';
		while(dup.hasRemaining())
		{
			let bb = dup.get();
			bin += __utils.itoa(bb, 2, '0') + ' ';
			txt += (bb >= 0x20 && bb <= 0x7E) ? String.fromCharCode(bb) : '.';

			if ( ++cols == 16 )
			{
				cols = 0;
				str += (bin + '\t' + txt + '\n');
				bin = txt = '';
			}
		}

		if ( cols > 0 )
		{
			for ( ; cols < 16; cols++ ) bin += '   ';
			str += (bin + '\t' + txt + '\n');
		}

		return str;
	}
}

class IOApplication
{
	ondata(yarn) { }
}

class IODevice
{
	send(yarn) { }
	ondata(callback)
	{
		this._ondataCallback = callback;
	}
}

const __ADAPTER_TYPE = { DEVICE:0, APPLICATION:1 };
const __DEFAULT_TIMEOUT =
{
	  T3: { time:45000, enable:false }     // ms, Reply timeout
	, T5: { time:10000, enable:false }     // ms, Connection separation timeout
	, T6: { time:5000 , enable:false }     // ms, Control Transaction timeout
	, T7: { time:10000, enable:false }     // ms, Not selected timeout (in SEMI)
	, T8: { time:5000 , enable:false }     // ms, Maximum time between successive bytes.
};

class IOPlug
{
	static get ADAPTER_TYPE() { return __ADAPTER_TYPE; }

	constructor()
	{
		this._seq = 0;
		this._timeout = Object.assign({}, __DEFAULT_TIMEOUT);
		this._timeoutHandler = {};
	}

	get timeout() { return this._timeout; }

	attach(type, adapter)
	{
		switch(type)
		{
			case IOPlug.ADAPTER_TYPE.DEVICE:
				this._device = adapter;
				this._device.ondata(this.recv.bind(this));
				break;

			case IOPlug.ADAPTER_TYPE.APPLICATION:
				this._application = adapter;
				break;

			default:
				throw new Error("Unknown adapter type: check IOPlug.ADAPTER_TYPE");
		}
	}

	send(yarn)
	{
		this._device.send(yarn);
	}

	recv(yarn)
	{
		try
		{
			//TODO clearTimeout(this._timeoutHandler.T8);
			this._application.ondata(yarn);
		}
		finally
		{
			//TODO this._timeoutHandler.T8 = setTimeout();
		}
	}
}

class SocketDevice extends IODevice
{
	constructor(host, port)
	{
		super();
		this._host = host;
		this._port = port;
		this._recvYarn = Skein.allocate(4096);   // TODO with option
	}

	listen()
	{
		var that = this;
		var svr = net.createServer(function(socket) {
			socket.on('data', that._ondata.bind(that));
			socket.on('end', that._onend.bind(that));
		});

		svr.on('connection', that._onconnect.bind(that));
		svr.on('error', (e)=>{
			console.error(e);
		});
		svr.listen({host:this._host, port:this._port, exclusive:false});
		console.log('running...');
	}

	connect()
	{
		this._socket = new net.Socket();
		this._socket.on("connect", this._onconnect.bind(this, this._socket));
		this._socket.on('data', this._ondata.bind(this));
		this._socket.on('end', this._onend.bind(this));
		this._socket.connect({host:this._host, port:this._port});
	}

	_onconnect(socket)
	{
		console.log("[SocketDevice] _onconnect, socket=" + socket);
	}

	_ondata(buf)
	{
		if ( this._ondataCallback === undefined ) return;

		this._recvYarn.putBuffer(buf);
		this._recvYarn.flip();

		// call callback...
		try { this._ondataCallback(this._recvYarn); }
		catch(e) { console.error(e.message, e); }
		//
		this._recvYarn.compact();
	}
	_onend()
	{
		console.debug("[SocketDevice] on:end");
	}
}


module.exports = {
	version: "0.1"
	, Skein: Skein
	, Util: __utils
	, IOPlug: IOPlug
	, IOApplication: IOApplication
}