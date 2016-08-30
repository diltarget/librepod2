fs = require('fs');
os = require('os');

reference = function(ref){
	if(ref == undefined || !(ref instanceof Array) || ref.length == 0){
		return false;
	}
	
	//console.log(ref);
	
	try{
	
	fs.statSync(os.homedir()+"/.librepod/events/"+ref[0]+".js");
	
	var e = require(os.homedir()+"/.librepod/events/"+ref[0]+".js");
	//console.log(e);
	for(var q = 1; q < ref.length && e instanceof Object; q++){
		e = e[ref[q]];
		
	} 
	
	if(e instanceof Function){
		return e;
	}
	
	} catch(err){
		var rap = {dir:this.dir+ref[0]+"/"};
		ref.splice(0,1);
		return reference.call({dir:rap},ref);
	}
	
	return false
}

call = function(ref){
	return reference.call({dir:"/.librepod/events/"},ref);
}

//console.log(call(["file","read"]))

exports.call = call;
