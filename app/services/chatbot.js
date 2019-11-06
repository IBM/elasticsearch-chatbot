/**
 * Interacts with Watson Assistant
 */

const elastic = require('./elastic');
const AssistantV2 = require('watson-developer-cloud/assistant/v2');

const assistant = new AssistantV2({
  version: process.env.WATSON_VERSION,
  username: process.env.WATSON_USERNAME,
  password: process.env.WATSON_PASSWORD,
  url: process.env.WATSON_API_URL
});

/**
 * Creates a new session for interacting with Watson Assistant
 */
function startSession() {
    return new Promise(function(resolve,reject) {
        assistant.createSession({
            assistant_id: process.env.WATSON_ASSISTANT_ID,
        }).then(response => {
            resolve({sessionId: response.session_id});
        }).catch(err => {
            reject(err);
        });
    })
}

/**
 * Switch for Travis testing and production with Watson Assistant
 * 
 * @param {String} sessionId
 * @param {String} message 
 * @param {Boolean} travis
 */
function chat(sessionId, message, travis) {
    return new Promise(function(resolve, reject) {
        if (travis) {
            travisTest(message).then(function(response) {
                resolve(response);
            });
        } else {
            sendMessage(sessionId, message).then(function(response) {
                resolve(response);
            }).catch(function(error) {
                reject(error);
            });
        }
    })
}

/**
 * Sends the message to Watson Assistant and creates the appropriate response
 * 
 * @param {String} sessionId
 * @param {String} message 
 */
function sendMessage(sessionId, message) {
    return new Promise(function(resolve, reject) {
        assistant.message({
            assistant_id: process.env.WATSON_ASSISTANT_ID,
            session_id: sessionId,
            input: {
            'message_type': 'text',
            'text': message
            }
        }).then(response => {
            var jsonResponse = {generic: response.output.generic[0].text};
            var intent = "";
            var hasShowEntity = false;
            var chatbotResponse = "";

            if (response.output.intents[0]) {
                intent = response.output.intents[0].intent;
            } else {
                for (var entity = 0; entity < response.output.entities.length; entity++) {
                    if (response.output.entities[entity].entity == "shows") {
                        hasShowEntity = true;
                    }
                }
            }

            if (intent == "show_information" || (!intent && hasShowEntity)) {
                elastic.getShowInformation(response.output.entities).then(function(showInformation) {
                    var summary = "\nSummary of " + showInformation.name + ": " + showInformation.summary.replace(/(<([^>]+)>)/ig,"");

                    if (showInformation.status == "Ended") {
                        chatbotResponse = showInformation.name + " has ended and is not currently airing. However, there may be reruns on or it could be streaming somewhere.";
                    } else {
                        var time = new Date('January 1, 2000 ' + showInformation.schedule.time);
                        var days = "";

                        for (var day = 0; day < showInformation.schedule.days.length; day++) {
                            if (showInformation.schedule.days.length == 1) {
                                days = showInformation.schedule.days[day];
                            } else if (day == showInformation.schedule.days.length - 1) {
                                days = days +  "& " + showInformation.schedule.days[day];
                            } else {
                                days = days + showInformation.schedule.days[day] + ", ";
                            }
                        }

                        chatbotResponse = showInformation.name + " is on at " + time.toLocaleTimeString('en-US') + " on " + days + " on " + showInformation.network.name;
                    }

                    jsonResponse.data = chatbotResponse + summary;
                    resolve(jsonResponse);
                }).catch(function(error) {
                    jsonResponse.data = "Houston, we have a problem. I could not locate any shows that matched what you specified. Can you try rewording?";
                    resolve(jsonResponse);
                });
            } else if (intent == "recommendations") {
                elastic.getRecommendations(response.output.entities).then(function(recommendations) {
                    if (recommendations.length > 0) {
                        for (var recommendation = 0; recommendation < recommendations.length; recommendation++) {
                            chatbotResponse = chatbotResponse + recommendations[recommendation] + "\n";
                        }
                    } else {
                        chatbotResponse = "Houston, we have a problem. I could not locate any shows to recommend to you based on what you specified. Can you try rewording?"
                    }

                    jsonResponse.data = chatbotResponse.trim();
                    resolve(jsonResponse);
                }).catch(function(error) {
                    jsonResponse.data = "Houston, we have a problem. I could not locate any shows to recommend to you based on what you specified. Can you try rewording?";
                    resolve(jsonResponse);
                });
            } else {
                resolve(jsonResponse);
            }
        }).catch(err => {
            console.log(err.message);
            reject(err);
        });
    })  
}

/**
 * Testing Travis CI (Only app and elasticsearch database)
 * 
 * @param {String} message 
 */
function travisTest(message) {
    return new Promise(function(resolve, reject) {
        var entity = [{
            entity: "shows",
            value: message,
            confidence: 0.9
        }];
        var jsonResponse = {generic: "This is output for Travis CI testing"};
        var chatbotResponse = "";

        elastic.getShowInformation(entity).then(function(showInformation) {
            var summary = "\nSummary of " + showInformation.name + ": " + showInformation.summary.replace(/(<([^>]+)>)/ig,"");

            if (showInformation.status == "Ended") {
                chatbotResponse = showInformation.name + " has ended and is not currently airing. However, there may be reruns on or it could be streaming somewhere.";
            } else {
                var time = new Date('January 1, 2000 ' + showInformation.schedule.time);
                var days = "";

                for (var day = 0; day < showInformation.schedule.days.length; day++) {
                    if (showInformation.schedule.days.length == 1) {
                        days = showInformation.schedule.days[day];
                    } else if (day == showInformation.schedule.days.length - 1) {
                        days = days +  "& " + showInformation.schedule.days[day];
                    } else {
                        days = days + showInformation.schedule.days[day] + ", ";
                    }
                }

                chatbotResponse = showInformation.name + " is on at " + time.toLocaleTimeString('en-US') + " on " + days + " on " + showInformation.network.name;
            }

            jsonResponse.data = chatbotResponse + summary;
            resolve(jsonResponse);
        }).catch(function(error) {
            jsonResponse.data = "Houston, we have a problem. I could not locate any shows that matched what you specified. Can you try rewording?";
            resolve(jsonResponse);
        });
    })
}

module.exports.chat = chat;
module.exports.startSession = startSession;
