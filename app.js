var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var log = require('./logger');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// initialize routes
require('./routes/api').initApp(app);

// Server set
var http = require('http');
//app.set('port', 30000);  // 30000~30002번 포트로 지정(Nginx Load Balancing used Reverse proxy)
//app.set('port', 30001);  // 30000~30002번 포트로 지정(Nginx Load Balancing used Reverse proxy)
app.set('port', 30002);  // 30000~30002번 포트로 지정(Nginx Load Balancing used Reverse proxy)
var server = http.createServer(app);
server.listen(app.get('port'));
log.info('[Antenna] Application Listening on Port 30000 ~ 30002 (80 with Nginx Load Balancing used Reverse proxy)');


module.exports = app;
