/**
 * Router for Chatbot
 */

var express = require('express');
var chatbot = require('../services/chatbot');
var router = express.Router();

router.post('/', function(req, res, next) {
    chatbot.chat(req.body.message, req.body.travis).then(function(response) {
        res.send(response);
    })
});

module.exports = router;
