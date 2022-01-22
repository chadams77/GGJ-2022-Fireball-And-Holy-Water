// Requires NPM packages: connect serve-static

const connect = require('connect');
const serveStatic = require('serve-static');

connect().use(serveStatic(__dirname)).listen(8080);
console.log('Running on localhost:8080');
