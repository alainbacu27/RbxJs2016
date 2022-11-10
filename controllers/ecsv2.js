const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.post("/studio/pbe", (req, res) => {
            res.status(202).send();
        });

        app.post("/timespent/pbe", (Req, res) => {
            res.status(202).send();
        })

        app.get("/www/e.png", db.requireAuth2, async (req, res) => {
            const evt = req.query.evt;
            if (evt == "pageHeartbeat") {
                if (req.user && !req.user.banned && db.getSiteConfig().backend.presenceEnabled == true) {
                    await db.setUserProperty(req.user.userid, "lastOnline", db.getUnixTimestamp());
                }
            }
            res.send();
        })
    }
}