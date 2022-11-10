const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/Setting/QuietGet/ClientSharedSettings", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/ClientSharedSettings.json").toString()); 
        });
        app.get("/Setting/QuietGet/:channel", (req, res) => {
            const channel = req.params.channel;
            const bp = path.resolve(`${__dirname}/../FFlags/`) + path.sep;
            const fp = `${bp}${channel}.json`;
            if (!fp.startsWith(bp)) {
                res.status(403).send("Forbidden");
                return;
            }
            if (!fs.existsSync(fp)) {
                res.status(404).send("Invalid channel.");
                return;
            }
            res.send(fs.readFileSync(__dirname + "/../FFlags/ClientAppSettings.json").toString()); 
        });

        app.get("/api/Setting/QuietGet/ClientSharedSettings", (req, res) => {
            res.send(fs.readFileSync(__dirname + "/../FFlags/ClientSharedSettings.json").toString()); 
        });
        app.get("/api/Setting/QuietGet/:channel", (req, res) => {
            const channel = req.params.channel;
            const bp = path.resolve(`${__dirname}/../FFlags/`) + path.sep;
            const fp = `${bp}${channel}.json`;
            if (!fp.startsWith(bp)) {
                res.status(403).send("Forbidden");
                return;
            }
            if (!fs.existsSync(fp)) {
                res.status(404).send("Invalid channel.");
                return;
            }
            res.send(fs.readFileSync(__dirname + "/../FFlags/ClientAppSettings.json").toString()); 
        });
    }
}