var rexpress = require('./lib/api');
var program = require('commander');

const os = require('os')

program
  .version('0.1.0')
  .option('-p, --port <port>', 'Port to bind')
  .option('-w, --nb-workers <nb-workers>', 'Number of R workers to spawn')
  .parse(process.argv);

program.port = (program.port == "PORT") ? 8080 : Number(program.port)
program.nbWorkers = (program.nbWorkers == "NBWORKERS") ? Number(os.cpus().length) : Number(program.nbWorkers)
if(Number(program.nbWorkers) > os.cpus().length*10) throw "error : nbWorkers > nbcpus * 10 "

if (program.port) console.log('  - port ' + program.port);
if (program.nbWorkers) console.log('  - workers ' + program.nbWorkers);

//console.log(rexpress);

rexpress.nb_workers = program.nbWorkers
rexpress.port = program.port

rexpress.init();
rexpress.listen();
