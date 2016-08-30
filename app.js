var fs = require('fs'),
    path = require('path');
var os = require('os');
var util = require('util');
var e = require('events');
require('./class');

var apps = {};
var events = {};
var configs = {};
var parameters = {};
var interfaces = {};
var interface_types = {};

function getApps(){
	list = fs.readdirSync(os.homedir()+"/.librepod/apps");
	list.forEach(function(k){
		apps[k] = require(os.homedir()+"/.librepod/apps/"+k+"/app.js");
	})
}

function build(){
	Object.keys(apps).forEach(function(k){
		Object.keys(apps[k]).forEach(function(g){
			if(apps[k][g] instanceof Function){
				events[k+"."+g]=apps[k][g];
				parameters[k+"."+g]=(apps[k][g].parameters?apps[k][g].parameters:[]);
				if(apps[k][g].interface){
					interfaces[k+"."+g]=apps[k][g].interface;
				}
			}else if(apps[k][g] instanceof config){
				configs[k+"."+g]=apps[k][g];
			}else if(apps[k][g] instanceof interface){
				interface_types[g] = apps[k][g];
			}
		});
	});
}

getApps();
build();

module.exports.events = events;
module.exports.configs = configs
module.exports.parameters = parameters
module.exports.interfaces = interfaces
module.exports.interface_types = interface_types
