const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const get_ip = require('ipware')().get_ip;

module.exports = {
    init: (app, db) => {
        app.post("/studio/pbe", (req, res) => {
            res.status(202).send();
        });

        app.post("/timespent/pbe", (Req, res) => {
            res.status(202).send();
        })

        app.get("/www/e.png", db.requireAuth2, async (req, res) => {
            const ip = get_ip(req).clientIp;
            const evt = req.query.evt;
            if (evt == "pageHeartbeat") {
                if (req.user && req.user.inviteKey != "" && !req.user.banned && db.getSiteConfig().backend.presenceEnabled == true) {
                    await db.setUserProperty(req.user.userid, "lastOnline", db.getUnixTimestamp());
                }
            } else if ((evt == "clientStartAttempt" || evt == "developIntent") && req.user && req.user.inviteKey != "" && !req.user.banned) {
                const ctx = req.query.ctx;
                if (ctx == "PlayButton" && db.getSiteConfig().backend.hostingEnabled == true) {
                    if (typeof db.pendingPlayerAuthentications[ip] == "object") {
                        if (!db.pendingPlayerAuthentications[ip].includes(ip)) {
                            db.pendingPlayerAuthentications[ip].push([db.getUnixTimestamp(), req.user.cookie]);
                        }
                    } else {
                        db.pendingPlayerAuthentications[ip] = [
                            [db.getUnixTimestamp(), req.user.cookie]
                        ];
                    }
                } else if (ctx == "Edit") {
                    if (typeof db.pendingStudioAuthentications[ip] == "object") {
                        if (!db.pendingStudioAuthentications[ip].includes(ip)) {
                            db.pendingStudioAuthentications[ip].push([db.getUnixTimestamp(), req.user.cookie]);
                        }
                    } else {
                        db.pendingStudioAuthentications[ip] = [
                            [db.getUnixTimestamp(), req.user.cookie]
                        ];
                    }
                }
            }
            res.send();
        });

        app.get("/studio/e.png", (req, res) => {
            res.send();
        });

        app.post("/Error/Dmp.ashx", (req, res) => {
            res.send(); // Ignore logs for now..
        });

        app.post("/game/report-stats", (req, res) => {
            res.send(); // Nope.
        })
    }
}