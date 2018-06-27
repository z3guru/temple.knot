var fs = require('fs');
var path = require('path');
var knot = require('../workshop');

console.log("__dirname=" + __dirname);
var spec = JSON.parse(fs.readFileSync(path.resolve(__dirname, './case1.json'), 'utf8'));
var workshop = knot.setupWorkshop(spec);
var refmap = {};

workshop.unknitProcess.execute(knot.Yarn.wrap(new Buffer([0,0,0,1,0,0,0,2,0,1])), refmap);

var sendYarn = knot.Yarn.allocate(1024);
workshop.knitProcess.execute(sendYarn, refmap);
console.log("sendYarn.position=" + sendYarn.position);