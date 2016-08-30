var library = require('./event.js');
var e = require('events');
var util = require('util');

Function.prototype.clone = function() {
    var that = this;
    var temp = function temporary() { return that.apply(this, arguments); };
    for(var key in this) {
        if (this.hasOwnProperty(key)) {
            temp[key] = this[key];
        }
    }
    return temp;
};

var threads = {global:new e()}

function load_function(call){
	if(call instanceof Function){
		return call;
	}else{
		return library.call(call);
	}
}

function request(query){
	this.query = query;
}

function data(block){
	this.block = block;
}

function task(global,context){
	this.global = global;
	this.parm;
	this.block;
	this.thread = new e();
	this.context = context || new e();
	var self = this;
	this.thread.on("event",function(){
		var args = Array.from(arguments);
		self.block = args.splice(0,1)[0];
		self.parm = args;
	});
}

task.prototype.next = function(call,args){
	var f = load_function(call);
	
	var t = new task(this.global,this.context);	
	var self = this;
	if(this.parm){
		var local_block = this.block || {};
		var local_parm = this.parm;
		var p = Object.assign([],args) || [];
		var c = f.clone();
		p.forEach(function(k,i){
			if(k instanceof request){
				
				if(k.query instanceof Array){ 
					p[i] = local_parm[k.query[0]] || local_block[k.query[0]]
					for(var r = 1; r < k.query.length; r++){
						if(p[i] == undefined){
							break;
						}
						p[i] = p[i][k.query[r]];
					}
				}
			}
		});
		
		if(!c.get){
			c.get = Object.assign({},local_block);
			
			if(c.parameters){
				c.parameters.forEach(function(par,i){
					if(p[i] != undefined){
						c.get[par] = p[i];
					}
				});
			}
		}
		
		f.apply(c,p.concat(t.pass.bind(t,new data(local_block),f.output||[])));
		
	}
	
	this.thread.on("event",function(){
		arg_local = Array.from(arguments);
		var local_block = arg_local.splice(0,1)[0];
		var p = Object.assign([],args) || [];
		console.log(call);
		var c = f.clone();
		//console.log(arguments);
		p.forEach(function(k,i){
			if(k.query instanceof Array){ 
				p[i] = arg_local[k.query[0]] || local_block[k.query[0]]
				for(var r = 1; r < k.query.length; r++){
					if(p[i] == undefined){
						break;
					}
					p[i] = p[i][k.query[r]];
				}
			}
		});
		
		if(!c.get){
			c.get = Object.assign({},local_block);
			if(c.parameters){
				c.parameters.forEach(function(par,i){
					if(p[i] != undefined){
						c.get[par] = p[i];
					}
				});
			}
		}
		
		f.apply(c,p.concat(t.pass.bind(t,new data(local_block),f.output||[])));

	});
	return t;
}

task.prototype.pass = function(){
	if(arguments[2])throw arguments[2];
	
	var local_block = (arguments[0] && arguments[0].block) || {};
	var output = arguments[1]
	
	arguments = Array.from(arguments);
	arguments.splice(0,3);
	var args = arguments;
	output.forEach(function(k,i){
		if(args[i]){
			local_block[k]=args[i];
		}
	});
	var req = ["event"]
	req.push(local_block);
	req = req.concat(args);
	this.thread.emit.apply(this.thread,req);
	
}

task.prototype.inject = function(args){
	var t = new task(this.global,this.context);	
	var self = this;

	if(this.parm){
		var p = args || [];
		
		p.forEach(function(k,i){
			if(k instanceof request){
				p[i]=self.parm[k.query] || self.block[k.query]
			}
		});
		//console.log(p);
		t.thread.emit.bind(t.thread,"event",this.block).apply(t.thread,p);
	}
	
	this.thread.on("event",function(){
		arguments = Array.from(arguments);
		var local_block = arguments.splice(0,1)[0] || {};
		var p = args || [];
		p.forEach(function(k,i){
			if(k instanceof request){
				p[i]=arguments[k.query] || local_block[k.query]
			}
		});
		//console.log(p);
		t.thread.emit.bind(t.thread,"event",local_block).apply(t.thread,p);		
		
	})
	
	return t;
}

task.prototype.end = function(){
	if(!this.global) return this;
	
	var self = this;
	if(this.parm){
		var p = ([null]).concat(this.parm);
		this.global.apply(this.global,p);
	}
	
	this.thread.on("event",function(){
		arguments = Array.from(arguments);
		var local_block = arguments.splice(0,1);
		var p = ([null]).concat(arguments);
		self.global.apply(self.global,p);
	});
	return this;
}

task.prototype.on = function(tag){
	var t = new task(this.global,this.context);
	tag = (tag instanceof Array && tag) || [tag]
	var self = this;
	
	tag.forEach(function(k){
		self.context.on(k,t.thread.emit.bind(t.thread,"event"));
	});
	
	return t;
}

task.prototype.emit = function(tag){
	//this.thread.on("event",this.context.emit.bind(this.context,"wow"))
	tag = (tag instanceof Array && tag) || [tag]
	
	var self = this;
	tag.forEach(function(k){
		
		if(self.parm){
			self.context.emit.bind(self.context,k,self.block).apply(self.context,self.parm);
		}
	
		self.thread.on("event",self.context.emit.bind(self.context,k));
	});
	return this;
}

//NOT READY
/*task.prototype.add = function(t){
	t.thread.on("event",console.log);
	t.thread.on("event",this.thread.emit.bind(this.thread,"event"))
	return this;
}*/

function event(func){
	var self = this;
	return function(){
	
		args = Array.from(arguments);
	
		var spawn = new task(args.pop());
		spawn.wait = function(tag){
			return spawn.context.emit.bind(spawn.context,tag);
		}
		
		spawn.listen = function(tag){
			return spawn.context.on.bind(spawn.context,tag);
		}
		var local_block = this.get || {};
		var p = args || [];
		
		spawn.block = this.get;
		spawn.parm = p;
		spawn.get = this.get;
	
		func.apply(spawn,args);
		
		//return spawn;
	}
}

function config(data,header){
	this.id = header;
	
	this.format = data;
}

function interface(selectors){
	this.selectors = selectors;
}

GLOBAL.event = event;
GLOBAL.config = config;
GLOBAL.request = request;
GLOBAL.interface = interface;
GLOBAL.task = task;
