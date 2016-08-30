var packages = require('./app.js');
var appdata = require('./config.js')
var statements = {};
var quick = {};
var form = {}

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

Object.keys(packages.events).forEach(function(k){
	statements[k] = packages.events[k];
	quick[k] = {"":packages.events[k]};
});

Object.keys(packages.interfaces).forEach(function(k){
	var type = Object.keys(packages.interfaces[k])[0];
	var data = packages.interfaces[k][type];
	
	if(quick[type] == undefined){
		quick[type] = {};
	}
	
	
	if(quick[type][data.toString()] == undefined){
		quick[type][data.toString()] = packages.events[k];	
		delete quick[k]
	}
});

for(var sub in quick){
	form[sub] = [];
	if(packages.interface_types[sub]){
		form[sub][0] = packages.interface_types[sub].selectors
		form[sub][1] = packages.interface_types[sub].output || [];
		for(var part in form[sub][0]){
			if(form[sub][0][part] instanceof request){
				var n = form[sub][0][part].query-1;
				form[sub][0][part] = [];
				for(var sel in quick[sub]){
					form[sub][0][part].push(sel.split(",")[n]);
				}
			}
		} 
	}else{
		form[sub][0] = quick[sub][""].parameters || [];
		form[sub][1] = quick[sub][""].output || [];
	}
}

console.log(form);

function interpreter(stmt,context){
	
	if(stmt === "DEBUG"){
		return context.end()
	}
		
	if(stmt[0] === "#"){
		stmt = stmt.substring(1).split(" ");
		return context.emit(stmt);
	}
		
	if(stmt[0] === "@"){
		stmt = stmt.substring(1).split(" ");
		return context.on(stmt);
	}
	
	var parm = [];
	stmt.split(" ").forEach(function(k,i){
		if(k[0] === "$"){
			parm[i] = new request(k.substring(2,k.length-1).split(","));
		}else{
			parm[i] = k
		}
	});
		
	if(stmt[0] === "[" && stmt[stmt.length-1] === "]"){
		stmt = parm;
		stmt[0] = stmt[0].substring(1);
		stmt[stmt.length-1] = stmt[stmt.length-1].substring(0,stmt[stmt.length-1].length-1)
		return context.inject(stmt);
	}
	var head = parm.shift();	
	var func;

	if(packages.interface_types[head]){
		var p = [];
		var a = [];

		parm.forEach(function(k,i){
			var f = packages.interface_types[head].selectors[i];
			if(f instanceof request){
				a[f.query] = k;
			}else{
				p[f] = k;
			}
		});
		a.shift();
		p.shift();
		func = quick[head][a.toString()];
		parm = p;
	}else{
		func = statements[head] || quick[head][""];
		console.log(statements[head]);
	}
		
	if(func.parameters){
		func.parameters.forEach(function(k,i){
			if(appdata[k]){
				parm[i] = appdata[k].get.bind(appdata[k],parm[i]);
			}
		});
	}
	
	return context.next(func,parm);
		
}

function shell(callback){
	this.global = new task(callback);
	this.global.parm = [];
	this.mem = {};
}

shell.prototype.line = function(line){
	var stmt = line.split(/( >> )/);
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
			last = interpreter(stmt[i],use);
			use = this.global;
		}
	}
}




module.exports.shell = shell;
module.exports.statements = statements;
module.exports.public = form;
