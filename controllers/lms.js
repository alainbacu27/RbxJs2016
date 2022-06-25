const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/recipe", (req, res) => {
            const iteration = parseInt(req.query.iteration);
            res.send();
        });
    }
}