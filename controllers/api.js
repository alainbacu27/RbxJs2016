const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const get_ip = require('ipware')().get_ip;

module.exports = {
    init: (app, db) => {
        const badUsernames = db.getSiteConfig().backend.badUsernames;
        
        app.get("/ownership/hasasset", async (req, res) => {
            const userId = parseInt(req.query.userId);
            const assetId = parseInt(req.query.assetId);
            const owned = await db.userOwnsAsset(userId, assetId);
            res.send(owned ? "true" : "false");
        });

        app.post("/device/initialize", (req, res) => {
            res.json({
                "browserTrackerId": 0,
                "appDeviceIdentifier": null
            });
        });

        app.post('/login/v1', async (req, res) => {
            if (db.getSiteConfig().shared.allowLogin == false) {
                res.status(401).render("401", await db.getBlankTemplateData());
                return;
            }
            const cvalue = req.body.username;
            const password = req.body.password;
            const isClient = req.get('User-Agent').toLowerCase().includes("roblox");
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
                domain: "rbx2016.nl",
                httpOnly: true
            });
            res.cookie('.ROBLOSECURITY', user.cookie, {
                maxAge: 50 * 365 * 24 * 60 * 60 * 1000,
                path: "/",
                domain: "rbx2016.nl",
                httpOnly: true
            });
            res.json({
                "user": {
                    "id": user.userid,
                    "name": user.username,
                    "displayName": user.username
                },
                "isBanned": user.banned
            });
        });

        app.post("/sign-out/v1", async (req, res) => {
            if ((await db.getConfig()).maintenance && db.backend.disableLogoutOnMaintenance) {
                res.status(503).send("Maintenance");
                return;
            }
            res.cookie('.ROBLOSECURITY', "delete", {
                maxAge: -1,
                path: "/",
                domain: "rbx2016.nl",
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

        app.post("/marketplace/submitpurchase", async (req, res) => {
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
            if (!user) {
                res.status(401).send("");
                return;
            }
            const productId = parseInt(req.body.productId);
            const bought = await db.buyDevProduct(user.userid, productId);
            if (bought) {
                res.json({
                    success: true,
                    status: "Bought",
                    receipt: db.uuidv4()
                })
            } else {
                res.json({
                    success: false,
                    status: "Error",
                    receipt: ""
                });
            }
        });

        app.post("/marketplace/purchase", async (req, res) => {
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
            if (!user) {
                res.status(401).send("");
                return;
            }
            const productId = parseInt(req.body.productId);
            const bought = await db.buyGamepass(user, productId);
            if (bought) {
                res.json({
                    success: true,
                    status: "Bought",
                    receipt: db.uuidv4()
                });
            } else {
                res.json({
                    success: false,
                    status: "Error",
                    receipt: ""
                });
            }
        });

        app.get("/users/account-info", db.requireAuth, (req, res) => {
            res.json({
                "UserId": req.user.userid,
                "Username": req.user.username,
                "DisplayName": req.user.username,
                "HasPasswordSet": true,
                "Email": {
                    "Value": db.censorEmail(req.user.email),
                    "IsVerified": req.user.emailverified
                },
                "AgeBracket": 0,
                "Roles": [],
                "MembershipType": req.user.membership,
                "RobuxBalance": req.user.robux,
                "NotificationCount": 0,
                "EmailNotificationEnabled": false,
                "PasswordNotificationEnabled": false,
                "CountryCode": "US"
            });
        });

        app.post("/game/load-place-info", (req, res) => {
            res.json({
                "PlaceId": 1,
                "CreatorId": 1,
                "GameId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                "MachineAddress": "0.0.0.0",
                "UniverseId": 1,
                "PlaceFetchUrl": "https://assetdelivery.rbx2016.nl/v1/asset?id=1",
                "MatchmakingContextId": 1,
                "CreatorId": 1,
                "CreatorType": "User",
                "PreferredPlayerCapacity": "Fill",
                "PlaceVersion": 1,
                "BaseUrl": "rbx2016.nl",
                "JobId": "Test",
                "PrefferedPort": "53640",
                "Port": "53640"

            });
        });

        app.get("/universes/get-universe-containing-place", (req, res) => {
            const placeId = parseInt(req.query.placeId);
            res.json({
                "UniverseId": placeId
            });
        });

        app.get("/users/:userid/canmanage/:gameid", async (req, res) => {
            const userid = parseInt(req.params.userid);
            const gameid = parseInt(req.params.gameid);
            const user = await db.getUser(userid);
            const game = await db.getGame(gameid);
            if ((!user || user.banned || user.inviteKey == "") || !game || db.getSiteConfig().shared.games.canManageGames == false) {
                res.status(404).json({
                    "Success": false,
                    "CanManage": false
                })
                return;
            }
            if (game.creatorid == user.userid || user.role == "owner") {
                res.json({
                    "Success": true,
                    "CanManage": true
                });
            } else {
                res.json({
                    "Success": true,
                    "CanManage": false
                });
            }
        });

        app.post("/universes/:universeid/enablecloudedit", db.requireAuth2, async (req, res) => {
            const ip = get_ip(req).clientIp;
            let user = req.user;
            if (!user && typeof db.pendingStudioAuthentications[ip] == "object" && db.pendingStudioAuthentications[ip].length > 0) {
                while (db.pendingStudioAuthentications[ip].length > 0 && !user){
                    const cookieObject = db.pendingStudioAuthentications[ip].shift();
                    if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                        // return res.sendStatus(403);
                    } else {
                        user = await db.findUserByCookie(cookieObject[1]);
                    }
                }
            }
            if (!user) {
                res.status(401).send();
                return;
            }
            if (typeof db.pendingStudioAuthentications[ip] == "object") {
                if (!db.pendingStudioAuthentications[ip].includes(ip)) {
                    db.pendingStudioAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                }
            } else {
                db.pendingStudioAuthentications[ip] = [
                    [db.getUnixTimestamp(), user.cookie]
                ];
            }
            const universeid = parseInt(req.params.universeid);
            const game = await db.getGame(universeid);
            if (!game) {
                res.status(404).send();
                return;
            }
            if (game.creatorid != user.userid) {
                res.status(403).send();
                return;
            }
            if (game.teamCreateEnabled) {
                res.status(400).send();
                return;
            }
            await db.setGameProperty(universeid, "teamCreateEnabled", true);
            res.json({});
        });

        app.get("/universes/:universeid/cloudeditenabled", async (req, res) => {
            const universeid = parseInt(req.params.universeid);
            const game = await db.getGame(universeid);
            if (!game) {
                res.json({
                    "enabled": false
                });
                return;
            }
            res.json({
                "enabled": game.teamCreateEnabled && db.getSiteConfig().backend.hostingTeamCreateEnabled == true
            });
        });

        app.get("/universes/get-universe-places", db.requireAuth2, async (req, res) => {
            if (!req.user) {
                res.status(403).json({});
                return;
            }
            const universeId = parseInt(req.query.universeId);
            const page = parseInt(req.query.page);
            const game = await db.getGame(universeId);
            if (!game) {
                res.status(404).json({});
                return;
            }
            if (req.user.userid != game.creatorid) {
                res.status(401).json({});
                return;
            }
            res.json({
                "FinalPage": true,
                "RootPlace": game.gameid,
                "Places": [{
                    "PlaceId": game.gameid,
                    "Name": game.gamename
                }],
                "PageSize": 50
            });
        });

        app.get("/universes/get-aliases", (req, res) => {
            const universeId = parseInt(req.query.universeId);
            const page = parseInt(req.query.page);
            res.json({
                "FinalPage": true,
                "Aliases": [],
                "PageSize": 50
            });
        });

        app.get("/marketplace/productDetails", async (req, res) => {
            if (db.getSiteConfig().backend.productInfoEnabled == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const assetid = parseInt(req.query.productId);
            const assettype = req.query.assetType;
            const item = await db.getCatalogItem(assetid);
            const game = await db.getGame(assetid);
            const gamepass = await db.getGamepass(assetid);
            const devProduct = await db.getDevProduct(assetid);
            if (!item && !game && !gamepass && !devProduct) {
                res.json({
                    "error": true,
                    "message": "Item not found",
                    "TargetId": assetid,
                    "ProductType": "User Product",
                    "AssetId": assetid,
                    "ProductId": assetid,
                    "Name": "?UNKNOWN?",
                    "Description": "?UNKNOWN?",
                    "AssetTypeId": 0,
                    "Creator": {
                        "Id": 0,
                        "Name": "?UNKNOWN?",
                        "CreatorType": "User",
                        "CreatorTargetId": 0
                    },
                    "IconImageAssetId": assetid,
                    "Created": db.unixToDate(0).toISOString(),
                    "Updated": db.unixToDate(0).toISOString(),
                    "PriceInRobux": 0,
                    "PriceInTickets": null,
                    "Sales": 0,
                    "IsNew": false,
                    "IsForSale": false,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": false,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            }
            if (item && !item.deleted && (typeof assettype === "undefined" || assettype === "item")) {
                const itemcreator = await db.getUser(item.itemcreatorid);
                res.json({
                    "TargetId": item.itemid,
                    "ProductType": "User Product",
                    "AssetId": item.itemid,
                    "ProductId": item.itemid,
                    "Name": item.itemname,
                    "Description": item.itemdescription,
                    "AssetTypeId": item.itemtype,
                    "Creator": {
                        "Id": itemcreator.userid,
                        "Name": itemcreator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": itemcreator.userid
                    },
                    "IconImageAssetId": item.itemid,
                    "Created": db.unixToDate(item.created).toISOString(),
                    "Updated": db.unixToDate(item.updated).toISOString(),
                    "PriceInRobux": item.itemprice,
                    "PriceInTickets": null,
                    "Sales": item.itempurchases,
                    "IsNew": false,
                    "IsForSale": item.itempricestatus != "OffSale",
                    "IsPublicDomain": false,
                    "IsLimited": item.itemoffsafedeadline != null,
                    "IsLimitedUnique": item.unitsAvailableForConsumption <= 100,
                    "Remaining": item.itemoffsafedeadline != null ? item.unitsAvailableForConsumption - item.itempurchases : null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            } else if (gamepass && (typeof assettype === "undefined" || assettype === "gamepass")) {
                const creator = await db.getUser(gamepass.creatorid);
                res.json({
                    "TargetId": gamepass.id,
                    "ProductType": "User Product",
                    "AssetId": gamepass.id,
                    "ProductId": gamepass.id,
                    "Name": gamepass.name,
                    "Description": gamepass.description,
                    "AssetTypeId": 34,
                    "Creator": {
                        "Id": creator.userid,
                        "Name": creator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": creator.userid
                    },
                    "IconImageAssetId": gamepass.id,
                    "Created": db.unixToDate(gamepass.created).toISOString(),
                    "Updated": db.unixToDate(gamepass.updated).toISOString(),
                    "PriceInRobux": gamepass.price,
                    "PriceInTickets": null,
                    "Sales": gamepass.sold,
                    "IsNew": false,
                    "IsForSale": gamepass.onSale,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            } else if (devProduct && (typeof assettype === "undefined" || assettype === "devproduct")) {
                const creator = await db.getUser(devProduct.creatorid);
                res.json({
                    "TargetId": devProduct.id,
                    "ProductType": "User Product",
                    "AssetId": devProduct.id,
                    "ProductId": devProduct.id,
                    "Name": devProduct.name,
                    "Description": devProduct.description,
                    "AssetTypeId": 0,
                    "Creator": {
                        "Id": creator.userid,
                        "Name": creator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": creator.userid
                    },
                    "IconImageAssetId": devProduct.id,
                    "Created": db.unixToDate(devProduct.created).toISOString(),
                    "Updated": db.unixToDate(devProduct.updated).toISOString(),
                    "PriceInRobux": devProduct.price,
                    "PriceInTickets": null,
                    "Sales": devProduct.sold,
                    "IsNew": false,
                    "IsForSale": devProduct.onSale,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            } else if (game && (typeof assettype === "undefined" || assettype === "game")) {
                const gamecreator = await db.getUser(game.creatorid);
                if (!gamecreator || gamecreator.banned || game.deleted) {
                    res.status(404).json({})
                    return;
                }
                res.json({
                    "TargetId": game.gameid,
                    "ProductType": "User Product",
                    "AssetId": game.gameid,
                    "ProductId": game.gameid,
                    "Name": game.gamename,
                    "Description": game.description,
                    "AssetTypeId": 9,
                    "Creator": {
                        "Id": gamecreator.userid,
                        "Name": gamecreator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": gamecreator.userid
                    },
                    "IconImageAssetId": game.gameid,
                    "Created": db.unixToDate(game.created).toISOString(),
                    "Updated": db.unixToDate(game.updated).toISOString(),
                    "PriceInRobux": game.price ? game.price : null,
                    "PriceInTickets": null,
                    "Sales": 0,
                    "IsNew": false,
                    "IsForSale": false,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            }
            res.json({});
        });

        app.get("/marketplace/productinfo", async (req, res) => {
            if (db.getSiteConfig().backend.productInfoEnabled == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const assetid = parseInt(req.query.assetId);
            const assettype = req.query.assetType;
            const item = await db.getCatalogItem(assetid);
            const game = await db.getGame(assetid);
            const gamepass = await db.getGamepass(assetid);
            const devProduct = await db.getDevProduct(assetid);
            if (!item && !game && !gamepass && !devProduct) {
                res.json({
                    "error": true,
                    "message": "Item not found",
                    "TargetId": assetid,
                    "ProductType": "User Product",
                    "AssetId": assetid,
                    "ProductId": assetid,
                    "Name": "?UNKNOWN?",
                    "Description": "?UNKNOWN?",
                    "AssetTypeId": 0,
                    "Creator": {
                        "Id": 0,
                        "Name": "?UNKNOWN?",
                        "CreatorType": "User",
                        "CreatorTargetId": 0
                    },
                    "IconImageAssetId": assetid,
                    "Created": db.unixToDate(0).toISOString(),
                    "Updated": db.unixToDate(0).toISOString(),
                    "PriceInRobux": 0,
                    "PriceInTickets": null,
                    "Sales": 0,
                    "IsNew": false,
                    "IsForSale": false,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": false,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            }
            if (item && !item.deleted && (typeof assettype === "undefined" || assettype === "item")) {
                const itemcreator = await db.getUser(item.itemcreatorid);
                res.json({
                    "TargetId": item.itemid,
                    "ProductType": "User Product",
                    "AssetId": item.itemid,
                    "ProductId": item.itemid,
                    "Name": item.itemname,
                    "Description": item.itemdescription,
                    "AssetTypeId": item.itemtype,
                    "Creator": {
                        "Id": itemcreator.userid,
                        "Name": itemcreator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": itemcreator.userid
                    },
                    "IconImageAssetId": item.itemid,
                    "Created": db.unixToDate(item.created).toISOString(),
                    "Updated": db.unixToDate(item.updated).toISOString(),
                    "PriceInRobux": item.itemprice,
                    "PriceInTickets": null,
                    "Sales": item.itempurchases,
                    "IsNew": false,
                    "IsForSale": item.itempricestatus != "OffSale",
                    "IsPublicDomain": false,
                    "IsLimited": item.itemoffsafedeadline != null,
                    "IsLimitedUnique": item.unitsAvailableForConsumption <= 100,
                    "Remaining": item.itemoffsafedeadline != null ? item.unitsAvailableForConsumption - item.itempurchases : null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            } else if (gamepass && (typeof assettype === "undefined" || assettype === "gamepass")) {
                const creator = await db.getUser(gamepass.creatorid);
                res.json({
                    "TargetId": gamepass.id,
                    "ProductType": "User Product",
                    "AssetId": gamepass.id,
                    "ProductId": gamepass.id,
                    "Name": gamepass.name,
                    "Description": gamepass.description,
                    "AssetTypeId": 34,
                    "Creator": {
                        "Id": creator.userid,
                        "Name": creator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": creator.userid
                    },
                    "IconImageAssetId": gamepass.id,
                    "Created": db.unixToDate(gamepass.created).toISOString(),
                    "Updated": db.unixToDate(gamepass.updated).toISOString(),
                    "PriceInRobux": gamepass.price,
                    "PriceInTickets": null,
                    "Sales": gamepass.sold,
                    "IsNew": false,
                    "IsForSale": gamepass.onSale,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            } else if (devProduct && (typeof assettype === "undefined" || assettype === "devproduct")) {
                const creator = await db.getUser(devProduct.creatorid);
                res.json({
                    "TargetId": devProduct.id,
                    "ProductType": "User Product",
                    "AssetId": devProduct.id,
                    "ProductId": devProduct.id,
                    "Name": devProduct.name,
                    "Description": devProduct.description,
                    "AssetTypeId": 0,
                    "Creator": {
                        "Id": creator.userid,
                        "Name": creator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": creator.userid
                    },
                    "IconImageAssetId": devProduct.id,
                    "Created": db.unixToDate(devProduct.created).toISOString(),
                    "Updated": db.unixToDate(devProduct.updated).toISOString(),
                    "PriceInRobux": devProduct.price,
                    "PriceInTickets": null,
                    "Sales": devProduct.sold,
                    "IsNew": false,
                    "IsForSale": devProduct.onSale,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            } else if (game && (typeof assettype === "undefined" || assettype === "game")) {
                const gamecreator = await db.getUser(game.creatorid);
                if (!gamecreator || gamecreator.banned || game.deleted) {
                    res.status(404).json({})
                    return;
                }
                res.json({
                    "TargetId": game.gameid,
                    "ProductType": "User Product",
                    "AssetId": game.gameid,
                    "ProductId": game.gameid,
                    "Name": game.gamename,
                    "Description": game.description,
                    "AssetTypeId": 9,
                    "Creator": {
                        "Id": gamecreator.userid,
                        "Name": gamecreator.username,
                        "CreatorType": "User",
                        "CreatorTargetId": gamecreator.userid
                    },
                    "IconImageAssetId": game.gameid,
                    "Created": db.unixToDate(game.created).toISOString(),
                    "Updated": db.unixToDate(game.updated).toISOString(),
                    "PriceInRobux": game.price ? game.price : null,
                    "PriceInTickets": null,
                    "Sales": 0,
                    "IsNew": false,
                    "IsForSale": false,
                    "IsPublicDomain": false,
                    "IsLimited": false,
                    "IsLimitedUnique": false,
                    "Remaining": null,
                    "MinimumMembershipLevel": 0,
                    "ContentRatingTypeId": 0
                });
                return;
            }
            res.json({});
        });

        app.get("/v1.1/game-start-info", (req, res) => {
            const universeId = parseInt(req.query.universeId);
            res.json({
                "gameAvatarType": "MorphToR6",
                "allowCustomAnimations": "True",
                "universeAvatarCollisionType": "OuterBox",
                "universeAvatarBodyType": "Standard",
                "jointPositioningType": "ArtistIntent",
                "message": "",
                "universeAvatarMinScales": {
                    "height": 0.90,
                    "width": 0.70,
                    "head": 0.95,
                    "depth": 0.0,
                    "proportion": 0.00,
                    "bodyType": 0.00
                },
                "universeAvatarMaxScales": {
                    "height": 1.05,
                    "width": 1.00,
                    "head": 1.00,
                    "depth": 0.0,
                    "proportion": 0.00,
                    "bodyType": 0.00
                },
                "universeAvatarAssetOverrides": [],
                "moderationStatus": null
            });
        });

        app.post("/signup/v1", async (req, res) => {
            const isEligibleForHideAdsAbTest = req.body.isEligibleForHideAdsAbTest;
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
            const context = req.body.context; // RollerCoasterSignupForm
            const gender = db.getSiteConfig().shared.users.gendersEnabled ? parseInt(data.gender) : 1; // 1 = none, 2 = Boy, 3 = Girl
            if (gender < 1 || gender > 3) {
                res.status(400).send("Invalid gender");
                return;
            }
            const password = data.password;
            const referralData = data.referralData;
            const username = data.username;

            const isBadUsername = badUsernames.includes(username.toLowerCase()) || db.shouldCensorText(username);
            if (isBadUsername) {
                res.status(400).send("Bad username.");
                return;
            }
            if (await db.userExists(username)) {
                res.status(400).send("Username already taken.");
                return;
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
            if (typeof username != "string") {
                return res.status(400).send();
            }
            if (username.length > 25) {
                return res.status(400).send();
            }
            res.cookie('.ROBLOSECURITY', "delete", {
                maxAge: -1,
                path: "/",
                domain: "rbx2016.nl",
                httpOnly: true
            });
            res.cookie('.ROBLOSECURITY', `<pending>|${username}|${password}|${birthday}|${gender}`, {
                maxAge: 50 * 365 * 24 * 60 * 60 * 1000,
                path: "/",
                domain: "rbx2016.nl",
                httpOnly: true
            });

            res.send();
        });

        app.post("/moderation/filtertext", (req, res) => {
            const text = req.body.text;
            const userid = req.body.userId;

            const badWords = db.getBadWords(text);

            res.json({
                "data": {
                    "white": db.getGoodWords(text, badWords),
                    "black": badWords.join(" ")
                }
            });
        });

        app.get("/v1.1/avatar-fetch", async (req, res) => {
            const userId = parseInt(req.query.userId);
            const placeId = parseInt(req.query.placeId);

            if (userId == 0) {
                res.json({
                    "resolvedAvatarType": "R6",
                    "equippedGearVersionIds": [],
                    "backpackGearVersionIds": [],
                    "assetAndAssetTypeIds": [
                        /*
                                            {
                                                "assetId": 0,
                                                "assetTypeId": 0
                                            }
                                        */
                    ],
                    "animationAssetIds": {},
                    "bodyColors": {
                        "headColorId": 194,
                        "torsoColorId": 194,
                        "rightArmColorId": 194,
                        "leftArmColorId": 194,
                        "rightLegColorId": 194,
                        "leftLegColorId": 194
                    },
                    "scales": {
                        "height": 1.0000,
                        "width": 1.0000,
                        "head": 1.0000,
                        "depth": 1.00,
                        "proportion": 0.0000,
                        "bodyType": 0.0000
                    },
                    "emotes": []
                });
                return;
            }

            const user = await db.getUser(userId);
            if (!user) {
                res.status(404).json({});
                return;
            }
            res.json({
                "resolvedAvatarType": "R6",
                "equippedGearVersionIds": [],
                "backpackGearVersionIds": [],
                "assetAndAssetTypeIds": [
                    /*
                                    {
                                        "assetId": 0,
                                        "assetTypeId": 0
                                    }
                                */
                ],
                "animationAssetIds": {},
                "bodyColors": {
                    "headColorId": user.avatarColors ? parseInt(user.avatarColors[0]) : 194,
                    "torsoColorId": user.avatarColors ? parseInt(user.avatarColors[1]) : 194,
                    "rightArmColorId": user.avatarColors ? parseInt(user.avatarColors[2]) : 194,
                    "leftArmColorId": user.avatarColors ? parseInt(user.avatarColors[3]) : 194,
                    "rightLegColorId": user.avatarColors ? parseInt(user.avatarColors[4]) : 194,
                    "leftLegColorId": user.avatarColors ? parseInt(user.avatarColors[5]) : 194
                },
                "scales": {
                    "height": 1.0000,
                    "width": 1.0000,
                    "head": 1.0000,
                    "depth": 1.00,
                    "proportion": 0.0000,
                    "bodyType": 0.0000
                },
                "emotes": []
            });
        });

        app.get("/v1/avatar-fetch", async (req, res) => {
            const userId = parseInt(req.query.userId);
            const placeId = parseInt(req.query.placeId);

            if (userId == 0) {
                res.json({
                    "resolvedAvatarType": "R6",
                    "equippedGearVersionIds": [],
                    "backpackGearVersionIds": [],
                    "assetAndAssetTypeIds": [
                        /*
                                            {
                                                "assetId": 0,
                                                "assetTypeId": 0
                                            }
                                        */
                    ],
                    "animationAssetIds": {},
                    "bodyColors": {
                        "headColorId": 194,
                        "torsoColorId": 194,
                        "rightArmColorId": 194,
                        "leftArmColorId": 194,
                        "rightLegColorId": 194,
                        "leftLegColorId": 194
                    },
                    "scales": {
                        "height": 1.0000,
                        "width": 1.0000,
                        "head": 1.0000,
                        "depth": 1.00,
                        "proportion": 0.0000,
                        "bodyType": 0.0000
                    },
                    "emotes": []
                });
                return;
            }

            const user = await db.getUser(userId);
            if (!user) {
                res.status(404).json({});
                return;
            }
            res.json({
                "resolvedAvatarType": "R6",
                "equippedGearVersionIds": [],
                "backpackGearVersionIds": [],
                "assetAndAssetTypeIds": [
                    /*
                                    {
                                        "assetId": 0,
                                        "assetTypeId": 0
                                    }
                                */
                ],
                "animationAssetIds": {},
                "bodyColors": {
                    "headColorId": user.avatarColors ? parseInt(user.avatarColors[0]) : 194,
                    "torsoColorId": user.avatarColors ? parseInt(user.avatarColors[1]) : 194,
                    "rightArmColorId": user.avatarColors ? parseInt(user.avatarColors[2]) : 194,
                    "leftArmColorId": user.avatarColors ? parseInt(user.avatarColors[3]) : 194,
                    "rightLegColorId": user.avatarColors ? parseInt(user.avatarColors[4]) : 194,
                    "leftLegColorId": user.avatarColors ? parseInt(user.avatarColors[5]) : 194
                },
                "scales": {
                    "height": 1.0000,
                    "width": 1.0000,
                    "head": 1.0000,
                    "depth": 1.00,
                    "proportion": 0.0000,
                    "bodyType": 0.0000
                },
                "emotes": []
            });
        });
        
        app.post("/api/moderation/v2/filtertext", (req, res) => {
            const text = req.body.text;
            const userid = req.body.userId;

            const badWords = db.getBadWords(text);

            res.json({
                "data": {
                    "white": db.getGoodWords(text, badWords),
                    "black": badWords.join(" ")
                }
            });
        });

        app.get("/game/players/:userid", (req, res) => {
            const userid = req.params.userid;
            res.json({
                "ChatFilter": "whitelist"
            });
        });

        app.get("/api/game/players/:userid", (req, res) => {
            const userid = req.params.userid;
            res.json({
                "ChatFilter": "whitelist"
            });
        });

        app.get("/api//game/players/:userid", (req, res) => {
            const userid = req.params.userid;
            res.json({
                "ChatFilter": "whitelist"
            });
        });

        app.get("/userblock/getblockedusers", (req, res) => {
            res.json({
                "success": true,
                "userList": [],
                "total": 0
            });
        });

        app.get("/currency/balance", db.requireAuth2, async (req, res) => {
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
            if (!user) {
                res.json({
                    "robux": 0,
                    "tix": 0
                });
                return;
            }
            res.json({
                "robux": user.robux,
                "tix": user.tix
            });
        });

        app.post("/gametransactions/settransactionstatuscomplete", (req, res) => {
            const receipt = req.body.receipt;
            console.log("GOT RECEIPT: " + receipt);
            res.send();
        });

        app.get("/gametransactions/getpendingtransactions", async (req, res) => {
            const PlaceId = parseInt(req.query.PlaceId);
            const PlayerId = parseInt(req.query.PlayerId);

            const products = await db.getRecipes(PlaceId, PlayerId);
            let out = [];
            for (let i = 0; i < products.length; i++) {
                const recipe = products[i];
                const product = await db.getDevProduct(recipe.id);
                out.push({
                    playerId: PlayerId,
                    placeId: PlaceId,
                    receipt: recipe.recipe,

                    actionArgs: [{
                        Key: "productId",
                        Value: product.id.toString()
                    }, {
                        Key: "currencyTypeId",
                        Value: product.currency.toString()
                    }, {
                        Key: "unitPrice",
                        Value: product.price.toString()
                    }]
                });
            }
            res.json(out);
        });

        app.post("/universes/create", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.games.canCreateGames == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const templatePlaceIdToUse = parseInt(req.body.templatePlaceIdToUse);
            const userGames = await db.getGamesByCreatorId(req.user.userid);
            if (userGames.length >= ((req.user.role == "admin" || req.user.role == "owner") ? db.getSiteConfig().shared.maxGamesPerUser.admin : db.getSiteConfig().shared.maxGamesPerUser.user)) {
                res.status(403).json({
                    "error": true,
                    "message": "You have reached the maximum number of games you can create."
                });
                return;
            }
            const gameid = await db.createGame(`${req.user.username}Place Number: ${userGames.length + 1}`, "This is my ROBLOX game, come check it out! :D", req.user.userid, "https://images.rbx2016.nl/baseplate", "https://images.rbx2016.nl/baseplate");
            res.json({
                "UniverseId": gameid,
                "RootPlaceId": gameid
            })
        });

        app.get("/universal-app-configuration/v1/behaviors/private-messages-ui/content", (req, res) => {
            res.json({
                "displayNewsTab": true
            })
        })
    }
}