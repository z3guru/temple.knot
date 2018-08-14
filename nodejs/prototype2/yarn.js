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

	putYarn(yarn, sz)
	{
		if ( sz > this.remaining() ) throw "Buffer overflow";
		if ( sz > yarn.remaining() ) throw "Buffer overflow";

		var ppos = yarn.position;
		var ooff = sz;
		yarn.buf.copy(this._buf, this._position, ppos, ppos + ooff)
		yarn.position += ooff;
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
	 * @returns {Yarn}
	 */
	cut(sz)
	{
		let piece = new Yarn(this._buf, this.order);
		piece._position = this._position;
		piece._limit = this._position + sz;
		this._position += sz;

		return piece;
	}

	duplicate()
	{
		let dup = new Yarn(this._buf, this.order);
		dup._position = this._position;
		dup._limit = this._limit;

		return dup;
	}
}

module.exports = {
	version: "0.1"
	, Yarn: Yarn
}