/**
 * Router for Chatbot
 */

var express = require('express');
var chatbot = require('../services/chatbot');
var router = express.Router();

router.post('/', function(req, res, next) {
    chatbot.chat(req.body.sessionId, req.body.message, req.body.travis).then(function(response) {
        res.send(response);
    }).catch(function(error) {
        if (error.message == "Invalid Session") {
            res.status(503).send({error: error.message});
        }
    })
});

router.get('/session', function(req, res, next) {
    chatbot.startSession().then(function(response) {
        res.send(response);
    })
});

module.exports = router;
