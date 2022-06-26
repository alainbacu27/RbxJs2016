const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/games', async (req, res) => {
            const universeIds = req.query.universeIds.split(",");
            let out = {
                "data": []
            }
            if (universeIds.length > 100) return res.status(400).json(out);
            let hasIds = []
            for (let i = 0; i < universeIds.length; i++) {
                const universeId = universeIds[i];
                if (hasIds.includes(universeId)) return;
                hasIds.push(universeId);
                const game = await db.getGame(universeIds);
                if (!game) return;
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                    return;
                }
                const creatorname = (await db.getUser(game.creatorid)).username;
                out.data.push({
                    "id": game.gameid,
                    "rootPlaceId": game.gameid,
                    "name": game.gamename,
                    "description": game.description,
                    "sourceName": game.gamename,
                    "sourceDescription": game.description,
                    "creator": {
                        "id": game.creatorid,
                        "name": creatorname,
                        "type": "User",
                        "isRNVAccount": false
                    },
                    "price": null,
                    "allowedGearGenres": [],
                    "allowedGearCategories": [],
                    "isGenreEnforced": true,
                    "copyingAllowed": false,
                    "playing": 0,
                    "visits": game.visits,
                    "maxPlayers": 8,
                    "created": db.unixToDate(game.created).toISOString(),
                    "updated": db.unixToDate(game.updated).toISOString(),
                    "studioAccessToApisAllowed": false,
                    "createVipServersAllowed": false,
                    "universeAvatarType": "MorphToR6",
                    "genre": game.genre,
                    "isAllGenre": game.genre == "All",
                    "isFavoritedByUser": false,
                    "favoritedCount": game.favorites.length
                });
            }

            res.json(out);
        });

        app.get("/v1/games/multiget-playability-status", async (req, res) => {
            const universeIds = req.query.universeIds.split(",");
            let out = []
            for (let i = 0; i < universeIds.length; i++) {
                const universeId = parseInt(universeIds[i]);
                const game = await db.getGame(universeId);
                if (!game) {
                    continue;
                }
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                    return;
                }
                out.push({
                    "playabilityStatus": game.isPublic ? "Playable" : "Unplayable",
                    "isPlayable": game.isPublic,
                    "universeId": universeId
                });
            }

            res.json(out);
        });

        app.get("/v1/games/:gameid/servers/VIP", db.requireAuth, (req, res) => {
            const gameid = req.params.gameid;
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            })
        });

        app.get("/v1/games/recommendations/game/:universeid", (req, res) => {
            const maxRows = parseInt(req.query.maxRows);
            res.json({
                "games": [
                    /*
                                {
                                        "creatorId": 1,
                                        "creatorName": "TypicalType",
                                        "creatorType": "User",
                                        "totalUpVotes": 0,
                                        "totalDownVotes": 0,
                                        "universeId": 1,
                                        "name": "Test Game",
                                        "placeId": 1,
                                        "playerCount": 0,
                                        "imageToken": "T_277751860_87c0",
                                        "isSponsored": false,
                                        "nativeAdData": "",
                                        "isShowSponsoredLabel": false,
                                        "price": null,
                                        "analyticsIdentifier": null,
                                        "gameDescription": "A Testing Game.",
                                        "genre": ""
                                    }
                                */
                ],
                "nextPaginationKey": "startRowIndex_20,version_"
            });
        });

        app.get("/v2/games/:gameid/media", db.requireAuth, (req, res) => {
            const gameid = parseInt(req.params.gameid);
            res.json({
                "data": [{
                    "assetTypeId": 1,
                    "assetType": "Image",
                    "imageId": gameid,
                    "videoHash": null,
                    "videoTitle": null,
                    "approved": true
                }]
            })
        });

        app.get("/v1/games/:gameid/social-links/list", (req, res) => {
            res.json({
                "data": [
                    /*{
                                        "id": 1,
                                        "title": "Testing",
                                        "url": "https://discord.gg/AAAAAAA",
                                        "type": "Discord"
                                    }*/
                ]
            })
        });

        app.get("/v1/games/sorts", (req, res) => {
            const gameSortsContext = req.query.gameSortsContext; // GamesDefaultSorts
            res.json({
                "sorts": [{
                        "token": "T637894298113747805_Curated,N,H_2226",
                        "name": "Curated_96",
                        "displayName": "Official Games",
                        "gameSetTypeId": 23,
                        "gameSetTargetId": 96,
                        "timeOptionsAvailable": false,
                        "genreOptionsAvailable": true,
                        "numberOfRows": 1,
                        "numberOfGames": 0,
                        "isDefaultSort": false,
                        "contextUniverseId": null,
                        "contextCountryRegionId": 214,
                        "tokenExpiryInSeconds": 3600.0
                    }
                    /*{
                                        "token": "T637894298113747805_Curated,N,H_2226",
                                        "name": "Curated_96",
                                        "displayName": "Most Engaging",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 96,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_PersonalRecommendation,N,H_7a48",
                                        "name": "PersonalRecommendation",
                                        "displayName": "Recommended For You",
                                        "gameSetTypeId": 24,
                                        "gameSetTargetId": null,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_103",
                                        "displayName": "Up-and-Coming",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 103,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Sponsored,N,H_d311",
                                        "name": "Sponsored",
                                        "displayName": "Sponsored",
                                        "gameSetTypeId": 27,
                                        "gameSetTargetId": null,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_PopularInCountry,N,H_e358",
                                        "name": "PopularInCountry",
                                        "displayName": "Popular",
                                        "gameSetTypeId": 20,
                                        "gameSetTargetId": null,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_TopRated,N,H_e12d",
                                        "name": "TopRated",
                                        "displayName": "Top Rated",
                                        "gameSetTypeId": 11,
                                        "gameSetTargetId": null,
                                        "timeOptionsAvailable": true,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_71",
                                        "displayName": "Free Private Servers",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 71,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_67",
                                        "displayName": "Learn & Explore",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 67,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Featured,R,H_bd9a",
                                        "name": "Featured",
                                        "displayName": "Featured",
                                        "gameSetTypeId": 3,
                                        "gameSetTargetId": null,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": false,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,N,H_2226",
                                        "name": "Curated_94",
                                        "displayName": "Popular Among Premium",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 94,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_TopGrossing,N,H_1bbf",
                                        "name": "TopGrossing",
                                        "displayName": "Top Earning",
                                        "gameSetTypeId": 8,
                                        "gameSetTargetId": null,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,N,H_2226",
                                        "name": "Curated_81",
                                        "displayName": "People Love",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 81,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_64",
                                        "displayName": "Roleplay",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 64,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_63",
                                        "displayName": "Adventure",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 63,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_62",
                                        "displayName": "Fighting",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 62,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_56",
                                        "displayName": "Obby",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 56,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_58",
                                        "displayName": "Tycoon",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 58,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Curated,R,H_7cf4",
                                        "name": "Curated_57",
                                        "displayName": "Simulator",
                                        "gameSetTypeId": 23,
                                        "gameSetTargetId": 57,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }, {
                                        "token": "T637894298113747805_Popular,N,H_7bed",
                                        "name": "Popular",
                                        "displayName": "Popular Worldwide",
                                        "gameSetTypeId": 1,
                                        "gameSetTargetId": null,
                                        "timeOptionsAvailable": false,
                                        "genreOptionsAvailable": true,
                                        "numberOfRows": 1,
                                        "numberOfGames": 0,
                                        "isDefaultSort": false,
                                        "contextUniverseId": null,
                                        "contextCountryRegionId": 214,
                                        "tokenExpiryInSeconds": 3600.0
                                    }*/
                ],
                "timeFilters": [{
                    "token": "T637894298113747805_Now_8569",
                    "name": "Now",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_PastDay_6739",
                    "name": "PastDay",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_PastWeek_bef2",
                    "name": "PastWeek",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_PastMonth_ad3a",
                    "name": "PastMonth",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_AllTime_3dc6",
                    "name": "AllTime",
                    "tokenExpiryInSeconds": 3600.0
                }],
                "genreFilters": [{
                    "token": "T637894298113747805_1_5e4",
                    "name": "All",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_19_fae7",
                    "name": "Building",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_11_9865",
                    "name": "Horror",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_7_8c04",
                    "name": "Town and City",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_17_1185",
                    "name": "Military",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_15_a924",
                    "name": "Comedy",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_8_9b37",
                    "name": "Medieval",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_13_20c4",
                    "name": "Adventure",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_9_6766",
                    "name": "Sci-Fi",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113747805_12_dc95",
                    "name": "Naval",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113757845_20_2954",
                    "name": "FPS",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113757845_21_d505",
                    "name": "RPG",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113757845_14_5c51",
                    "name": "Sports",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113757845_10_6d10",
                    "name": "Fighting",
                    "tokenExpiryInSeconds": 3600.0
                }, {
                    "token": "T637894298113757845_16_e4f0",
                    "name": "Western",
                    "tokenExpiryInSeconds": 3600.0
                }],
                "gameFilters": [{
                    "token": "T637894298113757845_Any_776b",
                    "name": "Any",
                    "tokenExpiryInSeconds": 3600
                }, {
                    "token": "T637894298113757845_Classic_10a",
                    "name": "Classic",
                    "tokenExpiryInSeconds": 3600
                }],
                "pageContext": {
                    "pageId": "eb301893-c7ad-408a-b913-bd633105651e",
                    "isSeeAllPage": null
                },
                "gameSortStyle": null
            })
        });

        app.get("/v1/games/multiget-place-details", async (req, res) => {
            const placeIDs = req.query.placeIds.split(",");
            let out = []
            for (let i = 0; i < placeIDs.length; i++) {
                const placeid = parseInt(placeIDs[i]);
                const game = await db.getGame(placeid);
                if (!game) {
                    continue;
                }
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                    return;
                }
                out.push({
                    "placeId": game.gameid,
                    "name": game.gamename,
                    "description": game.description,
                    "sourceName": game.gamename,
                    "sourceDescription": game.description,
                    "url": "https://www.rbx2016.tk/games/" + game.gameid.toString() + "/" + db.filterText2(game.gamename).replace(" ", "-"),
                    "builder": creator.username,
                    "builderId": creator.userid,
                    "isPlayable": game.isPublic,
                    "reasonProhibited": "None",
                    "universeId": game.gameid,
                    "universeRootPlaceId": game.gameid,
                    "price": 0,
                    "imageToken": "T_1818_77f"
                })
            }
            res.json(out);
        });

        app.get("/v1/games/list", async (req, res) => {
            let games = []
            if (req.query.keyword) {
                games = await db.findGames(req.query.keyword);
            } else {
                games = await db.getPublicGames();
            }
            let games_json = []
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                    return;
                }
                games_json.push({
                    "creatorId": creator.userid,
                    "creatorName": creator.username,
                    "creatorType": "User",
                    "totalUpVotes": 0,
                    "totalDownVotes": 0,
                    "universeId": 1,
                    "name": game.gamename,
                    "placeId": game.gameid,
                    "playerCount": 0,
                    "imageToken": "T_1537690962_e738",
                    "isSponsored": false,
                    "nativeAdData": "",
                    "isShowSponsoredLabel": false,
                    "price": null,
                    "analyticsIdentifier": null,
                    "gameDescription": game.description,
                    "genre": "All"
                })
            }
            res.json({
                "games": games_json,
                "suggestedKeyword": null,
                "correctedKeyword": null,
                "filteredKeyword": null,
                "hasMoreRows": true,
                "nextPageExclusiveStartId": 15875759,
                "featuredSearchUniverseId": null,
                "emphasis": false,
                "cutOffIndex": null,
                "algorithm": "GameSearchUsingSimilarQueryService",
                "algorithmQueryType": "Bucketboost",
                "suggestionAlgorithm": "GameSuggestions_V2",
                "relatedGames": [],
                "esDebugInfo": null
            });

        });

        app.post("/v2.0/Refresh", db.requireAuth2, async (req, res) => {
            const apikey = req.query.apiKey;
            if (apikey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameId = req.query.gameId;
            const placeId = parseInt(req.query.placeId);
            const gameCapacity = parseInt(req.query.gameCapacity);
            const ipAddress = req.query.ipAddress;
            const port = parseInt(req.query.port);
            const fps = parseInt(req.query.fps);
            const heartbeatRate = parseInt(req.query.heartbeatRate);
            const ping = parseInt(req.query.ping);
            const physicsLoadAverage = parseInt(req.query.physicsLoadAverage);
            const physicsEnvironmentSpeed = parseInt(req.query.physicsEnvironmentSpeed);
            const gameTime = parseInt(req.query.gameTime);
            const universeId = parseInt(req.query.universeId);
            const MatchmakingContextId = req.query.MatchmakingContextId;
            const clientCount = parseInt(req.query.clientCount);
            const preferredPlayerCapacity = parseInt(req.query.preferredPlayerCapacity);
            const isCloudEdit = req.query.isCloudEdit == "true";
            const rccVersion = req.query.rccVersion;
            const eventSource = req.query.eventSource;
            const streamingEnabled = req.query.streamingEnabled == "true";
            const cpuUsage = parseInt(req.query.cpuUsage);
            const usedMemoryBytes = parseInt(req.query.usedMemoryBytes);
            const seqNum = parseInt(req.query.seqNum);
            if (!isCloudEdit) {
                await db.updateGameInternal(placeId, gameId, ipAddress, port, clientCount, rccVersion)
            } else {
                await db.updateGameInternalCloud(placeId, gameId, ipAddress, port, clientCount, rccVersion)
            }
            res.json({
                "status": 1,
                "error": null,
                "message": "Success"
            });
        });

        app.post("/api/v2.0/Refresh", db.requireAuth2, async (req, res) => {
            const apiKky = req.query.apiKey || (id0.length > 0 ? id0[0] : "");
            if (apikey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameId = req.query.gameId || (id0.length > 1 ? id0[1] : "");
            const placeId = parseInt(req.query.placeId) || (id0.length > 2 ? parseInt(id0[2]) : null);
            const gameCapacity = parseInt(req.query.gameCapacity) || (id0.length > 3 ? parseInt(id0[3]) : null);
            const ipAddress = req.query.ipAddress || (id0.length > 4 ? id0[4] : "");
            const port = parseInt(req.query.port) || (id0.length > 5 ? parseInt(id0[5]) : null);
            const clientCount = parseInt(req.query.clientCount) || (id0.length > 6 ? parseInt(id0[6]) : null);
            const isCloudEdit = req.query.isCloudEdit == "true" || (id0.length > 7 ? id0[7] == "true" : false);
            const rccVersion = req.query.rccVersion || (id0.length > 8 ? id0[8] : "Unknown");
            /*
            const fps = parseInt(req.query.fps);
            const heartbeatRate = parseInt(req.query.heartbeatRate);
            const ping = parseInt(req.query.ping);
            const physicsLoadAverage = parseInt(req.query.physicsLoadAverage);
            const physicsEnvironmentSpeed = parseInt(req.query.physicsEnvironmentSpeed);
            const gameTime = parseInt(req.query.gameTime);
            const universeId = parseInt(req.query.universeId);
            const MatchmakingContextId = req.query.MatchmakingContextId;
            const eventSource = req.query.eventSource;
            const streamingEnabled = req.query.streamingEnabled == "true";
            const preferredPlayerCapacity = parseInt(req.query.preferredPlayerCapacity);
            const cpuUsage = parseInt(req.query.cpuUsage);
            const usedMemoryBytes = parseInt(req.query.usedMemoryBytes);
            const seqNum = parseInt(req.query.seqNum);
            */
            if (!isCloudEdit) {
                await db.updateGameInternal(placeId, gameId, ipAddress, port, clientCount, rccVersion)
            } else {
                await db.updateGameInternalCloud(placeId, gameId, ipAddress, port, clientCount, rccVersion)
            }
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/api/v2.0/Refresh", db.requireAuth2, async (req, res) => {
            const id0 = req.query.apiKey.split("|");
            const apikey = (id0.length > 0 ? id0[0] : "");
            if (apikey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameId = req.query.gameId || (id0.length > 1 ? id0[1] : "");
            const placeId = parseInt(req.query.placeId) || (id0.length > 2 ? parseInt(id0[2]) : null);
            const gameCapacity = parseInt(req.query.gameCapacity) || (id0.length > 3 ? parseInt(id0[3]) : null);
            const ipAddress = req.query.ipAddress || (id0.length > 4 ? id0[4] : "");
            const port = parseInt(req.query.port) || (id0.length > 5 ? parseInt(id0[5]) : null);
            const clientCount = parseInt(req.query.clientCount) || (id0.length > 6 ? parseInt(id0[6]) : null);
            const isCloudEdit = req.query.isCloudEdit == "true" || (id0.length > 7 ? id0[7] == "true" : false);
            const rccVersion = req.query.rccVersion || (id0.length > 8 ? id0[8] : "Unknown");
            /*
            const fps = parseInt(req.query.fps);
            const heartbeatRate = parseInt(req.query.heartbeatRate);
            const ping = parseInt(req.query.ping);
            const physicsLoadAverage = parseInt(req.query.physicsLoadAverage);
            const physicsEnvironmentSpeed = parseInt(req.query.physicsEnvironmentSpeed);
            const gameTime = parseInt(req.query.gameTime);
            const universeId = parseInt(req.query.universeId);
            const MatchmakingContextId = req.query.MatchmakingContextId;
            const eventSource = req.query.eventSource;
            const streamingEnabled = req.query.streamingEnabled == "true";
            const preferredPlayerCapacity = parseInt(req.query.preferredPlayerCapacity);
            const cpuUsage = parseInt(req.query.cpuUsage);
            const usedMemoryBytes = parseInt(req.query.usedMemoryBytes);
            const seqNum = parseInt(req.query.seqNum);
            */
            if (!isCloudEdit) {
                await db.updateGameInternal(placeId, gameId, ipAddress, port, clientCount, rccVersion)
            } else {
                await db.updateGameInternalCloud(placeId, gameId, ipAddress, port, clientCount, rccVersion)
            }
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/Game/api/v2.0/Refresh", db.requireAuth2, async (req, res) => {
            const id0 = req.query.apiKey.split("|");
            const apikey = (id0.length > 0 ? id0[0] : "");
            if (apikey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameId = req.query.gameId || (id0.length > 1 ? id0[1] : "");
            const placeId = parseInt(req.query.placeId) || (id0.length > 2 ? parseInt(id0[2]) : null);
            const gameCapacity = parseInt(req.query.gameCapacity) || (id0.length > 3 ? parseInt(id0[3]) : null);
            const ipAddress = req.query.ipAddress || (id0.length > 4 ? id0[4] : "");
            const port = parseInt(req.query.port) || (id0.length > 5 ? parseInt(id0[5]) : null);
            const clientCount = parseInt(req.query.clientCount) || (id0.length > 6 ? parseInt(id0[6]) : null);
            const isCloudEdit = req.query.isCloudEdit == "true" || (id0.length > 7 ? id0[7] == "true" : false);
            const rccVersion = req.query.rccVersion || (id0.length > 8 ? id0[8] : "Unknown");
            /*
            const fps = parseInt(req.query.fps);
            const heartbeatRate = parseInt(req.query.heartbeatRate);
            const ping = parseInt(req.query.ping);
            const physicsLoadAverage = parseInt(req.query.physicsLoadAverage);
            const physicsEnvironmentSpeed = parseInt(req.query.physicsEnvironmentSpeed);
            const gameTime = parseInt(req.query.gameTime);
            const universeId = parseInt(req.query.universeId);
            const MatchmakingContextId = req.query.MatchmakingContextId;
            const eventSource = req.query.eventSource;
            const streamingEnabled = req.query.streamingEnabled == "true";
            const preferredPlayerCapacity = parseInt(req.query.preferredPlayerCapacity);
            const cpuUsage = parseInt(req.query.cpuUsage);
            const usedMemoryBytes = parseInt(req.query.usedMemoryBytes);
            const seqNum = parseInt(req.query.seqNum);
            */
            if (!isCloudEdit) {
                await db.updateGameInternal(placeId, gameId, ipAddress, port, clientCount, rccVersion)
            } else {
                await db.updateGameInternalCloud(placeId, gameId, ipAddress, port, clientCount, rccVersion)
            }
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/Game/api/v1/UserJoined", db.requireAuth2, async (req, res) => {
            const id0 = req.query.apiKey.split("|");
            const apikey = (id0.length > 0 ? id0[0] : "");
            if (apikey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameId = (id0.length > 1 ? parseInt(id0[1]) : null);
            const userId = (id0.length > 2 ? parseInt(id0[2]) : null);
            await db.userJoinedGame(userId, gameId);
            const user = await db.getUser(userId);
            let interval;
            interval = setInterval(async () => {
                if (user && user.playing != 0) {
                    await db.setUserProperty(user.userid, "lastOnline", db.getUnixTimestamp());
                } else {
                    clearInterval(interval);
                }
            }, 25000);
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/Game/ChatFilter.ashx", (req, res) => {
            res.send("False");
        });

        app.get("/Game/api/v1/UserLeft", db.requireAuth2, async (req, res) => {
            const id0 = req.query.apiKey.split("|");
            const apikey = (id0.length > 0 ? id0[0] : "");
            if (apikey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameId = (id0.length > 1 ? id0[1] : null);
            const userId = (id0.length > 2 ? id0[2] : null);
            await db.userLeftGame(userId, gameId);
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/Game/api/v1/UserJoinedTeamCreate", db.requireAuth2, async (req, res) => {
            const id0 = req.query.apiKey.split("|");
            const apikey = (id0.length > 0 ? id0[0] : "");
            if (apikey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameId = (id0.length > 1 ? parseInt(id0[1]) : null);
            const userId = (id0.length > 2 ? parseInt(id0[2]) : null);
            await db.userJoinedTeamCreate(userId, gameId);
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/Game/api/v1/UserLeftTeamCreate", db.requireAuth2, async (req, res) => {
            const id0 = req.query.apiKey.split("|");
            const apikey = (id0.length > 0 ? id0[0] : "");
            if (apikey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameId = (id0.length > 1 ? id0[1] : null);
            const userId = (id0.length > 2 ? id0[2] : null);
            await db.userLeftTeamCreate(userId, gameId);
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/v1/games/:gameid/social-links/list", (req, res) => {
            const gameid = parseInt(req.params.gameid);
            res.json({
                "data": []
            });
        });

        app.get("/Game/ClientPresence.ashx", db.requireAuth2, async (req, res) => {
            if (db.getSiteConfig().backend.presenceEnabled == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const placeid = parseInt(req.query.PlaceID);
            const gameid = req.query.GameID;
            const userid = parseInt(req.query.UserID);
            const disconnect = req.query.Disconnect == "true";
            if (!req.user || req.user.userid != userid) {
                res.status(401).send();
                return;
            }
            const game = await db.getGame(placeid);
            if (!game || !game.isPublic || game.port == 0) {
                res.status(403).send();
                return;
            }
            if (disconnect) {
                await db.setUserProperty(userid, "playing", 0);
            } else {
                await db.setUserProperty(userid, "playing", placeid);
            }
            res.send();
        });

        app.post("/api/v2/CreateOrUpdate", db.requireAuth2, async (req, res) => {
            const apiKey = req.query.apiKey;
            if (apiKey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const GameSessions = req.body.GameSessions; // TODO: Keep track of users thru this and make sure to put them in the correct presence.
            const placeId = parseInt(req.query.placeId);
            const gameID = req.query.gameID;
            const port = parseInt(req.query.port);

            const game = await db.getGame(placeId);
            if (game == null) {
                res.status(400).send()
                return;
            }
            if (game.lastHeartBeat != 0) {
                await db.setGameProperty(placeId, "port", port);
            }
            res.send();
        });

        app.get("/api/v1/Close", db.requireAuth2, async (req, res) => {
            const id0 = req.query.apiKey.split("|");
            const apikey = (id0.length > 0 ? id0[0] : "");
            if (apiKey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const placeId = parseInt(req.query.placeId) || (id0.length > 1 ? parseInt(id0[1]) : "");
            const gameID = req.query.gameID || (id0.length > 2 ? id0[2] : "");

            const game = await db.getGame(placeId);
            if (game == null) {
                res.status(400).send()
                return;
            }
            await db.setGameProperty(placeId, "port", 0);
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/Game/api/v1/Close", db.requireAuth2, async (req, res) => {
            let id0 = req.query.apiKey.split("|");
            const apiKey = (id0.length > 0 ? id0[0] : "");
            if (apiKey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const gameID = req.query.gameID || (id0.length > 1 ? id0[1] : "");
            const placeId = parseInt(req.query.placeId) || (id0.length > 2 ? parseInt(id0[2]) : null);

            const game = await db.getGame(placeId);
            if (game == null) {
                res.status(400).send()
                return;
            }
            await db.setGameProperty(placeId, "port", 0);
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/v1/games/:gameid/media", (req, res) => {
            res.json({
                "data": []
            });
        });

        app.get("/v1/games/:gameid/servers/Public", (req, res) => {
            const gameid = parseInt(req.params.gameid);
            const sortOrder = req.query.sortOrder || "Desc";
            const limit = parseInt(req.query.limit) || 10;
            const cursor = req.query.cursor || "";
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": [
                    /*
                               {
                                        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                                        "maxPlayers": 8,
                                        "playing": 4,
                                        "playerTokens": ["AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
                                        "players": [],
                                        "fps": 59.988716,
                                        "ping": 157
                                    } 
                                */
                ]
            });
        });

        app.get("/v1/games/2/servers/Friend", (req, res) => {
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": [
                    /*
                                {
                                        "id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                                        "maxPlayers": 12,
                                        "playing": 5,
                                        "playerTokens": ["AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
                                        "players": [{
                                            "playerToken": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
                                            "id": 1,
                                            "name": "Roblox",
                                            "displayName": "Roblox"
                                        }],
                                        "fps": 59.996601,
                                        "ping": 53
                                    }
                                */
                ]
            });
        });


    }
}