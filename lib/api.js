'use strict'

const pool = require('./pool');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer'); // v1.0.5
const upload = multer(); // for parsing multipart/form-data

let app = express();
const text_parser = bodyParser.text();

const port = 80 ;

let verbose = false;
const log = console.error.bind(console, "[api.js] ")
const trace = (blabla) => {
	if(verbose) log(blabla);
};

// get custom libraries
fs.readdir('../R/', (err, files) =>{

	let sources = "" ;
	for(let file of files){
		if (file.endsWith('.R')) sources += 'source("../R/' + file + '")\n' ;
	}
	// builds the R interpreters pool -- 8 workers ; ../R folder
	pool.init(8, sources, (err, res) => {
		if(err) trace(err);
		else trace('pool ready');
	});
})

app.get('/', function (request, response) {
	response.send('RExpress 0.1.1')
})
// call a function w/ form-data (safe)
.post('/R/:function', upload.array(), function (request, response) {

	let call = request.params.function + '(' ;
	for(let key in request.body){
		call += key + "=" + request.body[key] + ','
	}
	call = call.substring(0, call.length - 1); // delete last comma
	call += ")" ;
	pool.submit_job(call, (err, res) => {
		if (err) response.send(err)
		else response.send(res);
	})
})
// execute the R program given in body
// -- very unsafe but useful in testing purposes
.post('/R', text_parser, function (request, response) {

	console.log(request.body);
	pool.submit_job(request.body, (err, res) => {
		if (err) response.send(err)
		else response.send(res);
	})
})

app.listen(port);
