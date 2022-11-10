const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/install/setup.ashx", (req, res) => {
            if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                res.status(403).send("Forbidden");
                return;
            }
            res.redirect("/RobloxPlayerLauncher.exe");
        });

        app.get("/download/thankyou", db.requireAuth2, async (req, res) => {
            if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                res.status(403).send("Forbidden");
                return;
            }
            if (req.user) {
                res.render("thankyou", await db.getRenderObject(req.user));
            } else {
                res.render("thankyou", await db.getBlankRenderObject());
            }
        });

        app.get("/cdn.txt", (req, res) => {
            res.send("setup.rbx2016.tk")
        });

        app.get("/version", (req, res) => {
            if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                res.status(403).send("Forbidden");
                return;
            }
            res.send(`version-${db.getSiteConfig().client.version}`);
        });
        app.get("/versionQTStudio", (req, res) => {
            if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                res.status(403).send("Forbidden");
                return;
            }
            res.send(`version-${db.getSiteConfig().client.version}s`);
        });
    }
}