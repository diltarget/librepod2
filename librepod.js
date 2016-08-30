express = require('express');
config = require('./config.js');
packages = require('./shell.js');
os = require('os');
var app = express();
var io = require('socket.io')(8001);
var appserve = {};

app.listen(8000);

app.use('/js',express.static(__dirname+"/js"));
app.use('/css',express.static(__dirname+"/css"));

app.get('/',function(req, res){
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/html');
	res.write("<html><body><a href='/editor' class='button'>editor</a><br><a href='/config' class='button'>Config</a><br></body></html>")
	res.end();
});

app.use('/editor',express.static(__dirname+"/test.html"));

app.get('/api/interfaces',function(req,res){
	res.send(packages.public)
});

io.on('connection', function (socket) {
	var my;
  socket.on('save', function (data) {
	  my = undefined;
	  my = new packages.shell(function(){
		var args = Array.from(arguments);
		args.shift();
		socket.emit("debug",args);
		});
	  var d = {};
	  var init = {};
	  var start = [];
    data.elements.forEach(function(k){
		var parm = [];
		for(var dex in k.attrs.parm){
			parm[parseInt(dex)] = k.attrs.parm[dex];
		}
		if(k.label === "run"){
			init[k.id] = true;
		}else{
			d[k.id] = [([k.label]).concat(parm)];
		}
	});
	data.links.forEach(function(k){
		if(init[k.target.id]){
			start.push(k.source.id);
		}else{
			d[k.target.id].push(k.source.id);
		}
	});
	
	Object.keys(d).forEach(function(j){
		var y = Object.assign([],d[j])
		var ma = y.shift();
		var code = ("@"+j + " >> "+ma.join(" "));
		if(y.length > 0){
			code += " >> #"+y.join(" ");
		}
		my.line(code);
	});
	my.line("#"+start.join(" "));
  });
});

