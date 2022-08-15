const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const get_ip = require('ipware')().get_ip;

module.exports = {
    init: (app, db) => {
        app.get("/ownership/hasasset", async (req, res) => {
            const userId = parseInt(req.query.userId);
            const assetId = parseInt(req.query.assetId);
            const owned = await db.userOwnsAsset(userId, assetId);
            res.send(owned ? "true" : "false");
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
                res.status.send("")
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
                "PlaceFetchUrl": "https://assetdelivery.rbx2016.tk/v1/asset?id=1",
                "MatchmakingContextId": 1,
                "CreatorId": 1,
                "CreatorType": "User",
                "PreferredPlayerCapacity": "Fill",
                "PlaceVersion": 1,
                "BaseUrl": "rbx2016.tk",
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
            if (game.creatorid == user.userid) {
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
                    "message": "Item not found"
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
                    "message": "Item not found"
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

        app.post("/universes/create", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.games.canCreateGames == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const templatePlaceIdToUse = parseInt(req.body.templatePlaceIdToUse);
            const userGames = await db.getGamesByCreatorId(req.user.userid);
            if (userGames.length >= (req.user.isAdmin ? db.getSiteConfig().shared.maxGamesPerUser.admin : db.getSiteConfig().shared.maxGamesPerUser.user)) {
                res.status(403).json({
                    "error": true,
                    "message": "You have reached the maximum number of games you can create."
                });
                return;
            }
            const gameid = await db.createGame(`${req.user.username}Place Number: ${userGames.length + 1}`, "This is my ROBLOX game, come check it out! :D", req.user.userid, "https://images.rbx2016.tk/baseplate", "https://images.rbx2016.tk/baseplate");
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