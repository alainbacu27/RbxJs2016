const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/user/friend-requests/count', db.requireAuth, async (req, res) => {
            const friends = await db.getFriendRequests(req.user.userid)
            res.json({
                "count": friends.length
            });
        });

        app.get("/v1/users/:userid/followings", async (req, res) => {
            const userid = parseInt(req.params.userid);
            const sortOrder = req.query.sortOrder || "Desc";
            const limit = parseInt(req.query.limit);
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            })
        });

        app.get("/v1/users/:userid/followers", async (req, res) => {
            const userid = parseInt(req.params.userid);
            const sortOrder = req.query.sortOrder || "Desc";
            const limit = parseInt(req.query.limit);
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            })
        });

        app.post("/v1/users/:userid/decline-friend-request", db.requireAuthCSRF, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const userid = parseInt(req.params.userid);
            const denied = await db.denyFriend(userid, req.user.userid);
            if (denied) {
                res.json({
                    "success": true,
                    "message": null
                });
            } else {
                res.status(500).json({
                    "success": false,
                    "message": "Something went wrong"
                });
            }
        });

        app.post("/v1/user/friend-requests/decline-all", db.requireAuthCSRF, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const denied = await db.denyAllFriends(req.user.userid);
            if (denied) {
                res.json({
                    "success": true,
                    "message": null
                });
            } else {
                res.status(500).json({
                    "success": false,
                    "message": "Something went wrong"
                });
            }
        });

        app.post("/v1/users/:userid/accept-friend-request", db.requireAuthCSRF, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const userid = parseInt(req.params.userid);
            const denied = await db.addFriends(req.user.userid, userid);
            if (denied) {
                res.json({
                    "success": true,
                    "message": null
                });
            } else {
                res.status(500).json({
                    "success": false,
                    "message": "Something went wrong"
                });
            }
        });

        app.post("/v1/users/:userid/unfriend", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const userid = parseInt(req.body.targetUserID);
            if (req.user.userid == userid) {
                res.status(400).json({
                    "success": false,
                    "error": "You can't unfriend yourself"
                });
                return;
            }
            const unfriended = await db.unfriend(req.user.userid, userid);
            if (unfriended) {
                res.json({
                    "success": true
                });
            } else {
                res.status(500).json({
                    "success": false,
                    "error": "Something went wrong"
                });
            }
        });

        app.get("/v1/my/friends/requests", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const presenceEnabled = db.getSiteConfig().backend.presenceEnabled;
            const sortOrder = req.query.sortOrder || "Desc";
            const limit = parseInt(req.query.limit);
            let data = [];
            const friends = await db.getFriendRequests(req.user.userid);
            for (let i = 0; i < friends.length; i++) {
                const friend = await db.getUser(friends[i].userid);
                const presenceType = (friend.lastOnline || 0) > (db.getUnixTimestamp() - 60) ? (friend.lastOnline || 0) > (db.getUnixTimestamp() - 60) && friend.playing != 0 ? 2 : 1 : 0;
                data.push({
                    "isOnline": (friend.lastOnline || 0) > (db.getUnixTimestamp() - 60),
                    "presenceType": presenceEnabled ? presenceType : 0,
                    "isDeleted": friend.banned,
                    "friendFrequentScore": 0,
                    "friendFrequentRank": 1,
                    "description": friend.description,
                    "created": await db.unixToDate(friend.created).toISOString(),
                    "isBanned": friend.banned,
                    "externalAppDisplayName": null,
                    "id": friend.userid,
                    "name": friend.username,
                    "displayName": friend.username
                });
            }
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": data
            });
        });

        app.get('/v1/users/:userid/friends', db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canViewFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const userid = parseInt(req.params.userid);
            const presenceEnabled = db.getSiteConfig().backend.presenceEnabled == true;
            const userSort = req.query.userSort; // StatusFrequents
            if (req.user.userid != userid) {
                res.json({
                    "data": []
                });
                return;
            }
            let data = [];
            const friends = await db.getFriends(userid);
            for (let i = 0; i < friends.length; i++) {
                const friend = await db.getUser(friends[i].friendid);
                const presenceType = (friend.lastOnline || 0) > (db.getUnixTimestamp() - 60) ? (friend.lastOnline || 0) > (db.getUnixTimestamp() - 60) && friend.playing != 0 ? 2 : 1 : 0;
                data.push({
                    "isOnline": (friend.lastOnline || 0) > (db.getUnixTimestamp() - 60),
                    "presenceType": presenceEnabled ? presenceType : 0,
                    "isDeleted": friend.banned,
                    "friendFrequentScore": 0,
                    "friendFrequentRank": 1,
                    "description": friend.description,
                    "created": await db.unixToDate(friend.created).toISOString(),
                    "isBanned": friend.banned,
                    "externalAppDisplayName": null,
                    "id": friend.userid,
                    "name": friend.username,
                    "displayName": friend.username
                });
            }
            res.json({
                "data": data
            });
        });

        app.post("/v1/users/:userid/request-friendship", db.requireAuthCSRF, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const userid = parseInt(req.params.userid);
            if (req.user.userid == userid) {
                res.status(400).json({
                    "success": false,
                    "error": "You can't friend yourself"
                });
                return;
            }
            const added = await db.addFriends(req.user.userid, userid);
            if (added) {
                res.json({
                    "success": true
                });
            } else {
                res.status(500).json({
                    "success": false,
                    "error": "Something went wrong"
                });
            }
        });

        app.get("/user/get-friendship-count", db.requireAuth2, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            let user = req.user;
            if (!user) {
                let sessionid = req.get("roblox-session-id");
                if (sessionid) {
                    sessionid = sessionid.split("|")
                    if (sessionid.length >= 3) {
                        const cookie = sessionid[sessionid.length - 3].replaceAll("Â§", "|");
                        user = await db.findUserByCookie(cookie);
                    }
                }
            }
            if (!user || !req.query.userId || !parseInt(req.query.userId)){
                return res.status(401).send();
            }
            res.send(db.getFriends(user && user.userid || parseInt(req.query.userId)).length.toString());
        });
        
        app.post("/user/request-friendship", db.requireAuth2, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            let user = req.user;
            if (!user) {
                let sessionid = req.get("roblox-session-id");
                if (sessionid) {
                    sessionid = sessionid.split("|")
                    if (sessionid.length >= 3) {
                        const cookie = sessionid[sessionid.length - 3].replaceAll("Â§", "|");
                        user = await db.findUserByCookie(cookie);
                    }
                }
            }
            const userid = parseInt(req.params.recipientUserId);
            if (req.user.userid == userid) {
                res.status(400).json({
                    "success": false,
                    "error": "You can't friend yourself"
                });
                return;
            }
            const added = await db.addFriends(user.userid, userid);
            if (added) {
                res.json({
                    "success": true
                });
            } else {
                res.status(500).json({
                    "success": false,
                    "error": "Something went wrong"
                });
            }
        });

        app.post("/v1/user/following-exists", db.requireAuth, async (req, res) => {
            const targetUserIds = req.body.targetUserIds;
            let followings = []
            for (let i = 0; i < targetUserIds.length; i++) {
                const user = await db.getUser(targetUserIds[i]);
                if (!user || user.banned ||user.inviteKey == "") {
                    continue;
                }
                followings.push({
                    "userId": user.userid,
                    "isFollowing": false,
                    "isFollowed": false
                });
            }
            res.json({
                "followings": followings
            });
        });

        app.get("/v1/users/:userid/friends/statuses", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const userid = parseInt(req.params.userid);
            const userIds = req.query.userIds.split(",");
            let data = [];
            for (let i = 0; i < userIds.length; i++) {
                const user = await db.getUser(parseInt(userIds[i]));
                if (!user || user.banned || user.inviteKey == "") {
                    continue;
                }
                data.push({
                    "id": user.userid,
                    "status": await db.areFriends(req.user.userid, user.userid) ? "Friends" : "NotFriends"
                })
            }
            res.json({
                "data": data
            });
        });
    }
}