const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const get_ip = require('ipware')().get_ip;

module.exports = {
    init: (app, db) => {
        app.post("/v1/team-create", db.requireAuth2, async (req, res) => {
            if (!req.user) {
                res.status(401).json({});
                return;
            }
            const gameJoinAttemptId = req.body.gameJoinAttemptId;
            const placeId = req.body.placeId;
            const game = await db.getGame(placeId);
            if (!game) {
                res.status(404).json({});
                return;
            }
            if (game.creatorid != req.user.userid) {
                res.status(403).json({});
                return;
            }
            const server = await db.getCloudEditServer();
            if (!server) {
                res.json({
                    "status": 0,
                    "message": null
                });
            } else {
                const ip = get_ip(req).clientIp;
                res.json({
                    "status": 2,
                    "message": null,
                    "settings": {
                        "ClientPort": 0,
                        "MachineAddress": server.getIp(),
                        "ServerPort": server.getHostPort(),
                        "ServerConnections": [{
                            "Address": server.getIp(),
                            "Port": server.getHostPort()
                        }],
                        "DirectServerReturn": true,
                        "PingUrl": "",
                        "PingInterval": 120,
                        "UserName": req.user.username,
                        "DisplayName": req.user.username,
                        "SeleniumTestMode": false,
                        "UserId": req.user.userid,
                        "RobloxLocale": "en_us",
                        "GameLocale": "en_us",
                        "SuperSafeChat": false,
                        "FlexibleChatEnabled": false,
                        "CharacterAppearance": "https://assetgame.rbx2016.nl/Asset/CharacterFetch.ash?userId=" + req.user.userid.toString(),
                        "ClientTicket": "2022-06-01T20:30:45.3258937Z;t;6",
                        "GameId": "9bfd3e17-ffdb-cbce-5de5-a8f106b3bb72",
                        "PlaceId": game.gameid,
                        "BaseUrl": "http://gamejoin.rbx2016.nl/",
                        "ChatStyle": "Classic",
                        "CreatorId": req.user.userid,
                        "CreatorTypeEnum": "User",
                        "MembershipType": "None",
                        "AccountAge": 0,
                        "CookieStoreFirstTimePlayKey": "rbx_evt_ftp",
                        "CookieStoreFiveMinutePlayKey": "rbx_evt_fmp",
                        "CookieStoreEnabled": true,
                        "IsUnknownOrUnder13": false,
                        "GameChatType": "AllUsers",
                        "SessionId": `{\"SessionId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"GameId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"PlaceId\":${game.gameid},\"ClientIpAddress\":\"${ip}\",\"PlatformTypeId\":5,\"SessionStarted\":\"${new Date().toISOString()}\",\"BrowserTrackerId\":0,\"PartyId\":null,\"Age\":0,\"Latitude\":0,\"Longitude\":0,\"CountryId\":0,\"PolicyCountryId\":null,\"LanguageId\":41,\"BlockedPlayerIds\":[],\"JoinType\":\"MatchMade\",\"PlaySessionFlags\":0,\"MatchmakingDecisionId\":\"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa\",\"UserScoreObfuscated\":null,\"UserScorePublicKey\":235,\"GameJoinMetadata\":{\"JoinSource\":0,\"RequestType\":0},\"RandomSeed2\":\"${db.randHash(86, "abcdefghijklmnopqrstuvwxyzABCDEF0123456789-_/")}==\",\"IsUserVoiceChatEnabled\":false,\"SourcePlaceId\":null}`,
                        "AnalyticsSessionId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        "DataCenterId": 1,
                        "UniverseId": game.gameid,
                        "FollowUserId": 0,
                        "characterAppearanceId": req.user.userid,
                        "CountryCode": "US",
                        "AlternateName": "",
                        "RandomSeed1": `${db.randHash(86, "abcdefghijklmnopqrstuvwxyzABCDEF0123456789-_/")}==`,
                        "ClientPublicKeyData": "{\"creationTime\":\"19:56 11/23/2021\",\"applications\":{\"RakNetEarlyPublicKey\":{\"versions\":[{\"id\":2,\"value\":\"HwatfCnkndvyKCMPSa0VAl2M2c0GQv9+0z0kENhcj2w=\",\"allowed\":true}],\"send\":2,\"revert\":2}}}"
                    }
                });
            }
        });

        app.post("/v1/join-game", db.requireAuth2, async (req, res) => {
            if (!req.user) {
                res.status(401).json({});
                return;
            }
            const placeid = parseInt(req.body.placeId);
            const jobid = req.body.jobId;
            const gameJoinAttemptId = req.body.gameJoinAttemptId;
            const browserTrackerId = req.body.browserTrackerId;
            const game = await db.getGame(placeid);

            const job = await db.getJob(jobid, placeid);

            if (!job || job.getHostPort() == 0) {
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

            const creator = await db.getUser(game.creatorid);
            if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                res.status(404).json({});
                return;
            }

            const ip = get_ip(req).clientIp;

            res.json({
                "jobId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "status": 2,
                "joinScriptUrl": "https://assetgame.rbx2016.nl/Game/Join.ashx?ticketVersion=2&ticket=%7b%22UserId%22%3a" + req.user.userid.toString() + "%2c%22UserName%22%3a%22OOFER2222123%22%2c%22DisplayName%22%3a%22OOFER2222123%22%2c%22CharacterFetchUrl%22%3a%22https%3a%2f%2fapi.rbx2016.nl%2fv1.1%2favatar-fetch%2f%3fplaceId%3d9404035588%26userId%3d" + req.user.userid.toString() + "%22%2c%22GameId%22%3a%22aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa%22%2c%22PlaceId%22%3a9404035588%2c%22UniverseId%22%3a3512202284%2c%22ServerId%22%3a216269%2c%22ServerPort%22%3a59550%2c%22IsTeleport%22%3afalse%2c%22FollowUserId%22%3anull%2c%22TimeStamp%22%3a%225%2f29%2f2022+12%3a22%3a05+PM%22%2c%22CharacterAppearanceId%22%3a" + req.user.userid.toString() + "%2c%22AlternateName%22%3anull%2c%22JoinTypeId%22%3a10%2c%22MatchmakingDecisionId%22%3a%22c8320b50-f61a-4dda-b6e9-741855bd07c3%22%2c%22GameJoinMetadata%22%3a%7b%22JoinSource%22%3a0%2c%22RequestType%22%3a0%2c%22MatchmakingDecisionId%22%3a%22c8320b50-f61a-4dda-b6e9-741855bd07c3%22%2c%22IsPlaceVoiceChatEnabled%22%3atrue%7d%2c%22SourcePlaceId%22%3anull%7d&signature=Lf4aZXhAgZVoXkYQyE1lK7Mx6TEJpbuGva0Y24ouDEv2UaDlT3%2fo6O3JXwwZE50vEuDTJgsby2hvafbmcXnTRiz52gM5YqCXBEax69AHCYWWxwe21KdJMuvDnqnxowGX5RZfRIRF9Yh0MBpOCZJbZu4XT1DYmGspd4ZtRcaoM%2fPdCOQiEXzX98i2XBf3SV1cSNWg0V2Td8QBBAuxUKLvzz9Z2EkRjla0vJVxpYS31yivnn2onig3D2%2bEC7%2fMcLqnksF9TCBzUlWLzEGYs%2bIHiuY%2f7rhBqUKI2GEUenCK4y0hVndkux29bxXoCQMzOh6TgB8jZnqrLI13KtMroE2%2fdg%3d%3d&browserTrackerId=132589911038",
                "authenticationUrl": "",
                "authenticationTicket": "",
                "message": null,
                "joinScript": {
                    "ClientPort": 0,
                    "MachineAddress": job.getIp(),
                    "ServerPort": job.getHostPort(),
                    "ServerConnections": [{
                        "Address": job.getIp(),
                        "Port": job.getHostPort()
                    }],
                    "DirectServerReturn": true,
                    "PingUrl": "https://assetgame.rbx2016.nl/Game/ClientPresence.ashx?version=old&PlaceID=" + game.gameid.toString() + "&GameID=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&UserID=" + req.user.userid.toString(),
                    "PingInterval": 120,
                    "UserName": req.user.username,
                    "DisplayName": req.user.username,
                    "SeleniumTestMode": false,
                    "UserId": req.user.userid,
                    "RobloxLocale": "en_us",
                    "GameLocale": "en_us",
                    "SuperSafeChat": false,
                    "FlexibleChatEnabled": false,
                    "CharacterAppearance": "https://assetgame.rbx2016.nl/Asset/CharacterFetch.ash?userId=" + req.user.userid.toString(),
                    "ClientTicket": "2022-05-29T17:22:05.5619581Z;t;6",
                    "GameId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                    "PlaceId": game.gameid,
                    "BaseUrl": "http://gamejoin.rbx2016.nl/",
                    "ChatStyle": "Classic",
                    "CreatorId": game.creatorid,
                    "CreatorTypeEnum": "User",
                    "MembershipType": "None",
                    "AccountAge": Math.floor(db.getUnixTimestamp() - req.user.created / 86400),
                    "CookieStoreFirstTimePlayKey": "rbx_evt_ftp",
                    "CookieStoreFiveMinutePlayKey": "rbx_evt_fmp",
                    "CookieStoreEnabled": true,
                    "IsUnknownOrUnder13": await db.isUserUnder13(req.user.userid) ? "true" : "false",
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
            });
        });
    }
}