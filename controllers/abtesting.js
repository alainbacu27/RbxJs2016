const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.post("/v1/enrollments", (req, res) => {
            res.json({
                "data": [{
                    "SubjectType": "BrowserTracker",
                    "SubjectTargetId": 0,
                    "ExperimentName": "Web.Login.AccountRecoveryPrompt",
                    "Status": "Inactive",
                    "Variation": 0
                }]
            });
        });
    }
}