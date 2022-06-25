const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const get_ip = require('ipware')().get_ip;

module.exports = {
    init: (app, db) => {
        const badUsernames = db.getSiteConfig().backend.badUsernames;
        app.post('/v1/usernames/validate', async (req, res) => {
            const data = req.body;
            const username = data.username;
            const context = data.context;
            try {
                const birthday = new Date(data.birthday);
            } catch {
                res.json({
                    "code": 3,
                    "message": "Invalid birthday"
                });
                return;
            }
            const birthday = new Date(Date.parse(data.birthday));
            const now = new Date();
            const age = now - birthday;
            /*
            if (age < 13 * 365 * 24 * 60 * 60 * 1000) {
                res.json({
                    "code": 3,
                    "message": "Invalid birthday"
                });
                return;
            }
            */
            if (username.length < 3) {
                res.json({
                    "code": 2,
                    "message": "Username must be at least 3 characters long"
                });
                return;
            }
            const isBadUsername = badUsernames.includes(username.toLowerCase());
            if (isBadUsername) {
                res.json({
                    "code": 2,
                    "message": "Bad username"
                });
                return;
            }
            if (await db.userExists(username)) {
                res.json({
                    "code": 1,
                    "message": "Username already in use"
                });
                return;
            }
            res.json({
                "code": 0,
                "message": "Username is valid"
            });
        });

        app.get('/v2/metadata', (req, res) => {
            res.json({
                "isUpdateUsernameEnabled": true,
                "ftuxAvatarAssetMap": "{\"v1\":{\"bodies\":[{\"c\":{\"assetIds\":[3963991843,3963968066,3963974041,3963969971,3963990231],\"scale\":{\"bodyType\":1,\"height\":1,\"width\":1,\"head\":0.95,\"proportion\":0}}},{\"nm\":{\"assetIds\":[86500008,86500054,86500036,86500064,86500078],\"scale\":{\"bodyType\":0.5,\"height\":1,\"width\":1,\"head\":1,\"proportion\":0}}},{\"nf\":{\"assetIds\":[86499666,86499716,86499698,86499753,86499793],\"scale\":{\"bodyType\":0.5,\"height\":1,\"width\":0.9,\"head\":0.95,\"proportion\":0}}},{\"sm\":{\"assetIds\":[376532000,376530220,376531012,376531300,376531703],\"scale\":{\"bodyType\":0.5,\"height\":1,\"width\":0.75,\"head\":0.95,\"proportion\":0.3}}},{\"sf\":{\"assetIds\":[376547767,376547633,376547341,376546668,376547092],\"scale\":{\"bodyType\":0.5,\"height\":1,\"width\":0.7,\"head\":0.95,\"proportion\":0.3}}},{\"rm\":{\"assetIds\":[3963871432,3963861732,3963867514,3963864909,3963869770],\"scale\":{\"bodyType\":1,\"height\":1,\"width\":1,\"head\":1,\"proportion\":0}}},{\"rf\":{\"assetIds\":[3963485362,3963476651,3963481369,3963479563,3963483107],\"scale\":{\"bodyType\":1,\"height\":1,\"width\":1,\"head\":1,\"proportion\":0}}}],\"bodyColors\":[{\"do\":334},{\"bl\":352},{\"bn\":217},{\"ng\":18},{\"po\":1025},{\"lo\":125}],\"clothing\":[{\"gj\":[382538059,382537569]},{\"dw\":[144076436,382537950]},{\"ps\":[4047884939,398635338]},{\"pt\":[4047886060,382537806]},{\"gt\":[4047884046,382538503]},{\"dj\":[398633584,144076512]},{\"rsg\":[3670737444,144076760]},{\"rsb\":[3670737444,398633812]}],\"heads\":[{\"cm\":[376548738,4018617474,2432102561]},{\"cf\":[2956239660,4018627046,2432102561]},{\"nm\":[451221329,616380929,2432102561]},{\"nf\":[1103003368,616380929,2432102561]},{\"sm\":[62234425,86487700,86498048]},{\"sf\":[451220849,86487766,86498113]},{\"rm\":[3963874672,3643502288]},{\"rf\":[3963490791,3669152260]}]},\"v2\":{\"bodies\":[{\"classic-m\":{\"assetIds\":[4637244207,4637116155,4637242874,4637242166,4637243648],\"scale\":{\"bodyType\":0,\"head\":0.95,\"height\":1,\"proportion\":0,\"width\":1}}},{\"classic-f\":{\"assetIds\":[4637265517,4637262680,4637263998,4637263492,4637264878],\"scale\":{\"bodyType\":0,\"head\":0.95,\"height\":1,\"proportion\":0,\"width\":1}}},{\"neo-m\":{\"assetIds\":[4637290950,4637157175,4637286849,4637285693,4637289137],\"scale\":{\"bodyType\":0,\"head\":0.95,\"height\":1,\"proportion\":0,\"width\":1}}},{\"neo-f\":{\"assetIds\":[4637151279,4637119437,4637120775,4637120072,4637122096],\"scale\":{\"bodyType\":0,\"head\":0.95,\"height\":1,\"proportion\":0,\"width\":0.9}}},{\"style-m\":{\"assetIds\":[376532000,376530220,376531012,376531300,376531703],\"scale\":{\"bodyType\":0.5,\"head\":0.95,\"height\":1,\"proportion\":0.3,\"width\":0.75}}},{\"style-f\":{\"assetIds\":[376547767,376547633,376547341,376546668,376547092],\"scale\":{\"bodyType\":0.5,\"head\":0.95,\"height\":1,\"proportion\":0.3,\"width\":0.7}}},{\"rthro-m\":{\"assetIds\":[3963871432,3963861732,3963867514,3963864909,3963869770],\"scale\":{\"bodyType\":1,\"head\":1,\"height\":1,\"proportion\":0,\"width\":1}}},{\"rthro-f\":{\"assetIds\":[3963485362,3963476651,3963481369,3963479563,3963483107],\"scale\":{\"bodyType\":1,\"head\":1,\"height\":1,\"proportion\":0,\"width\":1}}}],\"bodyColors\":[{\"nougat\":18},{\"pastelOrange\":1025},{\"lightOrange\":125},{\"darkOrange\":38}],\"clothing\":[{\"roblox-shirt\":[4637596615,4637601297]},{\"denim-white\":[4637603462,4637605284]},{\"zipup-jacket\":[4637617396,4637618900]},{\"purple-top\":[4637611578,4637612548]},{\"guitar-tee\":[4047884046,382538503]},{\"denim-jacket\":[398633584,144076512]},{\"rbx-green\":[3670737444,144076760]},{\"rbx-black\":[3670737444,398633812]}],\"heads\":[{\"classic-m\":[4637254498,4637244809,4637245706]},{\"classic-f\":[4637267557,4637266368,4637266996]},{\"neo-m\":[4637431811,4637291815,4637163809]},{\"neo-f\":[4637156063,4637166178,4637441617]},{\"style-m\":[62234425,86487700,86498048]},{\"style-f\":[451220849,86487766,86498113]},{\"rthro-m\":[3963874672,3643502288]},{\"rthro-f\":[3963490791,3669152260]}]}}",
                "IsEmailUpsellAtLogoutEnabled": true,
                "ShouldFetchEmailUpsellIXPValuesAtLogout": true,
                "IsAccountRecoveryPromptEnabled": true,
                "IsContactMethodRequiredAtSignup": false,
                "IsUserAgreementsSignupIntegrationEnabled": true,
                "IsKoreaIdVerificationEnabled": false,

                // chat.rbx2016.tk
                "isChatEnabledByPrivacySetting": 1,
                "languageForPrivacySettingUnavailable": "Chat is currently unavailable",
                "maxConversationTitleLength": 150,
                "numberOfMembersForPartyChrome": 6,
                "partyChromeDisplayTimeStampInterval": 300000,
                "signalRDisconnectionResponseInMilliseconds": 3000,
                "typingInChatFromSenderThrottleMs": 5000,
                "typingInChatForReceiverExpirationMs": 8000,
                "relativeValueToRecordUiPerformance": 0.0,
                "isChatDataFromLocalStorageEnabled": false,
                "chatDataFromLocalStorageExpirationSeconds": 30,
                "isUsingCacheToLoadFriendsInfoEnabled": false,
                "cachedDataFromLocalStorageExpirationMS": 30000,
                "senderTypesForUnknownMessageTypeError": ["User"],
                "isInvalidMessageTypeFallbackEnabled": false,
                "isRespectingMessageTypeEnabled": true,
                "validMessageTypesWhiteList": ["PlainText", "Link"],
                "shouldRespectConversationHasUnreadMessageToMarkAsRead": true,
                "isAliasChatForClientSideEnabled": true,
                "isPlayTogetherForGameCardsEnabled": true,
                "isRoactChatEnabled": true
            });
        });

        app.get('/v2/passwords/current-status', (req, res) => {
            res.json({
                "valid": true
            });
        });

        app.get("/v1/account/pin", (req, res) => {
            res.json({
                "isEnabled": false,
                "unlockedUntil": null
            });
        });

        app.get("/v1/social/connected-providers", (req, res) => {
            res.json({
                "providers": []
            });
        });

        app.get("/v1/xbox/connection", (req, res) => {
            res.json({
                "hasConnectedXboxAccount": false
            });
        });

        app.post('/v2/signup', async (req, res) => {
            if (db.getSiteConfig().shared.allowSignup == false) {
                res.status(401).render("401", await db.getBlankTemplateData());
                return;
            }
            const data = req.body;
            try {
                const birthday = new Date(data.birthday);
            } catch {
                res.status(400).send("Invalid birthday");
                return;
            }
            const birthday = new Date(Date.parse(data.birthday));
            const context = data.context;
            const gender = db.getSiteConfig().shared.users.gendersEnabled ? parseInt(data.gender) : 1; // 1 = none, 2 = Boy, 3 = Girl
            if (gender < 1 || gender > 3) {
                res.status(400).send("Invalid gender");
                return;
            }
            const isTosAgreementBoxChecked = data.isTosAgreementBoxChecked;
            if (!isTosAgreementBoxChecked) {
                res.status(401).send("TOS Not accepted.");
                return;
            }
            const password = data.password;
            const referralData = data.referralData;
            const username = data.username;

            const isBadUsername = badUsernames.includes(username.toLowerCase());
            if (isBadUsername) {
                res.status(400).send("Bad username.");
                return;
            }
            let shouldDeleteOldUser = false;
            if (await db.userExists(username)) {
                if (db.getUserFromUsername(username).inviteKey != "") {
                    shouldDeleteOldUser = true;
                } else {
                    res.status(400).send("Username already taken.");
                    return;
                }
            }

            if (db.getSiteConfig().shared.users.canBeUnder13 == false && new Date() - birthday < 13 * 365 * 24 * 60 * 60 * 1000) {
                res.status(400).send("You must be 13 years or older to create an account.");
                return;
            }

            const ip = get_ip(req).clientIp;
            if (ip != "127.0.0.1" && ip != "::1" && await db.accountsByIP(ip).length >= db.getSiteConfig().backend.maxAccountsPerIP) {
                res.status(401).send("Too many accounts.");
                return;
            }
            let ROBLOSECURITY_COOKIES = "";
            if (typeof username == "undefined") {
                return res.status(400).send();
            }
            if (!shouldDeleteOldUser) {
                ROBLOSECURITY_COOKIES = await db.createUser(username, password, birthday, gender, ip);
            } else {
                ROBLOSECURITY_COOKIES = await db.overwriteUser(username, password, birthday, gender, ip);
            }
            res.cookie('.ROBLOSECURITY', "delete", {
                maxAge: -1,
                path: "/",
                domain: "rbx2016.tk",
                httpOnly: true
            });
            res.cookie('.ROBLOSECURITY', ROBLOSECURITY_COOKIES, {
                maxAge: 50 * 365 * 24 * 60 * 60 * 1000,
                path: "/",
                domain: "rbx2016.tk",
                httpOnly: true
            });
            res.send();
        });

        app.post("/v2/logout", async (req, res) => {
            if ((await db.getConfig()).maintenance && db.backend.disableLogoutOnMaintenance) {
                res.status(503).send("Maintenance");
                return;
            }
            res.cookie('.ROBLOSECURITY', "delete", {
                maxAge: -1,
                path: "/",
                domain: "rbx2016.tk",
                httpOnly: true
            });
            if (typeof req.headers["x-csrf-token"] !== "undefined") {
                if (req.headers["x-csrf-token"].length == 128) {
                    const user = await db.getUserByCsrfToken(req.headers["x-csrf-token"]);
                    if (user) {
                        await db.setUserProperty(user.userid, "cookie", "");
                    }
                }
            }
            res.redirect("/");
        });

        app.post("/v1/authentication-ticket", async (req, res) => {
            if (typeof req.headers["x-csrf-token"] === "undefined") {
                return res.status(400).send("No CSRF token");
            }
            if (req.headers["x-csrf-token"].length != 128) {
                return res.status(400).send("Invalid CSRF token");
            }
            res.setHeader("rbx-authentication-ticket", await db.generateUserToken(req.headers["x-csrf-token"]));
            res.json({});
        });

        app.post("/v1/authentication-ticket/redeem", async (req, res) => {
            if (typeof req.body["authenticationTicket"] === "undefined") {
                return res.status(400).send("No authentication ticket");
            }
            const user = await db.findUserByToken(req.body["authenticationTicket"]);
            if (!user || user.banned || user.inviteKey == "") {
                return res.status(401).send("Invalid authentication ticket");
            }
            res.cookie('.ROBLOSECURITY', "delete", {
                maxAge: -1,
                path: "/",
                domain: "rbx2016.tk",
                httpOnly: true
            });
            res.cookie('.ROBLOSECURITY', user.cookie, {
                maxAge: 50 * 365 * 24 * 60 * 60 * 1000,
                path: "/",
                domain: "rbx2016.tk",
                httpOnly: true
            });
            res.json({});
        });

        app.get("/studio-login/v1/login", db.requireAuth, (req, res) => {
            res.json({
                "user": {
                    "UserId": req.user.userid,
                    "Username": req.user.username,
                    "AgeBracket": 0,
                    "Roles": [],
                    "Email": {
                        "value": db.censorEmail(req.user.email),
                        "isVerified": req.user.emailverified
                    },
                    "IsBanned": false
                },
                "userAgreements": []
            });
        });

        app.post('/v2/login', async (req, res) => {
            if (db.getSiteConfig().shared.allowLogin == false) {
                res.status(401).render("401", await db.getBlankTemplateData());
                return;
            }
            const ctype = req.body.ctype;
            const cvalue = req.body.cvalue;
            const password = req.body.password;
            const isClient = req.get('User-Agent').toLowerCase().includes("roblox");
            if (ctype == "Username") {
                if (typeof cvalue == "undefined") {
                    res.status(400).send();
                    return;
                }
                const user = await db.loginUser(cvalue, password, isClient);
                if (user == false) {
                    res.status(403).json({
                        "errors": [{
                            "code": 1,
                            "message": "Incorrect username or password. Please try again.",
                            "userFacingMessage": "Something went wrong"
                        }]
                    });
                    return;
                }
                res.cookie('.ROBLOSECURITY', "delete", {
                    maxAge: -1,
                    path: "/",
                    domain: "rbx2016.tk",
                    httpOnly: true
                });
                res.cookie('.ROBLOSECURITY', user.cookie, {
                    maxAge: 50 * 365 * 24 * 60 * 60 * 1000,
                    path: "/",
                    domain: "rbx2016.tk",
                    httpOnly: true
                });
                res.json({
                    "user": {
                        "id": user.userid,
                        "name": user.username,
                        "displayName": user.username
                    },
                    "isBanned": false
                });
            } else if (ctype == "AuthToken") {
                const cvalue = req.body.cvalue;
                const password = req.body.password;
                if (typeof cvalue == "undefined") {
                    res.status(400).send();
                    return;
                }
                const user = await db.loginUserByLoginCode(cvalue, password, isClient);
                if (user == false) {
                    res.status(403).json({
                        "errors": [{
                            "code": 1,
                            "message": "Incorrect username or password. Please try again.",
                            "userFacingMessage": "Something went wrong"
                        }]
                    });
                    return;
                }
                res.cookie('.ROBLOSECURITY', "delete", {
                    maxAge: -1,
                    path: "/",
                    domain: "rbx2016.tk",
                    httpOnly: true
                });
                res.cookie('.ROBLOSECURITY', user.cookie, {
                    maxAge: 50 * 365 * 24 * 60 * 60 * 1000,
                    path: "/",
                    domain: "rbx2016.tk",
                    httpOnly: true
                });
                res.json({
                    "user": {
                        "id": user.userid,
                        "name": user.username,
                        "displayName": user.username
                    },
                    "isBanned": false
                });
            } else {
                res.status(501).json({});
            }
        });

        app.post('/Login/FulfillConstraint.aspx', async (req, res) => {
            const ip = get_ip(req).clientIp;
            const key = req.body["ctl00$cphRoblox$Textbox1"];
            await db.attemptMaintenanceModeWhitelistedIp(ip, key);
            res.redirect("/");
        });
    }
}