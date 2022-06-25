const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/thumbnails/metadata', (req, res) => {
            res.json({
                "logRatio": 0.05
            });
        });
        app.post("/v1/performance/send-measurement", (req, res) => {
            res.json({});
        });

        app.post("/v1/performance/measurements", (req, res) => {
            res.send();
        });
    }
}