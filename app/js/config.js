"use strict";

const electron = require('electron');
// Module to control application life and module to create native browser window.
const {app} = electron;
// Module to manipulate files
const fs = require('fs');
// Module to manage config
const nconf = require('nconf');

let path = app.getPath('documents') + "\\Desktop TV Remote User Files\\";

// Check if folder with user data exists if not create folder with initial data
if (!fs.existsSync(path + 'config.json')) {
	try{
		fs.accessSync(path);
	}catch(err){
		fs.mkdirSync(path)//create dir if doesn't exists
	}
	try{
		let configSchema = require('../data/configSchema.json');//Default config objec
		fs.appendFileSync(path + 'config.json', JSON.stringify(configSchema), 'utf8');//create new config file
	}catch(err){
		app.quit();
	}
}

nconf.add('configuration', {type: 'file', file: path + 'config.json'});//load config to n-conf

module.exports = nconf;