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

exports.allow_free_routes = false
exports.allow_free_scripts = true

exports.pool = pool

const verbose = false

const log = console.error.bind(console, "[api.js] ")
const trace = (blabla) => {
	if(verbose) log(blabla);
};

app.use(bodyParser.text({
  inflate: true,
  limit: '10000kb',
  type: '*/*'
}));

// handle several kind of datas encoded in the body request
const parse_body = (req, res, next) => {
	let parser = null,
		opts = null,
		errors = []
	switch (req.is()) {
		// if the content type is "application/json"
		case 'application/json':
			parser = JSON.parse
			break;
		// if the content type is "text/csv"
		case 'text/csv':
			parser = parse
			opts = {delimiter: ','}
			break;
		// if the content type is "multipart/form-data"
		case 'multipart/form-data':
			parser = JSON.parse
			let content = {}
			let boundary = req.get('Content-Type').split('boundary=')[1]

			if(!boundary){
				errors.push('Boundary not found')
				break;
			}

			let parts = req.body.split('--' + boundary)
			.map(line => line.trim().replace('--', ''))
			.filter(line => line != '')

			for(let part of parts){

				let arg =  part.split('\n').filter(line => !/^\s*$/.test(line))

				if(!arg[0].startsWith('Content-Disposition')){
					errors.push('Content-Disposition not found')
				}else {
					let key = arg.shift().split(';')[1].split('=')[1].trim().replace(/"/g, '');
					let isFile = (arg.filter(line => line.startsWith('Content-Type')).length > 0) ? true : false
					let val = arg.filter(line => !line.startsWith('Content-Type')).join('\n')
					trace('======KEY======');
					trace(key);
					trace('=====VALUE=====');
					trace(val);
					if (! isFile){
						val = (val.startsWith("'") || val.startsWith('"')) ? val : (!isNaN(val)) ? Number(val) : String('"' + val + '"')
					}
					content[key] = val
				}
			}
			trace(content)
			req.body = JSON.stringify(content)
			break;
		default:
			parser = (text) => text
			break;
	}try {
		trace("ERRORS");
		trace(errors);
		if(errors.length != 0) throw JSON.stringify(errors)
		if(!parser) throw "Unknown Content-type"
		req.body = (opts) ? parser(req.body, opts) : parser(req.body)
		trace(req.body);
		console.log("parse_body valid");
		next();
	} catch (e) {
		console.log("parse_body not valid");
		console.log(e);
		res.status(400).send(e);
	}
}

app.post('*', parse_body)

app.get('/', function (request, response) {
	response.send('RExpress')
})

if (exports.allow_free_scripts) {
	// execute the R program given in body
	// -- very unsafe but useful in testing purposes
	app.post('/R', text_parser, function (request, response) {

		console.log(request.body);
		pool.submit_job(request.body, (err, res) => {
			if (err) response.send(err)
			else response.send(res);
		})
	})
}

// handle R function : free route or custom route
const handleRFunction = (request, response) => {
	if (!request.Rfunction && !exports.allow_free_routes) {
		response.status(400).send('Unkown Rfunction and not allowed to use internal calls')
	}else {
		let call = (request.Rfunction) ? request.Rfunction : request.params.function
		call += '('
		let args = []
		if(request.body){
			for(let key in request.body){
				let value = request.body[key]
				args.push(key + "=" + value)
			}
		}
		call += args.join(',') + ")" ;

		pool.submit_job(call, (err, res) => {
			if (err) response.send(err)
			else response.send(res);
		})
	}
}

const customLibraries = () => {
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

exports.init = () => {
	customLibraries();
	app.post('/R/:function', handleRFunction)

}

exports.listen = () => {
	app.listen(exports.port);
}

exports.router = app;
