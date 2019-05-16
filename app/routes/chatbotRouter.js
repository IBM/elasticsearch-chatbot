var express = require('express');
var chatbot = require('../services/chatbot');
var router = express.Router();

router.post('/', function(req, res, next) {
    chatbot.chat(req.body.message).then(function(response) {
        res.send(response);
    })
});

module.exports = router;
