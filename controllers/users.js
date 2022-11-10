const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        
        app.get("/v1/users/authenticated", db.requireAuth2, async (req, res) => {
            if (!req.user) {
                return res.json({
                    "errors": [{
                        "code": 0,
                        "message": "Authorization has been denied for this request."
                    }]
                });
            }
            res.json({
                "id": req.user.userid,
                "name": req.user.username,
                "displayName": req.user.username
            });
        });

        app.get("/v1/users/:userid", db.requireAuth2, async (req, res) => {
            if (db.getSiteConfig().shared.users.canViewUsers == false) {
                res.status(403).send("Forbidden");
                return;
            }
            const user = await db.getUser(parseInt(req.params.userid));
            if (!user || user.banned) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            res.json({
                "description": user.description,
                "created": db.unixToDate(user.created).toISOString(),
                "isBanned": user.banned,
                "externalAppDisplayName": null,
                "id": user.userid,
                "name": user.username,
                "displayName": user.username
            });
        });

        app.post("/v1/usernames/users", async (req, res) => {
            if (db.getSiteConfig().shared.users.canViewUsers == false) {
                res.status(403).send("Forbidden");
                return;
            }
            const usernames = req.body.usernames;
            const excludeBannedUsers = req.body.excludeBannedUsers;
            let data = []
            for (let i = 0; i < usernames.length; i++) {
                const users = await db.findUsers(usernames[i]);
                for (let j = 0; j < users.length; j++) {
                    if (excludeBannedUsers && users[j].banned) {
                        continue;
                    }
                    data.push({
                        "requestedUsername": usernames[i],
                        "id": users[j].userid,
                        "name": users[j].username,
                        "displayName": users[j].username
                    });
                }
            }
            res.json({
                "data": data
            })
        });

        /*
        app.post("/v1/usernames/users", (req, res) => {
            
        });
        */
    }
}