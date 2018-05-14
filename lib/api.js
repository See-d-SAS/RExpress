'use strict'

const pool = require('./pool');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const parse = require('csv-parse/lib/sync');

const os = require('os');

let app = express();
const text_parser = bodyParser.text();


// number of workers ; first arg or 4 * nb of cores (default)
exports.nb_workers = os.cpus().length * 4

exports.port = 8080 ;


const verbose = true

const log = console.error.bind(console, "[api.js] ")
const trace = (blabla) => {
	if(verbose) log(blabla);
};

app.use(bodyParser.text({
  inflate: true,
  limit: '10000kb',
  type: '*/*'
}));

const parse_body = (req, res, next) => {
	//console.log(req.body);
	let parser = null,
		opts = null
	switch (req.is()) {
		case 'application/json':
			parser = JSON.parse
			break;
		case 'text/csv':
			parser = parse
			opts = {delimiter: ','}
			break;
		case 'multipart/form-data':
			parser = JSON.parse
			let content = {}
			let boundary = req.get('Content-Type').split('boundary=')[1]

			let parts = req.body.split('--' + boundary)
			.map(line => line.trim().replace('--', ''))
			.filter(line => line != '')

			for(let part of parts){

				let arg =  part.split('\n').filter(line => !/^\s*$/.test(line))
				let key = arg.shift().split(';')[1].split('=')[1].trim().replace(/"/g, '');
				let isFile = (arg.filter(line => line.startsWith('Content-Type')).length > 0) ? true : false
				let val = arg.filter(line => !line.startsWith('Content-Type')).join('\n')
				trace('=====KEY=====');
				trace(key);
				trace('=====VALUE=====');
				trace(val);
				if (! isFile){
					val = (val.startsWith("'") || val.startsWith('"')) ? '' + val.substring(1, val.length-1) : Number(val)
				}
				content[key] = val
			}
			trace(content)
			req.body = JSON.stringify(content)
			break;
		default:
			res.send(400);
	}try {
		req.body = (opts) ? parser(req.body, opts) : parser(req.body)
		console.log(req.body);
		console.log("VALIDE");
		next();
	} catch (e) {
		console.log("PAS VALIDE");
		res.send(400);
	}
}


//}
	//req.call = ... fonction ...

// get custom libraries
exports.init = () => {
	fs.readdir('./R/', (err, files) => {

		let sources = "" ;
		for(let file of files){
			if (file.endsWith('.R')) sources += 'source("./R/' + file + '")\n' ;
		}
		// builds the R interpreters pool -- 8 workers ; ../R folder
		pool.init(exports.nb_workers, sources, (err, res) => {
			if(err) trace(err);
			else trace('pool ready');
		});
	})
}


app.get('/', function (request, response) {
	response.send('RExpress')
})
// call a function w/ form-data (safe)
//.post('/R/:function', upload.array(), function (request, response) ion (request, response) {
.post('/R/:function', parse_body, function (request, response) {

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

exports.listen = () => {
	app.listen(exports.port);
}

//this.init() ;
