const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.post('/v1/presence/register-app-presence', (req, res) => {
            res.json({});
        });

        app.post('/v1/presence/users', db.requireAuth2, async (req, res) => {
            if (!db.getSiteConfig().backend.presenceEnabled) {
                res.status(403).json({
                    error: "Presence is disabled"
                });
                return;
            }
            let data = [];
            const userIds = req.body.userIds;
            for (let i = 0; i < userIds.length; i++) {
                const userId = userIds[i];
                const user = await db.getUser(userId);
                if (!user) continue;
                const presenceType = (user.lastOnline || 0) > (db.getUnixTimestamp() - 60) ? (user.playing != 0 && user.playing != null) ? 2 : 1 : 0;
                const gameid = req.user != null && db.areFriends(req.user.userid, user.userid) ? (user.playing != 0 && user.playing != null) ? user.playing : null : null
                data.push({
                    "userPresenceType": presenceType, // 0 = Offline, 1 = Website, 2 = Playing
                    "lastLocation": presenceType == 2 ? "In-Game" : presenceType == 1 ? "Website" : "Offline",
                    "placeId": gameid,
                    "rootPlaceId": gameid,
                    "gameId": gameid,
                    "universeId": gameid,
                    "userId": user.userid,
                    "lastOnline": db.unixToDate((user.lastOnline || 0)).toISOString(),
                })
            }
            res.json({
                "userPresences": data
            });
        });
    }
}