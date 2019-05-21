/**
 * Interacts with the Elasticsearch Database
 */

var request = require('request');
var async = require('async');

const ELASTIC_BASE_URL = process.env.ELASTIC_BASE_URL;
const TV_SHOW_API = "http://api.tvmaze.com/shows/";

const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/**
 * Queries the Elasticsearch Database for information about a show
 * 
 * @param {Object} entities 
 */
function getShowInformation(entities) {
    return new Promise(function(resolve, reject) {
        var query = "";

        for (var entity = 0; entity < entities.length; entity++) {
            if (entities[entity].entity == "shows") {
                if (entity > 0) {
                    query = query + " AND ";
                }

                var words = entities[entity].value.split(" ");
                for (var word = 0; word < words.length; word++) {
                    query = query + words[word] + "~1^" + entities[entity].confidence*10;
                }
            }
        }

        var body = {
            "query": {
                "query_string": {
                    "query": query,
                    "fields": ["name"]
                }
            }
        }

		request({url: ELASTIC_BASE_URL + "/_search", body: body, json: true}, function (error, response, body) {
	 		if (!error && response.statusCode == 200) {
                 if (body.hits.hits[0]) {
                    return resolve(body.hits.hits[0]._source);
                 } else {
                     return reject(null);
                 }
	  		} else {
	  		    return reject(error);
	  		}
	  	});
	})
}

/**
 * Queries the Elasticsearch Database for show recommendations
 * 
 * @param {Object} entities 
 */
function getRecommendations(entities) {
    return new Promise(function(resolve, reject) {
        var body;
        var highestRated = false;
        var status = "*";
        var genres = "";
        var networks = "";
        var days = "";
        var times = "";
        var today = new Date();

        for (var entity = 0; entity < entities.length; entity++) {
            if (entities[entity].entity == "genre") {
                if (genres) {
                    genres = genres + " OR ";
                }
                genres = genres + entities[entity].value;
            } else if (entities[entity].entity == "network") {
                if (networks) {
                    networks = networks + " OR ";
                }
                networks = networks + entities[entity].value;
            } else if (entities[entity].entity == "date") {
                status = "Running";

                if (days) {
                    days = days + " OR ";
                }

                if (entities[entity].value == "today") {
                    days = days + daysOfWeek[today.getDay()];
                } else if (entities[entity].value == "yesterday") {
                    days = days + daysOfWeek[(today.getDay()-1)%7];
                } else if (entities[entity].value == "tomorrow") {
                    days = days + daysOfWeek[(today.getDay()+1)%7];
                } else {
                    days = days + entities[entity].value;
                }
            } else if (entities[entity].entity == "sys-time") {
                status = "Running";

                if (times) {
                    times = times + " OR ";
                }
                times = times + entities[entity].value.split(":")[0];
            } else if (entities[entity].entity == "time") {
                status = "Running";

                if (times) {
                    times = times + " OR ";
                }

                if (entities[entity].value == "morning") {
                    for (var time = 6; time < 12; time++) {
                        if (time < 10) {
                            times = times + "0" + time + " OR ";
                        } else if (time == 11) {
                            times = times + time;
                        } else {
                            times = times + time + " OR ";
                        }
                    }
                } else if (entities[entity].value == "afternoon") {
                    for (var time = 12; time < 18; time++) {
                        if (time == 17) {
                            times = times + time;
                        } else {
                            times = times + time + " OR ";
                        }
                    }
                } else if (entities[entity].value == "night" || entities[entity].value == "tonight") {
                    if (entities[entity].value == "tonight") {
                        if (days) {
                            days = days + " OR ";
                        }
                        days = days + daysOfWeek[today.getDay()];
                    }

                    for (var time = 18; time < 24; time++) {
                        if (time == 23) {
                            times = times + time;
                        } else {
                            times = times + time + " OR ";
                        }
                    }

                    for (var time = 0; time < 6; time++) {
                        if (time == 6) {
                            times = times + "0" + time;
                        } else {
                            times = times + "0" + time + " OR ";
                        }
                    }
                }
            } else if (entities[entity].entity == "current") {
                status = "Running";
            } else if (entities[entity].entity == "highest_rated") {
                highestRated = true;
            }
        }

        if (!genres) {
            genres = "*";
        }

        if (!networks) {
            networks = "*";
        }

        if (!days) {
            days = "*";
        }

        if (!times) {
            times = "*";
        }

        body = {
            "query": {
                "query_string": {
                    "query": "(network.name:(" + networks + ") OR webChannel.name:(" + networks + ")) AND schedule.days:(" + days + ") AND status:(" + status + ") AND schedule.time:(" + times + ") AND (genres:(" + genres + ") OR type:("+ genres + "))"
                }
            }
        }

        if (highestRated) {
            body.sort = {"rating.average": "desc"};
        } 

		request({url: ELASTIC_BASE_URL + "/_search", body: body, json: true}, function (error, response, body) {
	 		if (!error && response.statusCode == 200) {
                var recommendations = [];
                var totalRecommendations = 10;

                if (totalRecommendations > body.hits.hits.length) {
                    totalRecommendations = body.hits.hits.length;
                }
                
                for (var show = 0; show < totalRecommendations; show++) {
                    recommendations.push(body.hits.hits[show]._source.name + " - " + body.hits.hits[show]._source.status);
                }

				return resolve(recommendations);
	  		} else {
	  		    return reject(error);
	  		}
	  	});
	})
}

/**
 * Populates the Elasticsearch database
 * 
 * @param {Number} showCount 
 */
function populateDatabase(showCount) {
    return new Promise(function(resolve, reject) {
        var showAdded;
        var totalShowsAdded = 0;
        var totalShowsNotAdded = 0;

        if (showCount) {
            for (var show = 1; show <= showCount; show++) {
                request(TV_SHOW_API+show, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        body = JSON.parse(body);

                        var showToAdd = false;

                        if (body.network) {
                            if (body.network.country.name == "United States") {
                                showToAdd = true;
                            }
                        } else {
                            if (body.language == "English" && body.webChannel) {
                                showToAdd = true;
                            }
                        }

                        if (showToAdd) {
                            addShow(body, body.id).then(function(showAdded) {
                                if (showAdded) {
                                    totalShowsAdded = totalShowsAdded + 1;
                                } else {
                                    totalShowsNotAdded = totalShowsNotAdded + 1;
                                }

                                if (totalShowsAdded + totalShowsNotAdded == showCount) {
                                    resolve(totalShowsAdded);
                                }
                            });
                        }
                    }
                });
            }
        } else {
            var errorStreak = 0;
            var show = 1;
            var complete = false;

            async.whilst(
                function () { return errorStreak < 10; },
                function (next) {
                    request(TV_SHOW_API+show, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            errorStreak = 0;
                            body = JSON.parse(body);

                            var showToAdd = false;

                            if (body.network) {
                                if (body.network.country.name == "United States") {
                                    showToAdd = true;
                                }
                            } else {
                                if (body.language == "English" && body.webChannel) {
                                    showToAdd = true;
                                }
                            }

                            if (showToAdd) {
                                addShow(body, body.id).then(function(showAdded) {
                                    if (showAdded) {
                                        totalShowsAdded = totalShowsAdded + 1;
                                    } else {
                                        totalShowsNotAdded = totalShowsNotAdded + 1;
                                    }
                                });
                            }
                        } else {
                            errorStreak = errorStreak + 1;
                        }
                        show = show + 1;
                        next();
                    });
                },
                function (err, n) {
                    return resolve(totalShowsAdded);
                }
            );
        }
    })
}

/**
 * Adds a show to the Elasticsearch database
 * 
 * @param {Object} show 
 * @param {Number} showIndex 
 */
function addShow(show, showIndex) {
    return new Promise(function(resolve, reject) {
        request.post({url: ELASTIC_BASE_URL + "/shows/show/"+showIndex, body: show, json: true}, function (error, response, body) {
            if (!error && (response.statusCode == 200 || response.statusCode == 201)) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    })
}

module.exports.getShowInformation = getShowInformation;
module.exports.getRecommendations = getRecommendations;
module.exports.populateDatabase = populateDatabase;
