var rexpress = require('./lib/api');
var program = require('commander');
var pool = require('./lib/pool')

const os = require('os')

program
  .version('0.1.0')
  .option('-p, --port <port>', 'Port to bind')
  .option('-w, --nb-workers <nb-workers>', 'Number of R workers to spawn')
  .parse(process.argv);

// Initialize the number of port and workers
program.port = (program.port == "PORT") ? 8080 : Number(program.port)
program.nbWorkers = (program.nbWorkers == "NBWORKERS") ? Number(os.cpus().length) : Number(program.nbWorkers)
if(Number(program.nbWorkers) > os.cpus().length*10) throw "error : nbWorkers > nbcpus * 10 "

if (program.port) console.log('  - port ' + program.port);
if (program.nbWorkers) console.log('  - workers ' + program.nbWorkers);

rexpress.nb_workers = program.nbWorkers
rexpress.port = program.port

rexpress.prevent_free_routes = true

// Test route
rexpress.router.post('/R/russia', function (request, response, next) {
	if(request.body){
		if(request.body['text'].length < 4 ){
			response.status(400).send('Text length too short')
		}else {
			request.Rfunction = "cyrillize"
			next()
		}
	}else {
		response.status(400).send('No body find')
	}
})

rexpress.init();
rexpress.listen();
