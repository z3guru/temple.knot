const _singletone = {}
class Yarn
{
	constructor(sz)
	{
		if ( !_singletone["Yarn"] ) throw "Error";
		this._buf = new Buffer(sz);
	}

	static allocate(sz)
	{
		try
		{
			_singletone["Yarn"] = true;
			return new Yarn(sz);
		}
		finally
		{
			_singletone["Yarn"] = false;
		}
	}

	get capacity() { return this._buf.length; }
}


try
{
	var buf = Buffer.from([1, 5]);
	console.log("???=" + buf.readInt8(0));
	var f = buf.readInt8;
	console.log("???=" + f(0));
	console.log("???=" + Reflect.apply(buf.readInt8, buf, [0]));
	console.log("???=" + buf.readUIntBE(0, 2));


	var y1 = Yarn.allocate(10);
	console.log("y1.capacity=" + y1.capacity);
	var y2 = new Yarn(20);
	console.log("y2.capacity=" + y2.capacity);
}
catch(e)
{
	console.error(e);
}