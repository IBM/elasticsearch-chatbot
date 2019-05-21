/**
 * Main app.js file for the chatbot
 */

var express = require("express");
var cors = require('cors');
var bodyParser = require('body-parser');
var createError = require('http-errors');

var chatbotRouter = require('./routes/chatbotRouter');
var dataRouter = require('./routes/dataRouter');

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

var app = express();

app.use(cors());

var api = "/api/v1";

app.use(bodyParser.json({limit: '25mb'}));
app.use(bodyParser.urlencoded({limit: '25mb', extended: true}));

app.use(api + '/chat', chatbotRouter);
app.use(api + '/data', dataRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
  });
  
// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    res.status(err.status || 500);
  });
  
module.exports = app;
