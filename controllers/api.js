const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
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
                "PlaceFetchUrl": "https://assetdelivery.roblox.com/v1/asset?id=1",
                "MatchmakingContextId": 1,
                "CreatorId": 1,
                "CreatorType": "User",
                "PreferredPlayerCapacity": "Fill",
                "PlaceVersion": 1,
                "BaseUrl": "roblox.com",
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
            if ((!user || user.banned) || !game || db.getSiteConfig().shared.games.canManageGames == false) {
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

        app.get("/universes/:universeid/cloudeditenabled", (req, res) => {
            const universeid = parseInt(req.params.universeid);
            res.json({
                "enabled": false
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

        app.get("/universes/get-info", async (req, res) => {
            const placeId = parseInt(req.query.placeId);
            const game = await db.getGame(placeId);
            if (!game) {
                res.status(404).json({});
                return;
            }
            res.json({
                "Name": game.name,
                "Description": game.description,
                "RootPlace": game.gameid,
                "StudioAccessToApisAllowed": false,
                "CurrentUserHasEditPermissions": false,
                "UniverseAvatarType": game.universeAvatarType || "MorphToR6"
            })
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
            if (!item && !game) {
                res.json({
                    "error": true,
                    "message": "Item not found"
                });
                return;
            }
            if (item && (typeof assettype === "undefined" || assettype === "item")) {
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

        app.get("/v1.1/game-start-info", async (req, res) => {
            const universeId = parseInt(req.query.universeId);
            const game = await db.getGame(universeId);
            if (!game){
                res.status(404).json({});
                return;
            }
            res.json({
                "gameAvatarType": game.universeAvatarType || "MorphToR6",
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
            if (userGames.length >= (req.user.isAdmin ? db.getSiteConfig().shared.games.maxGamesPerUser.admin : db.getSiteConfig().shared.games.maxGamesPerUser.user)) {
                res.status(403).json({
                    "error": true,
                    "message": "You have reached the maximum number of games you can create."
                });
                return;
            }
            const gameid = await db.createGame(`${req.user.username}Place Number: ${userGames.length + 1}`, "This is my ROBLOX game, come check it out! :D", req.user.userid, "https://images.roblox.com/baseplate", "https://images.roblox.com/baseplate");
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