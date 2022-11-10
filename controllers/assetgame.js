const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.post("/game/validate-machine", (req, res) => {
            res.json({
                "success": true,
                "message": ""
            });
        });

        app.get("/Game/ClientPresence.ashx", (req, res) => {
            const version = req.query.version;
            const placeid = parseInt(req.query.placeid);
            const kocationType = req.query.locationtype;
            res.send();
        });

        app.post("/Game/ClientPresence.ashx", (req, res) => {
            const version = req.query.version;
            const placeid = parseInt(req.query.placeid);
            const kocationType = req.query.locationtype;
            res.send();
        });

        app.post("/game/report-event", (req, res) => {
            const name = req.query.name;
            res.send();
        });

        app.get("/asset", db.requireAuth2, async (req, res) => {
            if (db.getSiteConfig().backend.assetdeliveryEnabled == false) {
                res.status(400).send();
                return;
            }

            let user = req.user;
            if (req.query.t) {
                user = await db.findUserByToken(req.query.t);
            }

            if (!req.query.id) {
                res.status(404).send();
                return;
            }
            const id0 = req.query.id.split("|");
            const id = parseInt(id0[0]);
            const apiKey = req.query.apiKey || (id0.length > 1 ? id0[1] : "");

            /*
            if (id0[0].startsWith("r") && db.getSiteConfig().backend.robloxAssetsUsingR == true) {
                res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + parseInt(id0[0].substring(1)).toString());
                return;
            }
            */

            const item = await db.getCatalogItem(id);
            if (item && !item.deleted) {
                const bp = path.resolve(__dirname + "/../thumbnails/") + path.sep;
                const fp = path.resolve(bp + id.toString() + ".asset");
                if (!fp.startsWith(bp)) {
                    res.status(403).send("Forbidden");
                    return;
                }
                if (fs.existsSync(fp)) {
                    res.download(fp, "Download");
                }else{
                    res.redirect("https://static.roblox.com/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png");
                }
                return;
            }

            const game = await db.getGame(id);
            if (game) {
                const creator = await db.getUser(game.creatorid);
                if (db.getPRIVATE_PLACE_KEYS().includes(apiKey) || (creator && !creator.banned && !game.deleted && ((user && user.userid == game.creatorid && user.inviteKey != "" && !user.banned)) || game.copiable)) {
                    if (db.getPRIVATE_PLACE_KEYS().includes(apiKey)) {
                        db.removePrivatePlaceKey(apiKey);
                    }
                    const bp = path.resolve(__dirname + "/../games/") + path.sep;
                    const fp = path.resolve(bp + game.gameid.toString() + ".asset");
                    if (!fp.startsWith(bp)) {
                        res.status(403).send("Forbidden");
                        return;
                    }
                    if (fs.existsSync(fp)) {
                        res.download(fp, "Download");
                        return;
                    }
                }
            }

            const asset = await db.getAsset(id);
            if (asset && !asset.deleted && (asset.approvedBy != 0 || (user && (asset.creatorid == user.userid || user.isAdmin || user.isMod)))) {
                const bp = path.resolve(__dirname + "/../assets/") + path.sep;
                const fp = path.resolve(bp + id.toString() + ".asset");
                if (!fp.startsWith(bp)) {
                    res.status(403).send("Forbidden");
                    return;
                }
                if (fs.existsSync(fp)) {
                    res.download(fp, "Download");
                }/* else if (db.getSiteConfig().backend.fallbackToRobloxAssets == true) {
                    res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + id);
                    // res.sendStatus(404);
                }
                */ else {
                    res.sendStatus(404).send();
                }
            } else {
                const bp = path.resolve(__dirname + "/../required_assets/") + path.sep;
                const fp = path.resolve(bp + id.toString() + ".asset");
                if (!fp.startsWith(bp)) {
                    res.status(403).send("Forbidden");
                    return;
                }
                if (fs.existsSync(fp)) {
                    res.download(fp, "Download");
                }/* else if (db.getSiteConfig().backend.fallbackToRobloxAssets == true) {
                    res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + id);
                    // res.sendStatus(404);
                }
                */ else {
                    res.sendStatus(404).send();
                }
            }
        });

        app.get("/Game/Join.ashx", async (req, res) => {
            const gameid = parseInt(req.query.gameid);
            const ticket = req.query.ticket;
            const user = await db.findUserByToken(ticket);
            if (!user || user.banned) {
                res.status(401).json({});
                return;
            }
            const game = await db.getGame(gameid);
            if (!game) {
                res.status(400).json({});
                return;
            }

            const joinScript = "\n" + JSON.stringify({
                "ClientPort": 0,
                "MachineAddress": game.ip,
                "ServerPort": game.port,
                "ServerConnections": [{
                    "Address": game.ip,
                    "Port": game.port
                }],
                "DirectServerReturn": true,
                "PingUrl": "https://assetgame.roblox.com/Game/ClientPresence.ashx?version=old&PlaceID=" + game.gameid.toString() + "&GameID=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&UserID=" + user.userid.toString(),
                "PingInterval": 120,
                "UserName": user.username,
                "DisplayName": user.username,
                "SeleniumTestMode": false,
                "UserId": user.userid,
                "RobloxLocale": "en_us",
                "GameLocale": "en_us",
                "SuperSafeChat": false,
                "FlexibleChatEnabled": false,
                "CharacterAppearance": "https://api.roblox.com/v1.1/avatar-fetch/?placeId=" + game.gameid.toString() + "&userId=" + user.userid.toString(),
                "ClientTicket": "2022-05-29T17:22:05.5619581Z;t;6",
                "GameId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "PlaceId": game.gameid,
                "BaseUrl": "http://www.roblox.com/",
                "ChatStyle": "Classic",
                "CreatorId": game.creatorid,
                "CreatorTypeEnum": "User",
                "MembershipType": "None",
                "AccountAge": Math.floor(db.getUnixTimestamp() - user.created / 86400),
                "CookieStoreFirstTimePlayKey": "rbx_evt_ftp",
                "CookieStoreFiveMinutePlayKey": "rbx_evt_fmp",
                "CookieStoreEnabled": true,
                "IsUnknownOrUnder13": db.isUserUnder13(user.userid) ? "true" : "false",
                "GameChatType": "AllUsers",
                "SessionId": `{\"SessionId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"GameId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"PlaceId\":${game.gameid},\"ClientIpAddress\":\"${ip}\",\"PlatformTypeId\":5,\"SessionStarted\":\"${new Date().toISOString()}\",\"BrowserTrackerId\":0,\"PartyId\":null,\"Age\":0,\"Latitude\":0,\"Longitude\":0,\"CountryId\":0,\"PolicyCountryId\":null,\"LanguageId\":41,\"BlockedPlayerIds\":[],\"JoinType\":\"MatchMade\",\"PlaySessionFlags\":0,\"MatchmakingDecisionId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"UserScoreObfuscated\":null,\"UserScorePublicKey\":235,\"GameJoinMetadata\":{\"JoinSource\":0,\"RequestType\":0},\"RandomSeed2\":\"${db.randHash(86, "abcdefghijklmnopqrstuvwxyzABCDEF0123456789-_/")}==\",\"IsUserVoiceChatEnabled\":false,\"SourcePlaceId\":null}`,
                "AnalyticsSessionId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "DataCenterId": 1,
                "UniverseId": game.gameid,
                "FollowUserId": 0,
                "characterAppearanceId": user.userid,
                "CountryCode": "US",
                "RandomSeed1": `${db.randHash(86, "abcdefghijklmnopqrstuvwxyzABCDEF0123456789-_/")}==`,
                "ClientPublicKeyData": "{\"creationTime\":\"19:56 11/23/2021\",\"applications\":{\"RakNetEarlyPublicKey\":{\"versions\":[{\"id\":2,\"value\":\"HwatfCnkndvyKCMPSa0VAl2M2c0GQv9+0z0kENhcj2w=\",\"allowed\":true}],\"send\":2,\"revert\":2}}}"
            })

            const signature = db.sign(joinScript);
            res.send(`--rbxsig2%${signature}%` + joinScript)
        });

        app.post("/game/PlaceLauncher.ashx", db.requireAuth2, async (req, res) => {
            if (!req.user || req.user.banned) {
                res.status(401).json({});
                return;
            }
            const request = req.query.request;
            const browserTrackerId = req.query.browserTrackerId;
            const placeId = parseInt(req.query.placeId);
            const isPlayTogetherGame = req.query.isPlayTogetherGame == "true";
            if (request == "RequestGame") {
                const game = await db.getGame(placeId);
                if (!game) {
                    res.status(404).json({});
                    return;
                }
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted) {
                    res.status(404).json({});
                }

                if (game.port == 0) {
                    res.json({
                        "jobId": null,
                        "status": 0,
                        "joinScriptUrl": null,
                        "authenticationUrl": "",
                        "authenticationTicket": "",
                        "message": null,
                        "joinScript": null,
                    });
                    return;
                }

                const joinScript = {
                    "ClientPort": 0,
                    "MachineAddress": game.ip,
                    "ServerPort": game.port,
                    "ServerConnections": [{
                        "Address": game.ip,
                        "Port": game.port
                    }],
                    "DirectServerReturn": true,
                    "PingUrl": "https://assetgame.roblox.com/Game/ClientPresence.ashx?version=old&PlaceID=" + game.gameid.toString() + "&GameID=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&UserID=" + req.user.userid.toString(),
                    "PingInterval": 120,
                    "UserName": req.user.username,
                    "DisplayName": req.user.username,
                    "SeleniumTestMode": false,
                    "UserId": req.user.userid,
                    "RobloxLocale": "en_us",
                    "GameLocale": "en_us",
                    "SuperSafeChat": false,
                    "FlexibleChatEnabled": false,
                    "CharacterAppearance": "https://api.roblox.com/v1.1/avatar-fetch/?placeId=" + game.gameid.toString() + "&userId=" + req.user.userid.toString(),
                    "ClientTicket": "2022-05-29T17:22:05.5619581Z;t;6",
                    "GameId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    "PlaceId": game.gameid,
                    "BaseUrl": "http://www.roblox.com/",
                    "ChatStyle": "Classic",
                    "CreatorId": game.creatorid,
                    "CreatorTypeEnum": "User",
                    "MembershipType": "None",
                    "AccountAge": Math.floor(db.getUnixTimestamp() - req.user.created / 86400),
                    "CookieStoreFirstTimePlayKey": "rbx_evt_ftp",
                    "CookieStoreFiveMinutePlayKey": "rbx_evt_fmp",
                    "CookieStoreEnabled": true,
                    "IsUnknownOrUnder13": db.isUserUnder13(req.user.userid) ? "true" : "false",
                    "GameChatType": "AllUsers",
                    "SessionId": `{\"SessionId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"GameId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"PlaceId\":${game.gameid},\"ClientIpAddress\":\"${ip}\",\"PlatformTypeId\":5,\"SessionStarted\":\"${new Date().toISOString()}\",\"BrowserTrackerId\":0,\"PartyId\":null,\"Age\":0,\"Latitude\":0,\"Longitude\":0,\"CountryId\":0,\"PolicyCountryId\":null,\"LanguageId\":41,\"BlockedPlayerIds\":[],\"JoinType\":\"MatchMade\",\"PlaySessionFlags\":0,\"MatchmakingDecisionId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"UserScoreObfuscated\":null,\"UserScorePublicKey\":235,\"GameJoinMetadata\":{\"JoinSource\":0,\"RequestType\":0},\"RandomSeed2\":\"${db.randHash(86, "abcdefghijklmnopqrstuvwxyzABCDEF0123456789-_/")}==\",\"IsUserVoiceChatEnabled\":false,\"SourcePlaceId\":null}`,
                    "AnalyticsSessionId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    "DataCenterId": 1,
                    "UniverseId": game.gameid,
                    "FollowUserId": 0,
                    "characterAppearanceId": req.user.userid,
                    "CountryCode": "US",
                    "RandomSeed1": `${db.randHash(86, "abcdefghijklmnopqrstuvwxyzABCDEF0123456789-_/")}==`,
                    "ClientPublicKeyData": "{\"creationTime\":\"19:56 11/23/2021\",\"applications\":{\"RakNetEarlyPublicKey\":{\"versions\":[{\"id\":2,\"value\":\"HwatfCnkndvyKCMPSa0VAl2M2c0GQv9+0z0kENhcj2w=\",\"allowed\":true}],\"send\":2,\"revert\":2}}}"
                }

                res.json({
                    "jobId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    "status": 2,
                    "joinScriptUrl": "https://assetgame.roblox.com/Game/Join.ashx?gameid=" + game.gameid.toString() + "&ticket=" + await db.generateUserToken(req.user.xcsrftoken),
                    "authenticationUrl": "",
                    "authenticationTicket": "",
                    "message": null,
                    "joinScript": joinScript
                });
            } else {
                res.status(400).json({});
            }
        });

        app.post("/api/v1/Close", db.requireAuth2, async (req, res) => {
            const apiKey = req.query.apiKey;
            if (apiKey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user){
                    res.status(404).render("404", await db.getRenderObject(req.user));
                }else{
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const placeId = parseInt(req.query.placeId);
            const gameID = req.query.gameID;

            const game = await db.getGame(placeId);
            if (game == null) {
                res.status(400).send()
                return;
            }
            await db.setGameProperty(placeId, "port", 0);
            res.send();
        });

        app.get("/game/LuaWebService/", async (req, res) => {
            const method = req.query.method;
            if (method == "IsInGroup") {
                const playerid = req.query.playerid;
                const groupid = req.query.groupid;
                if (groupid == "1200769") {
                    const user = await db.getUser(playerid);
                    if (!user || user.banned) {
                        res.status(400).json("<Value Type=\"boolean\">false</Value>");
                        return;
                    }
                    if (user.isAdmin) {
                        res.send("<Value Type=\"boolean\">true</Value>");
                    } else {
                        res.send("<Value Type=\"boolean\">false</Value>");
                    }
                } else {
                    res.send("<Value Type=\"boolean\">false</Value>");
                }
            } else if (method == "GetRankInGroup") {
                const playerid = req.query.playerid;
                const groupid = req.query.groupid;
                if (groupid == "1200769") {
                    const user = await db.getUser(playerid);
                    if (!user || user.banned) {
                        res.status(400).json("<Value Type=\"integer\">0</Value>");
                        return;
                    }
                    if (user.isAdmin) {
                        res.send("<Value Type=\"integer\">255</Value>");
                    } else {
                        res.send("<Value Type=\"integer\">0</Value>");
                    }
                } else {
                    res.send("<Value Type=\"integer\">0</Value>");
                }
            } else if (method == "IsFriendsWith") {
                const playerid = req.query.playerid;
                const userid = req.query.userid;
                res.send("<Value Type=\"boolean\">false</Value>"); // TODO: Setup.
            }
        });

        app.get("/game/players/:userid", (req, res) => {
            const userid = req.params.userid;
            res.json({
                "ChatFilter": "whitelist"
            })
        });
    }
}