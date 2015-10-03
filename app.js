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
app.set('port', 30004); //30004�� ��Ʈ�� ����
var server = http.createServer(app);
server.listen(app.get('port'));
log.info('[MusicFriends] Application Listening on Port 30004 (80 with Nginx Proxy)');


module.exports = app;
