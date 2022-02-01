const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
require('dotenv').config();

app.use(express.json({'limit':'5mb'}));
app.disable('x-powered-by');

const routes = require('./src/routes/routes');
const uisp = require('./src/routes/uisp');

app.use(cookieParser());

app.all('*', function(_, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', '*');
	res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Headers', 'Content-Type, auth, Content-Length, X-Requested-With');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	next();
});

app.use('/api', routes);

module.exports = app;
