var packages = require('./app.js');
var sqlite3 = require('sqlite3');

var dbblock = {};
var data = {};

Object.keys(packages.configs).forEach(function(c){
	var t = c.split(".");
	var lib = t.shift();
	var call = t.join(".");
	
	if(!dbblock[lib]){
		
		try{
			fs.accessSync(os.homedir()+"/.librepod/appdata/"+lib)
			dbblock[lib] = new sqlite3.Database(os.homedir()+"/.librepod/appdata/"+lib+".db");
		}catch(err){
			fs.writeFileSync(os.homedir()+"/.librepod/appdata/"+lib+".db","");
			dbblock[lib]= new sqlite3.Database(os.homedir()+"/.librepod/appdata/"+lib+".db");
		}
	}
	
	dbblock[lib].run("CREATE TABLE IF NOT EXISTS "+call+" (id text PRIMARY KEY,data blob)");
	
	data[c] = new appData(call,dbblock[lib]);
	
});

function appData(name,db){
	this.db = db;
	this.name = name;
}

appData.prototype.header = function(callback){
	this.db.all("SELECT id FROM "+this.name,function(err,rows){
		var head = [];
		rows.forEach(function(k){
			head.push(k.id);
		});
		callback(head);
	});
}

appData.prototype.get = function(id,callback){
	this.db.get("SELECT data FROM "+this.name+" WHERE id = ?",[id],function(err,row){
		callback(row.data);
	});
}

appData.prototype.set = function(id,data){
	this.db.run("INSERT OR REPLACE INTO "+this.name+" (id,data) VALUES(?,?)",[id,data]);
} 

module.exports = data;
