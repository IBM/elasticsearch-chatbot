/**
 * Router for populating Elasticsearch Database with data
 */

var express = require('express');
var elastic = require('../services/elastic');
var router = express.Router();

router.put('/', function(req, res, next) {
    if (req.body.total) {
        elastic.populateDatabase(req.body.total).then(function(totalShowsAdded) {
            res.send(totalShowsAdded + " shows added/updated to database");
        });
    } else {
        elastic.populateDatabase(null).then(function(totalShowsAdded) {
            res.send(totalShowsAdded + " shows added/updated to database");;
        });
    }
});

module.exports = router;
