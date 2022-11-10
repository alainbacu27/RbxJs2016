const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/v1/gametemplates", (req, res) => {
            const limit = parseInt(req.query.limit);
            res.json({
                "data": [{
                    "gameTemplateType": "Generic",
                    "hasTutorials": false,
                    "universe": {
                        "id": 1,
                        "name": "Baseplate",
                        "description": null,
                        "isArchived": false,
                        "rootPlaceId": 1,
                        "isActive": true,
                        "privacyType": "Public",
                        "creatorType": "User",
                        "creatorTargetId": 1,
                        "creatorName": "Templates",
                        "created": "2021-03-23T19:56:45.957",
                        "updated": "2021-04-16T13:55:13.82"
                    }
                }]
            });
        });

        app.get("/v1/user/groups/canmanage", (req, res) => {
            res.json({
                "data": []
            });
        })

        app.get("/v1/assets/:assetid/saved-versions", async (req, res) => {
            const assetid = parseInt(req.params.assetid);
            const game = await db.getGame(assetid);
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": [{
                    "assetId": game.gameid,
                    "assetVersionNumber": 1,
                    "creatorType": "User",
                    "creatorTargetId": game.creatorid,
                    "creatingUniverseId": null,
                    "created": db.unixToDate(game.created).toISOString(),
                    "isPublished": false
                }]
            });
        });

        app.patch("/v2/universes/:universeid/configuration", db.requireAuth, async (req, res) => {
            const isFriendsOnly = req.body.isFriendsOnly;
            const name = req.body.name;
            const description = req.body.description;
            const genre = req.body.genre;
            const playableDevices = req.body.playableDevices;
            const universeAvatarType = req.body.universeAvatarType;
            console.log(req.body);
            const game = await db.getGame(parseInt(req.params.universeid));
            if (!game) {
                res.status(404).json({
                    "Success": false,
                    "Error": "Game not found"
                });
                return;
            }
            if (req.user.userid != game.creatorid) {
                res.status(403).json({
                    "Success": false,
                    "Error": "Not authorized"
                });
                return;
            }
            if (universeAvatarType) {
                console.log(universeAvatarType);
                if (universeAvatarType != "MorphToR6" && universeAvatarType != "MorphToR15" && universeAvatarType != "PlayerChoice") {
                    res.status(400).json({
                        "Success": false,
                        "Error": "Invalid universeAvatarType"
                    });
                    return;
                }
                await db.setGameProperty(game.gameid, "universeAvatarType", universeAvatarType);
                return res.json({
                    "allowPrivateServers": false,
                    "privateServerPrice": null,
                    "optInRegions": [],
                    "id": game.gameid,
                    "name": name,
                    "description": description,
                    "universeAvatarType": universeAvatarType,
                    "universeAnimationType": "PlayerChoice",
                    "universeCollisionType": "OuterBox",
                    "universeJointPositioningType": "ArtistIntent",
                    "isArchived": false,
                    "isFriendsOnly": isFriendsOnly,
                    "genre": "All",
                    "playableDevices": ["Computer", "Phone", "Tablet"],
                    "isForSale": false,
                    "price": 0,
                    "universeAvatarAssetOverrides": [],
                    "universeAvatarMinScales": {
                        "height": 0.9,
                        "width": 0.7,
                        "head": 0.95,
                        "depth": 0.0,
                        "proportion": 0.0,
                        "bodyType": 0.0
                    },
                    "universeAvatarMaxScales": {
                        "height": 1.05,
                        "width": 1.0,
                        "head": 1.0,
                        "depth": 0.0,
                        "proportion": 1.0,
                        "bodyType": 1.0
                    },
                    "studioAccessToApisAllowed": game.allowstudioaccesstoapis,
                    "permissions": {
                        "IsThirdPartyTeleportAllowed": false,
                        "IsThirdPartyAssetAllowed": false,
                        "IsThirdPartyPurchaseAllowed": false
                    }
                });
            }
            if (!name) {
                res.status(400).json({
                    "Success": false,
                    "Error": "Missing name"
                });
                return;
            }
            if (name.length > 25) {
                res.status(400).json({
                    "Success": false,
                    "Error": "Name must be 25 characters or less"
                });
                return;
            }
            if (description.length > 500) {
                res.status(400).json({
                    "Success": false,
                    "Error": "Description must be 500 characters or less"
                });
                return;
            }
            // if (genre != "All" && genre != ""){

            // }
            await db.updateGameStudio(game.gameid, name, description, !isFriendsOnly, "All");
            res.json({
                "allowPrivateServers": false,
                "privateServerPrice": null,
                "optInRegions": [],
                "id": game.gameid,
                "name": name,
                "description": description,
                "universeAvatarType": game.universeAvatarType || "MorphToR6",
                "universeAnimationType": "PlayerChoice",
                "universeCollisionType": "OuterBox",
                "universeJointPositioningType": "ArtistIntent",
                "isArchived": false,
                "isFriendsOnly": isFriendsOnly,
                "genre": "All",
                "playableDevices": ["Computer", "Phone", "Tablet"],
                "isForSale": false,
                "price": 0,
                "universeAvatarAssetOverrides": [],
                "universeAvatarMinScales": {
                    "height": 0.9,
                    "width": 0.7,
                    "head": 0.95,
                    "depth": 0.0,
                    "proportion": 0.0,
                    "bodyType": 0.0
                },
                "universeAvatarMaxScales": {
                    "height": 1.05,
                    "width": 1.0,
                    "head": 1.0,
                    "depth": 0.0,
                    "proportion": 1.0,
                    "bodyType": 1.0
                },
                "studioAccessToApisAllowed": game.allowstudioaccesstoapis,
                "permissions": {
                    "IsThirdPartyTeleportAllowed": false,
                    "IsThirdPartyAssetAllowed": false,
                    "IsThirdPartyPurchaseAllowed": false
                }
            });
        });

        app.post("/v1/universes/:universeid/deactivate", (req, res) => {
            const universeid = parseInt(req.params.universeid);
            res.json({});
        });

        app.patch("/v1/universes/:universeid/teamcreate", (req, res) => {
            const universeid = parseInt(req.params.universeid);
            res.json({
                "isEnabled": true
            });
        });

        app.get("/v1/universes/:universeid/icon", (req, res) => {
            const universeid = parseInt(req.params.universeid);
            res.json({
                "imageId": null,
                "isApproved": true
            });
        });

        app.get("/v1/universes/:universeid/media", (req, res) => {
            const universeid = parseInt(req.params.universeid);
            res.json({});
        });

        app.get("/v1/universes/:universeid/permissions", db.requireAuth2, async (req, res) => {
            if (!req.user) {
                res.status(401).json({});
                return;
            }
            const universeid = parseInt(req.params.universeid);
            const game = await db.getGame(universeid);
            if (!game) {
                res.status(404).json({
                    "canManage": false,
                    "canCloudEdit": false
                });
                return;
            }
            if (req.user.userid != game.creatorid) {
                res.status(403).json({
                    "canManage": false,
                    "canCloudEdit": false
                });
                return;
            }
            res.json({
                "canManage": true,
                "canCloudEdit": true
            });
        });

        app.get("/v1/universes/:universeid/configuration/vip-servers", (req, res) => {
            res.json({
                "isEnabled": false,
                "price": null,
                "activeServersCount": 0,
                "activeSubscriptionsCount": 0
            });
        });

        app.get("/developerproducts/list", (req, res) => {
            res.json({
                "DeveloperProducts": [],
                "FinalPage": true,
                "PageSize": 50
            });
        });

        app.get("/v2/universes/:universeid/permissions", db.requireAuth2, async (req, res) => {
            if (!req.user) {
                res.status(401).json({});
                return;
            }
            const universeid = parseInt(req.params.universeid);
            const game = await db.getGame(universeid);
            if (!game) {
                res.status(404).json({});
                return;
            }
            if (req.user.userid != game.creatorid) {
                res.status(403).json();
                return;
            }
            res.json({
                "data": []
            });
        });

        app.get("/v1/universes/:universeId", async (req, res) => {
            const universeId = parseInt(req.params.universeId);
            const game = await db.getGame(universeId);
            if (!game) {
                res.status(404).json({
                    "errors": [{
                        "code": 1,
                        "message": "The universe is invalid.",
                        "userFacingMessage": "Something went wrong"
                    }]
                });
                return;
            }
            const creator = await db.getUser(game.creatorid);
            if (!creator || creator.banned || game.deleted) {
                res.status(404).json({
                    "errors": [{
                        "code": 1,
                        "message": "The universe is invalid.",
                        "userFacingMessage": "Something went wrong"
                    }]
                });
            }
            res.json({
                "id": game.gameid,
                "name": game.gamename,
                "description": "",
                "isArchived": false,
                "rootPlaceId": game.gameid,
                "isActive": false,
                "privacyType": game.isPublic ? "Public" : "Private",
                "creatorType": "User",
                "creatorTargetId": creator.userid,
                "creatorName": creator.username,
                "created": db.unixToDate(game.created).toISOString(),
                "updated": db.unixToDate(game.updated).toISOString()
            });
        });

        app.get("/v1/places/:placeid/teamcreate/active_session/members", db.requireAuth, (req, res) => {
            const placeid = parseInt(req.params.placeid);
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });

        app.get("/v1/universes/:universeid", db.requireAuth, async (req, res) => {
            const universeid = parseInt(req.params.universeid);
            const game = await db.getGame(universeid);
            if (!game) {
                res.status(404).json({
                    "canManage": false,
                    "canCloudEdit": false
                });
                return;
            }
            if (req.user.userid != game.creatorid) {
                res.json({
                    "canManage": false,
                    "canCloudEdit": false
                });
                return;
            }
            res.json({
                "canManage": true,
                "canCloudEdit": true
            });
        });

        app.get("/v2/universes/:placeid/configuration", db.requireAuth, async (req, res) => {
            const placeid = parseInt(req.params.placeid);
            const game = await db.getGame(placeid);
            if (game.creatorid != req.user.userid) {
                res.status(403).json({
                    "errors": [{
                        "code": 1,
                        "message": "You are not the creator of this universe.",
                        "userFacingMessage": "You are not the creator of this universe."
                    }]
                });
                return;
            }
            res.json({
                "allowPrivateServers": false,
                "privateServerPrice": null,
                "optInRegions": [],
                "id": game.gameid,
                "name": game.gamename,
                "description": game.description,
                "universeAvatarType": game.universeAvatarType || "MorphToR6",
                "universeAnimationType": "PlayerChoice",
                "universeCollisionType": "OuterBox",
                "universeJointPositioningType": "ArtistIntent",
                "isArchived": false,
                "isFriendsOnly": !game.isPublic,
                "genre": game.genre,
                "playableDevices": ["Computer", "Phone", "Tablet"],
                "isForSale": false,
                "price": 0,
                "universeAvatarAssetOverrides": [],
                "universeAvatarMinScales": {
                    "height": 0.9,
                    "width": 0.7,
                    "head": 0.95,
                    "depth": 0.0,
                    "proportion": 0.0,
                    "bodyType": 0.0
                },
                "universeAvatarMaxScales": {
                    "height": 1.05,
                    "width": 1.0,
                    "head": 1.0,
                    "depth": 0.0,
                    "proportion": 1.0,
                    "bodyType": 1.0
                },
                "studioAccessToApisAllowed": game.allowstudioaccesstoapis,
                "permissions": {
                    "IsThirdPartyTeleportAllowed": false,
                    "IsThirdPartyAssetAllowed": false,
                    "IsThirdPartyPurchaseAllowed": false
                }
            });
        });

        app.get("/v2/universes/:universeid/configuration", db.requireAuth, async (req, res) => {
            const universeid = parseInt(req.params.universeid);
            const game = await db.getGame(universeid);
            if (!game) {
                res.status(404).json({
                    "error": "Universe not found"
                });
                return;
            }
            /*
            if (game.creatorid != req.user.userid) {
                res.status(403).json({
                    "error": "You do not have permission to access this universe."
                });
                return;
            }
            */
            res.json({
                "allowPrivateServers": false,
                "privateServerPrice": 0,
                "optInRegions": [{
                    "region": "Unknown",
                    "status": "Unknown"
                }],
                "id": 0,
                "name": game.gamename,
                "description": game.description,
                "universeAvatarType": game.universeAvatarType || "MorphToR6",
                "universeAnimationType": "Standard",
                "universeCollisionType": "InnerBox",
                "universeJointPositioningType": "Standard",
                "isArchived": false,
                "isFriendsOnly": false,
                "genre": "All",
                "playableDevices": [
                    "Computer"
                ],
                "isForSale": false,
                "price": 0,
                "universeAvatarAssetOverrides": [{
                    "assetID": 0,
                    "assetTypeID": 0,
                    "isPlayerChoice": true
                }],
                "universeAvatarMinScales": {
                    "height": 0,
                    "width": 0,
                    "head": 0,
                    "depth": 0,
                    "proportion": 0,
                    "bodyType": 0
                },
                "universeAvatarMaxScales": {
                    "height": 0,
                    "width": 0,
                    "head": 0,
                    "depth": 0,
                    "proportion": 0,
                    "bodyType": 0
                },
                "studioAccessToApisAllowed": true,
                "permissions": {
                    "IsThirdPartyTeleportAllowed": true,
                    "IsThirdPartyAssetAllowed": true,
                    "IsThirdPartyPurchaseAllowed": true
                }
            });
        });

        app.get("/v1/user/1/is-admin-developer-console-enabled", (req, res) => {
            res.send("false");
        });

        app.get("/v1/user/:userid/canmanage/:gameid", async (req, res) => {
            const userid = parseInt(req.params.userid);
            const gameid = parseInt(req.params.gameid);
            const user = await db.getUser(userid);
            const game = await db.getGame(gameid);
            if ((!user || user.banned) || !game) {
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

        app.get("/v1/search/universes", db.requireAuth2, async (req, res) => {
            if (!req.user) {
                res.status(403).json({});
                return;
            }
            const q = req.query.q;
            let data = [];
            if (q == "creator:User") {
                const games = await db.getGamesByCreatorId(req.user.userid);
                for (let i = 0; i < games.length; i++) {
                    const game = games[i];
                    data.push({
                        "id": game.gameid,
                        "name": game.gamename,
                        "description": "",
                        "isArchived": false,
                        "rootPlaceId": game.gameid,
                        "isActive": true,
                        "privacyType": game.isPublic ? "Public" : "Private",
                        "creatorType": "User",
                        "creatorTargetId": game.creatorid,
                        "creatorName": req.user.username, // For now .-.
                        "created": db.unixToDate(game.created).toISOString(),
                        "updated": db.unixToDate(game.updated).toISOString()
                    });
                }
            }

            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": data
            });
        })
    }
}