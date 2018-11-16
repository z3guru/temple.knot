var fs = require('fs');
var path = require('path');
var net = require('net');
var sleep = require('system-sleep');

var assert = require('assert');
var rewire = require("rewire");
var nio = rewire('../../prototype2/skein');

const CONNOPT = { host:"localhost", port:3131 };

describe("TestClientMode", function() {

	const __ctx = {
		  demoServer: undefined
		, ioplug: undefined
	};

	before(function() {
		__ctx.ioplug = new nio.IOPlug();


		__ctx.demoServer = net.createServer(function(socket) {
			console.log("[demoServer] connected")
			socket.on('data', function(buf) {

			});
			socket.on('end', function() {
				console.log("[demoServer] end");
			});


		});

		__ctx.demoServer.on('error', (e)=>{
			console.error(e);
		});
		console.log("[demoServer] listen")
		__ctx.demoServer.listen({host:"localhost", port:3131, exclusive:true});
	});

	it("testRun", function() {
		let SocketDevice = nio.__get__("SocketDevice");
		let dev = new SocketDevice("localhost", 3131);

		__ctx.ioplug.attach(nio.IOPlug.ADAPTER_TYPE.DEVICE, dev);

		//
		dev.connect();
	});
});

describe("TestServerMode", function() {

	const __ctx = {
		client: undefined
		, ioplug: undefined
		, myapp: undefined
	};

	class MyApp extends nio.IOApplication
	{
		ondata(yarn)
		{
			console.log(yarn.toHexString());
		}
	}

	before(function() {
		__ctx.ioplug = new nio.IOPlug();
		__ctx.client = new net.Socket();
		__ctx.client.on("connect", function() {
			console.log("Test client is connected");
			__ctx.client.write("Hello world");
		});
		//__ctx.client.on('data', this._ondata.bind(this));
		//__ctx.client.on('end', this._onend.bind(this));

		__ctx.myapp = new MyApp();
	});

	it("testRun", function() {
		let SocketDevice = nio.__get__("SocketDevice");
		let dev = new SocketDevice("localhost", 3131);

		__ctx.ioplug.attach(nio.IOPlug.ADAPTER_TYPE.DEVICE, dev);
		__ctx.ioplug.attach(nio.IOPlug.ADAPTER_TYPE.APPLICATION, __ctx.myapp);

		//
		dev.listen();
		sleep(1 * 1000);
		__ctx.client.connect(CONNOPT);

		sleep(35 * 1000);
	});
});


describe("TestAwait", function() {

	const __ctx = {
		size: 0
	};

	function noop()
	{
	}

	function* checkSize()
	{
		let count = 0;
		while ( __ctx.size == 0 )
		{
			yield count++;
		}
	}

	it("testRun", function() {

		let fnSize = checkSize();

		checkSize();
		sleep(1 * 1000);
		console.log(fnSize.next().value);
		sleep(1 * 1000);
		console.log(fnSize.next().value);
		sleep(1 * 1000);
		console.log(fnSize.next().value);
		__ctx.size = 1;
		sleep(1 * 1000);
		console.log(fnSize.next().value);
		sleep(1 * 1000);
		console.log(fnSize.next().value);
	});

	async function fnAsync(promise) {
		try
		{
			console.log("waiting...");
			let result = await promise; // wait till the promise resolves (*)
			console.log(result);        // "done!"
		}
		catch(e)
		{
			console.error(e.message, e);
		}
	}

	class Exchanger
	{
		constructor()
		{
			let that = this;
		}

		async exchange(value, timeout)
		{
			if ( this.peer === undefined )
			{
				let that = this;
				this.peer = value;
				this.promise = new Promise((resolve, reject) => {
					that.resolve = resolve;
					setTimeout(()=>{ reject(); }, timeout);
				});

				try
				{
					console.log('waiting...');
					await this.promise;
					console.log('wake up');
					return this.exchanged;
				}
				catch(e) { console.log(e); }
			}
			else
			{
				this.exchanged = value;
				this.resolve('exchanged');
				return this.peer;
			}
		}

		interrupt()
		{
			this.resolve("done!");
		}
	}

	it("testRun2", function() {
		try
		{
			let exchanger = new Exchanger();

			let value1 = exchanger.exchange(1, 100);
			sleep(1 * 1000);
			let value2 = exchanger.exchange(2);
			sleep(1 * 1000);

			value1.then((v)=>console.log('value1=' + v)).catch(()=>console.log("rejected"));
			value2.then((v)=>console.log('value2=' + v));
		}
		catch(e)
		{

		}
	});

});