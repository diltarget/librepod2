spawn = require('threads').spawn;

function shell(callback){
	this.thread = spawn(function(input,done,progress){
		var liberpod = require("librepod");
		this.interpreter = librepod.interpreter;
		this.global = new task(progress);
		this.global.parm = [];
		this.mem = {};
		done();
	});
	this.thread.send()
	.on('progress',callback);
}


shell.prototype.line = function(line){
	this.thread.run(function(input,done){
		var stmt = input.split(/( >> )/);
		var last = null;
		var use = this.global;
	
		for(var i = 0; i < stmt.length; i++){
			if(stmt[i] === " >> "){
				use = last;
			}else if(stmt[i][0] === "+"){
				var o = stmt[i].substring(1);
				last = this.mem[o]
			}else if(stmt[i][0] === "="){
				var o = stmt[i].substring(1);
				this.mem[o] = last;
			}else{
				last = this.interpreter(stmt[i],use);
				use = this.global;
			}
		}
		done()
	}).send(line)
}

shell.prototype.kill = function(){
	this.thread.kill();
}

module.exports = shell;
