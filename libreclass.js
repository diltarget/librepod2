//libreclass.js
var e = require('events');
var library = require('./event.js');
var util = require('util');

var appevent = new e();

function task(global){
	this.thread  = new e();
	this.global = global;
	this.data = null;
}

task.prototype.implement = function(call,args,post){
	if(typeof call === "function"){
		var c = call;
	}else{
		var c = library.call(call);
	}
	var t = new task(this.global);
	
	if(!post){
		post = [];
	}
	
	if(!args){
		args = [];
	}

	if(this.data != null){
		var arguments = (args.concat(this.data)).concat(post).concat([t.chain.bind(t)]);
		c.apply(c,arguments);
	}
	
	this.thread.on("task",function(){
		var arguments = Array.from(arguments);
		arguments = (args.concat(arguments)).concat(post).concat([t.chain.bind(t)]);
		console.log(arguments);
		c.apply(c,arguments);
	});
	
	return t;
}

task.prototype.get = function(call,args){
	if(typeof call === "function"){
		var c = call;
	}else{
		var c = library.call(call);
	}
	var t = new task(this.global);
	if(this.data != null){
		var d = this.data;
		if(args instanceof Array){
			d = d.concat(args);
		}
		
		t.chain(null,c.apply(c,d));
	}
	
	this.thread.on("task",function(){
		arguments = Array.from(arguments);
		
		if(args instanceof Array){
			arguments = arguments.concat(args);
		}
		//console.log(c.apply(c,arguments.concat(args)));
		t.chain(null,c.apply(c,arguments));
	});
	
	return t;
}

task.prototype.chain = function(){
	if(arguments[0]) throw arguments[0];
	
	arguments = Array.from(arguments);
	arguments.splice(0,1);
	this.data = arguments;
	this.thread.emit.apply(this.thread,(["task"]).concat(arguments));
	
}

task.prototype.use = function(args){
	var t = new task(this.global);

	if(!args){
		args = [];
	}

	if(this.data != null){
		this.global.callback.apply(this.global,this.data.concat(args));
	}
	var self = this;
	this.thread.on("task",function(){
		arguments = Array.from(arguments);
		self.global.callback.apply(self.global,arguments.concat(args));
	});
	
}

task.prototype.if = function(){
	var t = new task(this.global);
	var args = Array.from(arguments);
	if(this.data != null){
		for(var i = 0; i < args.length && i < this.data.length;i++){
			
			if(args[i] === this.data[i]){
				t.chain.apply(t,([null]).concat(this.data));
				break;
			}
		}
	}
	
	this.thread.on("task",function(){
		var arguments = Array.from(arguments);
		
		for(var i = 0; i < args.length && i < arguments.length;i++){
			
			if(args[i] === arguments[i]){
				t.chain.apply(t,([null]).concat(arguments));
				break;
			}
		}
		
	});
	
	return t;
}

task.prototype.inject = function(args){
	var t = new task(this.global);
	if(this.data != null){
		var d = [];
		if(args instanceof Array){
			d = d.concat(args);
		}
		t.chain.apply(t,([null]).concat(d));
	}
	
	this.thread.on("task",function(){
		var d = [];
		
		if(args instanceof Array){
			d = d.concat(args);
		}
		t.chain.apply(t,([null]).concat(d));
	});
	
	return t;
}

task.prototype.broadcast = function(target,args,post){
	if(!post){
		post = [];
	}
	
	if(!args){
		args = [];
	}
	
	var self = this;

	if(this.data != null){
		var arguments = (args.concat(this.data)).concat(post);
		appevent.emit.apply(appevent,([target]).concat(arguments));
	}
	
	this.thread.on("task",function(){
		var arguments = Array.from(arguments);
		arguments = (args.concat(arguments)).concat(post);
		appevent.emit.apply(appevent,([target]).concat(arguments));
	});
	
	return this;
}
	
	
function event(call){
	this.type = "event";
	var self = this;
	return function(){
		self.callback = arguments[arguments.length-1];
		return call.apply(self,arguments);
	}
}

event.prototype = {
	implement:function(call,args){
		if(typeof call === "function"){
			var c = call;
		}else{
			var c = library.call(call);
		}
	
		if(!args){
			args = [];
		}
		
		var t = new task(this)
		c.apply(c,(args).concat([t.chain.bind(t)]))
		return t;
	},
	get:function(call,args){
		if(typeof call === "function"){
			var c = call;
		}else{
			var c = library.call(call);
		}
		var t = new task(this)
		t.chain(null,c.apply(c,args));
		return t;
	},
	inject:function(args){
		var t = new task(this)
		t.chain.apply(t,([null]).concat(args));
		return t;
	},
	listen:function(target){
		var t = new task(this);
		appevent.on(target,t.chain.bind(t,null));

		return t;
	}	
}

function app(call){
	this.type = "app";
	this.callback = function(){};
	this.configFormat = [];
	this.main = call.bind(this);
}

util.inherits(app, event);

app.prototype.config = function(tag,type){
	this.configFormat([tag,type]);
	return {config:this.config}
}

var fs = require('fs');
os = require('os');


var rand = new event(function(){
	this.implement(["timer"],[5000])
	.get(Math.random)
	.use();
	//.broadcast("rand");
	
});

var stuff = new app(function(){
	
	
	//this.implement(rand);
	
	this.listen("rand")
	.get(console.log);
});

stuff.main();

//console.log(stuff.configFormat);

var g = require('./gay.app');

g();
g.wow();

//exports.event = event;
//exports.app = app;
//exports.appevent = appevent;
