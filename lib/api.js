'use strict'

const pool = require('./pool');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer'); // v1.0.5
const upload = multer(); // for parsing multipart/form-data
//const csvParser = require('csv-parse');
const parse = require('csv-parse/lib/sync')

const os = require('os');

let app = express();
const text_parser = bodyParser.text();

app.use(bodyParser.text({
  inflate: true,
  limit: '10000kb',
  type: '*/*'
}));
const port = 8080 ;

let verbose = false ;

// tableau
const parse_body = (req, res, next) => {
	console.log("hello");
	console.log(req.body);
    if (req.is('application/json')) {
		try {
			let body = JSON.parse(req.body)
			console.log(body);
			console.log("VALIDE")
			next()
		} catch (e) {
			console.log("PAS VALIDE")
			res.send(400);
		}
	} else if(req.is('text/csv')){
		try {
			//let bod = csvParser(req.body, {delimiter: ','});
			let bod = parse(req.body, {delimiter: ','});
			console.log(bod);
			console.log("VALIDE");
		} catch (e) {
			console.log("PAS VALIDE")
			res.send(400);
		}
    } else {
		res.send(400);
    }
//}
	//req.call = ... fonction ...
}


// number of workers ; first arg or 4 * nb of cores (default)
const nb_workers = Number(process.argv[2]) ?
	Number(process.argv[2])
	: os.cpus().length * 4


const log = console.error.bind(console, "[api.js] ")
const trace = (blabla) => {
	if(verbose) log(blabla);
};

// get custom libraries
exports.init = () => {
	fs.readdir('../R/', (err, files) => {

		let sources = "" ;
		for(let file of files){
			if (file.endsWith('.R')) sources += 'source("../R/' + file + '")\n' ;
		}
		// builds the R interpreters pool -- 8 workers ; ../R folder
		pool.init(nb_workers, sources, (err, res) => {
			if(err) trace(err);
			else trace('pool ready');
		});
	})
}


app.get('/', function (request, response) {
	response.send('RExpress')
})
// call a function w/ form-data (safe)
//.post('/R/:function', upload.array(), functfunction (request, response) ion (request, response) {
.post('/R/:function', parse_body, function (request, response) {

	// mettre dans un middleware
	let call = request.params.function + '('
	let args = []
	if(request.body){
		for(let key in request.body){
			let value = request.body[key]
			args.push(key + "=" + value)
		}
		//if(call.endsWith(",")) call = call.substring(0, call.length - 1); // delete last comma
	}
	call += args.join(',') + ")" ;

	// laisser pour l'instant
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

this.init() ;

exports.port = port;
//exports.parse_body = parse_body;
