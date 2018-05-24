# RExpress

## Synopsis

RExpress is a *convenient*, *minimalist* and **fast** R wrapper written in node.js, on top of Express, allowing you to build a simple **HTTP API** over your R application.

To improve reactivity and replicability, RExpress is :

- stateless
- asynchronous
- made of a *pool of active R interpreters* (to avoid interpreter/libraries/data loading on each call)

## Code Example

```bash
# SERVER

# -- assuming R is installed
#    and your custom preload scripts are in /R folder

# start RExpress with default values (port #8080 and workers adapted to CPU)
npm start 	

# ... or with custom parameters

# TCP port
export PORT=4242	

# number of R threads to spawn
export NB_WORKERS=12
npm run start -- -p ${PORT} -w ${NB_WORKERS}

# CLIENT

```

Below an example in Postman, for a function returning several values.

![russia](./russia.png)


## Installation

```bash
# clone repo
git clone theplatypus/RExpress
cd RExpress

npm install

npm start 	# will start with the default values
npm run start -- -p *number of port you want* -w *number of workers you want*

```

## API Reference

The default API exposes two main endpoints :

### Function call

*POST http://ip:port/R/%function%*

Read the form-data arguments given to call the function (replace this parameter with the actual function name).
Users actions are therefore restricted to this particular function scope.

```javascript
// api.js
// call a function w/ form-data (safe)
app.post('/R/:function', function (request, response) {
	// ...
})
```

### Script execute

*POST http://ip:port/R*

Interpret the whole POST body as a R program to execute.
As you imagine, it is very unsafe to do that, especially if your program have access to some data.
Testing purposes only, do not use in production.

```javascript

// execute the R program given in body
// -- very unsafe but useful in testing purposes
app.post('/R', text_parser, function (request, response) {
	// ...
})
```
## Tweaking

There are two main ways to adapt this package towards your needs.

### Pool size

To avoid interpreter/libraries/data loading on each call, several interpreters are maintained in an active state in a pool.
Each call results in a pipe with one of those interpreters.
As R is single-threaded by default, you could choose to create as many worker as your CPU exposes threads.

To tweak this parameter, change the *nb parameter* at the pool creation in api.js

### Custom Scripts

If the workers should have data or libraries preloaded, you can store them in .R files and save them in the /R folder.
Then you can write the name of the function in main.js

Example : 

*POST http://127.0.0.1:8080/R/russia


```javascript
rexpress.router.post('/R/russia', function (request, response, next) {
	// testing the parameters
	
	request.Rfunction = "cyrillize"  # the name of the .R file in the /R folder
		next()
	// ...
})
```


## Docker

You can use the Dockerfile to build a container with necessaries dependencies.

```bash
# clone repo
git clone theplatypus/RExpress
cd RExpress

# build image
docker build -t seed/RExpress .

# run image in a container
docker run \
	-p 8080:80 \
	--env NB_WORKERS="4" \
	seed/RExpress

# access RExpress at 192.168.99.100:8080 (your docker bridge0 addr)

```
## Issues and roadmap

- deal with long scripts (automatic cut in several jobs)

## Contributors

theplatypus

## License

MIT
