const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const geoIP = require('offline-geo-from-ip');

module.exports = {
    init: (app, db) => {
        app.get("/captcha/v1/metadata", (req, res) => {
            res.json({
                "funCaptchaPublicKeys": {
                    "ACTION_TYPE_ASSET_COMMENT": "63E4117F-E727-42B4-6DAA-C8448E9B137F",
                    "ACTION_TYPE_CLOTHING_ASSET_UPLOAD": "63E4117F-E727-42B4-6DAA-C8448E9B137F",
                    "ACTION_TYPE_FOLLOW_USER": "63E4117F-E727-42B4-6DAA-C8448E9B137F",
                    "ACTION_TYPE_GROUP_JOIN": "63E4117F-E727-42B4-6DAA-C8448E9B137F",
                    "ACTION_TYPE_GROUP_WALL_POST": "63E4117F-E727-42B4-6DAA-C8448E9B137F",
                    "ACTION_TYPE_SUPPORT_REQUEST": "63E4117F-E727-42B4-6DAA-C8448E9B137F",
                    "ACTION_TYPE_WEB_GAMECARD_REDEMPTION": "1B154715-ACB4-2706-19ED-0DC7E3F7D855",
                    "ACTION_TYPE_WEB_LOGIN": "476068BF-9607-4799-B53D-966BE98E2B81",
                    "ACTION_TYPE_WEB_RESET_PASSWORD": "63E4117F-E727-42B4-6DAA-C8448E9B137F",
                    "ACTION_TYPE_WEB_SIGNUP": "A2A14B1D-1AF3-C791-9BBC-EE33CC7A0A6F"
                }
            })
        });

        app.get("/universal-app-configuration/v1/behaviors/content-rating-logo/content", (req, res) => {
            res.json({
                "displayBrazilRatingLogo": false,
                "displayItalyRatingLogo": false
            });
        });

        app.get("/account-security-service/v1/prompt-assignments", (req, res) => {
            const shouldReturnMetadata = req.query.shouldReturnMetadata;
            res.json([]);
        });

        app.get("/upsellCard/type", (req, res) => {
            const shouldReturnMetadata = req.query.shouldReturnMetadata;
            res.json({
                "upsellCardType": null
            });
        });

        app.get("/product-experimentation-platform/v1/projects/1/layers/Website.Login.CrossDeviceLogin.DisplayCode/values", (req, res) => {
            res.json({
                "alt_title": null,
                "alt_instruction": null,
                "alt_device_specific_instruction": null
            });
        });

        app.get("/product-experimentation-platform/v1/projects/1/layers/PlayerApp.HomePage.UX/values", (req, res) => {
            res.json({
                "AvatarHomepageRecommendationsRowNum": null,
                "IsDiscoveryApiEnabled": null,
                "IsGamesyApiEnabled": null,
                "SponsoredAdsHomepageRowNum": null
            });
        });

        app.get("/auth-token-service/v1/login/metadata", (req, res) => {
            res.json(db.getSiteConfig().frontend.authTokenServiceLoginMetadata);
        });

        app.get("/user-agreements/v1/agreements-resolution/web", (req, res) => {
            res.json([{
                "displayUrl": "https://en.help.rbx2016.nl/hc/en-us/articles/115004647846-Roblox-Terms-of-Use",
                "id": "848d8d8f-0e33-4176-bcd9-aa4e22ae7905",
                "agreementType": "TermsOfService",
                "clientType": "Web",
                "regulationType": "Global"
            }, {
                "displayUrl": "https://en.help.rbx2016.nl/hc/en-us/articles/115004630823-Roblox-Privacy-and-Cookie-Policy-",
                "id": "54d8a8f0-d9c8-4cf3-bd26-0cbf8af0bba3",
                "agreementType": "PrivacyPolicy",
                "clientType": "Web",
                "regulationType": "Global"
            }]);
        });

        app.get("/universal-app-configuration/v1/behaviors/cookie-policy/content", (req, res) => {
            res.json({
                "ShouldCallEvidon": false,
                "ShouldDisplayCookieBannerV3": true,
                "NonEssentialCookieList": ["RBXViralAcquisition", "RBXSource", "GoogleAnalytics"],
                "EssentialCookieList": [{
                    "cookieName": ".RBXIDCHECK",
                    "description": "Description.RBXIDCHECK"
                }, {
                    "cookieName": ".ROBLOSECURITY",
                    "description": "Description.ROBLOSECURITY"
                }, {
                    "cookieName": "GuestData",
                    "description": "Description.GuestData"
                }, {
                    "cookieName": "RBXEventTrackerV2",
                    "description": "Description.RBXEventTrackerV2"
                }, {
                    "cookieName": "RBXImageCache",
                    "description": "Description.RBXImageCache"
                }, {
                    "cookieName": "_cfduid",
                    "description": "Description._cfduid"
                }, {
                    "cookieName": "_help_center_session",
                    "description": "Description.HelpCenterSession"
                }, {
                    "cookieName": "_icl_visitor_lang_js",
                    "description": "Description.IclVisitorLangJs"
                }, {
                    "cookieName": "hasGmid",
                    "description": "Description.HasGmid"
                }, {
                    "cookieName": "rbx-ip2",
                    "description": "Description.RbxIp2"
                }, {
                    "cookieName": "wpml_browser_redirect_test",
                    "description": "Description.WpmlBrowserRedirectTest"
                }]
            });
        });

        app.get("/universes/get-universe-containing-place", (req, res) => {
            const placeId = parseInt(req.query.placeId);
            res.json({
                "UniverseId": placeId
            });
        });

        app.get("/product-experimentation-platform/v1/projects/1/layers/CrossDeviceLogin.ConfirmCode/values", (req, res) => {
            res.json({
                "ShouldNotClearCodeOnInvalidSubmission": null
            });
        });
        
        app.get("/universal-app-configuration/v1/behaviors/configure-group-ui/content", (req, res) => {
            res.json(db.getSiteConfig().frontend.groupUiConfig);
        });

        app.get("/product-experimentation-platform/v1/projects/1/layers/Social.Friends/values", (req, res) => {
            res.json({
                "friend_recommendation_source": null,
                "show_join_game_button_in_friend_card": null,
                "show_join_game_button_in_friend_card_desktop_only": null
            });
        });

        app.get("/universal-app-configuration/v1/behaviors/aliases/content", (req, res) => {
            res.json({
                "areAliasesEnabled": true
            });
        });

        app.post("/games-api/omni-recommendation", async (req, res) => {
            const games = await db.getPublicGames();
            let games_json1 = []
            let games_json2 = {}
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                const creator = await db.getUser(game.creatorid);
                if (creator.banned || creator.inviteKey == "" || game.deleted) {
                    continue;
                }
                games_json1.push({
                    "contentType": "Game",
                    "contentId": game.gameid
                })
                games_json2[game.gameid.toString()] = {
                    "totalUpVotes": 0,
                    "totalDownVotes": 0,
                    "universeId": 1,
                    "name": game.gamename,
                    "rootPlaceId": 1,
                    "description": null,
                    "playerCount": 0
                }
            }
            res.json({
                "pageType": "Home",
                "requestId": "13be2ebf-e974-4a98-b69d-6da4348dd30d",
                "sorts": [{
                        "topic": "Official Games",
                        "topicId": 100000000,
                        "treatmentType": "Carousel",
                        "officialList": games_json1
                    }
                    /*
                                    {
                                        "topic": "Continue",
                                        "topicId": 100000003,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Friend Activity",
                                        "topicId": 100000004,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Social Hangout",
                                        "topicId": 1110,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    },
                                {
                        "topic": "Recommended For You",
                        "topicId": 100000000,
                        "treatmentType": "Carousel",
                        "recommendationList": [{
                            "contentType": "Game",
                            "contentId": 1
                        }]
                    }
                                , {
                                        "topic": "Fighting & Battle",
                                        "topicId": 1201,
                                        "treatmentType": "Carousel",
                                        "recommendationList": [{
                                            "contentType": "Game",
                                            "contentId": 1
                                        }]
                                    }, {
                                        "topic": "Simulation",
                                        "topicId": 1104,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Action",
                                        "topicId": 1101,
                                        "treatmentType": "Carousel",
                                        "recommendationList": [{
                                            "contentType": "Game",
                                            "contentId": 1
                                        }]
                                    }, {
                                        "topic": "Free Admin",
                                        "topicId": 1233,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Clicker Simulator",
                                        "topicId": 1237,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Idle",
                                        "topicId": 1107,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Real World Roleplay",
                                        "topicId": 1216,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Platformer Obby",
                                        "topicId": 1235,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Favorites",
                                        "topicId": 100000001,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }
                                */
                ],
                "sortsRefreshInterval": 43200,
                "contentMetadata": {
                    "Game": games_json2,
                    "CatalogAsset": {},
                    "CatalogBundle": {},
                    "RecommendedFriend": {}
                }
            })
        });

        app.post("/discovery-api/omni-recommendation", async (req, res) => {
            const games = await db.getPublicGames();
            let games_json1 = [];
            let games_json2 = {};
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                const creator = await db.getUser(game.creatorid);
                if (creator.banned || creator.inviteKey == "" || game.deleted) {
                    continue;
                }
                games_json1.push({
                    "contentType": "Game",
                    "contentId": game.gameid
                })
                games_json2[game.gameid.toString()] = {
                    "totalUpVotes": 0,
                    "totalDownVotes": 0,
                    "universeId": 1,
                    "name": game.gamename,
                    "rootPlaceId": 1,
                    "description": null,
                    "playerCount": 0
                }
            }
            res.json({
                "pageType": "Home",
                "requestId": "13be2ebf-e974-4a98-b69d-6da4348dd30d",
                "sorts": [{
                        "topic": "Official Games",
                        "topicId": 100000000,
                        "treatmentType": "Carousel",
                        "officialList": games_json1
                    }
                    /*
                                    {
                                        "topic": "Continue",
                                        "topicId": 100000003,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Friend Activity",
                                        "topicId": 100000004,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Social Hangout",
                                        "topicId": 1110,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    },
                                {
                        "topic": "Recommended For You",
                        "topicId": 100000000,
                        "treatmentType": "Carousel",
                        "recommendationList": [{
                            "contentType": "Game",
                            "contentId": 1
                        }]
                    }
                                , {
                                        "topic": "Fighting & Battle",
                                        "topicId": 1201,
                                        "treatmentType": "Carousel",
                                        "recommendationList": [{
                                            "contentType": "Game",
                                            "contentId": 1
                                        }]
                                    }, {
                                        "topic": "Simulation",
                                        "topicId": 1104,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Action",
                                        "topicId": 1101,
                                        "treatmentType": "Carousel",
                                        "recommendationList": [{
                                            "contentType": "Game",
                                            "contentId": 1
                                        }]
                                    }, {
                                        "topic": "Free Admin",
                                        "topicId": 1233,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Clicker Simulator",
                                        "topicId": 1237,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Idle",
                                        "topicId": 1107,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Real World Roleplay",
                                        "topicId": 1216,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Platformer Obby",
                                        "topicId": 1235,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }, {
                                        "topic": "Favorites",
                                        "topicId": 100000001,
                                        "treatmentType": "Carousel",
                                        "recommendationList": []
                                    }
                                */
                ],
                "sortsRefreshInterval": 43200,
                "contentMetadata": {
                    "Game": games_json2,
                    "CatalogAsset": {},
                    "CatalogBundle": {},
                    "RecommendedFriend": {}
                }
            })
        });

        app.get("/universal-app-configuration/v1/behaviors/studio/content", (req, res) => {
            res.json({});
        })

        app.get("/studio-user-settings/plugin-permissions", (req, res) => {
            const permissionType = req.query.permissionType;
            const exclusiveStartId = req.query.exclusiveStartId;
            const pageSize = req.query.pageSize;
            res.json([]);
        })

        app.get("/studio-user-settings/v1/user/studiodata/InstalledPluginsAsJson_V001", db.requireAuth, (req, res) => {
            res.json({
                /*
                "1": {
                    "Name": "Plugin 1",
                    "AssetVersion": 1,
                    "Enabled": true,
                    "Moderated": false
                },
                */
            });
        });

        app.get("/autocomplete-avatar/v2/suggest", db.requireAuth, async (req, res) => {
            const limit = parseInt(req.query.limit);
            const prefix = req.query.prefix;

            let data = [];
            const items = await db.getCatalogItems(prefix, true);
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                data.push({
                    "Query": item.itemname,
                    "Score": 0,
                    "Meta": null
                });
            }

            res.json({
                "Args": {
                    "Prefix": prefix,
                    "Limit": limit,
                    "Algo": null
                },
                "Data": data
            });
        });

        app.post("/games-autocomplete/v1/request-suggestion", db.requireAuth, async (req, res) => {
            const prefix = req.body.prefix;
            const trendingSearchId = parseInt(req.body.trendingSearchId);
            const variationId = parseInt(req.body.variationId);
            let entries = []

            if (prefix.length < 1) {
                res.status(400).send();
                return;
            }

            const games = await db.findGames(prefix);
            const users = await db.findUsers(prefix);

            if (db.getSiteConfig().shared.games.canViewGames == true) {
                for (let i = 0; i < games.length; i++) {
                    const game = games[i];
                    entries.push({
                        "type": 1,
                        "score": 0,
                        "universeId": game.gameid,
                        "canonicalTitle": game.gamename,
                        "thumbnailUrl": "",
                        "searchQuery": game.gamename,
                        "trendingSearchStartDateTime": null
                    });
                }
            }

            if (db.getSiteConfig().shared.users.canViewUsers == true) {
                for (let i = 0; i < users.length; i++) {
                    const user = users[i];
                    if (user.bannned)
                        continue;
                    entries.push({
                        "type": 1,
                        "score": 0,
                        "universeId": 0,
                        "canonicalTitle": "",
                        "thumbnailUrl": "",
                        "searchQuery": user.username,
                        "trendingSearchStartDateTime": null
                    });
                }
            }

            res.json({
                "prefix": prefix,
                "algorithmName": "default_1610582400_t5",
                "entries": entries
            });
        });

        app.get("/universal-app-configuration/v1/behaviors/app-patch/content", (req, res) => {
            res.json({
                "SchemaVersion": "1",
                "CanaryUserIds": [],
                "CanaryPercentage": 0
            });
        });

        app.get("/universal-app-configuration/v1/behaviors/app-policy/content", (req, res) => {
            res.json(db.getSiteConfig().frontend.appPolicy);
        });

        app.patch("/studio-user-settings/v1/user/studiodata/CloudEditKey_placeId:gameid", (req, res) => {
            const gameid = parseInt(req.params.gameid);
            res.send();
        });

        app.post("/publish/v1/Scripts", db.requireAuth, (req, res) => {
            if (db.getSiteConfig().shared.games.teamCreateEnabled == false) {
                res.status(403).json({});
                return;
            }
            const file = req.body.file;
            const universeId = parseInt(req.body.universeId);
            const placeId = parseInt(req.body.placeId);
            const name = req.body.name;
            res.json({
                "assetId": placeId,
                "contentsHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "currentAssetVersionNumber": 1
            });
        });

        app.patch("/studio-user-settings/v1/user/studiodata/CloudEditKey_placeId0", (req, res) => {
            res.send();
        });

        app.post("/universe-history/commits", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.games.teamCreateEnabled == false) {
                res.status(403).json({});
                return;
            }
            const universeId = parseInt(req.body.universeId);
            const message = req.body.message;
            const game = await db.getGame(universeId);
            if (!game) {
                res.status(404).json({});
                return;
            }
            if (req.user.userid !== game.creatorid) {
                res.status(403).json({});
                return;
            }
            res.json({
                "commitGuid": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            })
        });

        app.post("/universe-history/places/:universeid/asset-mappings", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.games.teamCreateEnabled == false) {
                res.status(403).json({});
                return;
            }
            const instanceGuids = req.body.instanceGuids;
            const game = await db.getGame(req.params.universeid);
            if (!game) {
                res.status(404).json({});
                return;
            }
            if (req.user.userid !== game.creatorid) {
                res.status(403).json({});
                return;
            }
            res.json({
                "data": {},
                "assetMappings": {}
            });
        });

        app.get("/universal-app-configuration/v1/behaviors/robux-product-policy/content", (req, res) => {
            res.json({
                "allowedViews": ["RobuxPackage"]
            });
        });

        app.get("/toolbox-service/v1/Models", (req, res) => {
            res.json({
                "totalResults": 1000,
                "filteredKeyword": null,
                "searchDebugInfo": null,
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": [
                    /*
                    {
                        "id": 53326,
                        "itemType": "Asset"
                    }
                    */
                ]
            })
        });

        app.get("/studio-open-place/v1/openplace", async (req, res) => {
            if (db.getSiteConfig().shared.games.canEditGames == false){
                res.status(403).json({});
                return;
            }
            const placeId = parseInt(req.query.placeId);
            const game = await db.getGame(placeId);
            if (game == null) {
                res.status(404).send("Place ID [" + placeId.toString() + "] is either missing or detached.");
                return;
            }
            res.json({
                "universe": {
                    "Id": game.gameid,
                    "RootPlaceId": game.gameid,
                    "Name": game.gamename,
                    "Description": game.description,
                    "IsArchived": false,
                    "CreatorType": "User",
                    "CreatorTargetId": game.creatorid,
                    "PrivacyType": game.isPublic ? "Public" : "Private",
                    "Created": db.unixToDate(game.created).toISOString(),
                    "Updated": db.unixToDate(game.updated).toISOString()
                },
                "teamCreateEnabled": game.teamCreateEnabled,
                "place": {
                    "Creator": {
                        "CreatorType": "User",
                        "CreatorTargetId": game.creatorid
                    }
                }
            });
        });

        app.put("/packages-api/v1/places/:placeid/packages", (req, res) => {
            const placeid = parseInt(req.params.placeid);
            const assetIds = req.body.assetIds;
            res.json({
                "processed": [],
                "unprocessed": []
            });
        });

        app.get("/studio-user-settings/v1/user/studiodata/BetaFeatureInformation", db.requireAuth, (req, res) => {
            res.json({
                "betaFeaturesMap": {
                    "allBetaFeatures": {
                        "ACESaveRigWithAnimation": {
                            "date": "2022-05-29T22:37:57Z",
                            "enabled": false
                        },
                        "AccessoryTool3": {
                            "date": "2022-03-31T20:25:19Z",
                            "enabled": false
                        },
                        "AssetImporter": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "AudioVolumetricSounds": {
                            "date": "2022-03-31T20:25:19Z",
                            "enabled": false
                        },
                        "AutoSkinTransfer": {
                            "date": "2022-05-29T22:37:57Z",
                            "enabled": false
                        },
                        "CSGV3": {
                            "carryover": true,
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "CanvasGroup": {
                            "date": "2022-05-29T22:37:57Z",
                            "enabled": false
                        },
                        "CurveAnimations": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "DebuggerV2": {
                            "date": "2022-05-29T22:37:57Z",
                            "enabled": false
                        },
                        "FacialAnimation1": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "LuauNonStrictByDefault": {
                            "date": "2020-11-22T15:48:26Z",
                            "enabled": false
                        },
                        "MaterialService": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "ParallelLua": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "ParticleFlipbooks": {
                            "date": "2022-03-31T20:25:19Z",
                            "enabled": false
                        },
                        "PathfindingLinks2": {
                            "date": "2022-05-12T11:36:58Z",
                            "enabled": false
                        },
                        "TextChatServiceV1": {
                            "date": "2022-04-01T09:23:20Z",
                            "enabled": false
                        }
                    },
                    "enrolled": false,
                    "schemaVersion": 2
                }
            });
        });

        app.patch("/studio-user-settings/v1/user/studiodata/BetaFeatureInformation", db.requireAuth, (req, res) => {
            res.json({
                "betaFeaturesMap": {
                    "allBetaFeatures": {
                        "ACESaveRigWithAnimation": {
                            "date": "2022-05-29T22:37:57Z",
                            "enabled": false
                        },
                        "AccessoryTool3": {
                            "date": "2022-03-31T20:25:19Z",
                            "enabled": false
                        },
                        "AssetImporter": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "AudioVolumetricSounds": {
                            "date": "2022-03-31T20:25:19Z",
                            "enabled": false
                        },
                        "AutoSkinTransfer": {
                            "date": "2022-05-29T22:37:57Z",
                            "enabled": false
                        },
                        "CSGV3": {
                            "carryover": true,
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "CanvasGroup": {
                            "date": "2022-05-29T22:37:57Z",
                            "enabled": false
                        },
                        "CurveAnimations": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "DebuggerV2": {
                            "date": "2022-05-29T22:37:57Z",
                            "enabled": false
                        },
                        "FacialAnimation1": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "LuauNonStrictByDefault": {
                            "date": "2020-11-22T15:48:26Z",
                            "enabled": false
                        },
                        "MaterialService": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "ParallelLua": {
                            "date": "2021-12-23T10:54:37Z",
                            "enabled": false
                        },
                        "ParticleFlipbooks": {
                            "date": "2022-03-31T20:25:19Z",
                            "enabled": false
                        },
                        "PathfindingLinks2": {
                            "date": "2022-05-12T11:36:58Z",
                            "enabled": false
                        },
                        "TextChatServiceV1": {
                            "date": "2022-04-01T09:23:20Z",
                            "enabled": false
                        }
                    },
                    "enrolled": false,
                    "schemaVersion": 2
                }
            });
        });

        app.get("/universal-app-configuration/v1/behaviors/account-settings-ui/content", (req, res) => {
            res.json(db.getSiteConfig().frontend.accountSettingsUi);
        });

        app.get("/product-experimentation-platform/v1/projects/1/layers/AvatarMarketplace.UI/values", (req, res) => {
            res.json({
                "justinUiChangesCategoryChange": null,
                "justinUiChangesLeftSearchBar": null
            });
        });

        app.get("/product-experimentation-platform/v1/projects/1/layers/AvatarMarketplace.RecommendationsAndSearch.Web/values", (req, res) => {
            res.json({
                "increaseRecommendations120Mobile": null
            });
        });

        app.get("/v1/projects/1/layers/AvatarMarketplace.UI/values", (req, res) => {
            res.json({
                "infiniteScrollEnabled": null
            });
        });

        app.get("/product-experimentation-platform/v1/projects/1/layers/AvatarMarketplace.UI/values", (req, res) => {
            res.json({
                "areGenreFiltersShownForClothingCategories": null
            })
        });

        app.post("/product-experimentation-platform/v1/projects/1/values", (req, res) => {
            res.json({
                "projectId": 1,
                "version": 2013,
                "publishedAt": 1653617176,
                "layers": {
                    "Notification.Preferences": {
                        "experimentName": null,
                        "isAudienceSpecified": false,
                        "isAudienceMember": null,
                        "segment": -1,
                        "experimentVariant": "da39a3e",
                        "parameters": {},
                        "primaryUnit": null,
                        "primaryUnitValue": null,
                        "holdoutGroupExperimentName": null
                    }
                },
                "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.62 Safari/537.36",
                "platformType": "PC",
                "platformTypeId": 5
            });
        });

        app.get("/universal-app-configuration/v1/behaviors/intl-auth-compliance/content", (req, res) => {
            res.json({
                "screentimeType": null,
                "idVerificationType": null
            });
        });

        app.get("/universal-app-configuration/v1/behaviors/parent-screen-time-restrictions/content", (req, res) => {
            res.json({
                "enableParentalScreenTimeControls": false
            });
        });

        app.get("/universal-app-configuration/v1/behaviors/play-button-ui/content", (req, res) => {
            res.json({
                "playButtonOverlayWebFlag": false,
                "voiceOptInWebFlag": false
            });
        });

        app.get("/product-experimentation-platform/v1/projects/1/layers/Website.Logout.ContactMethodModal/values", (req, res) => {
            res.json({
                "alt_title": "Heading.CompleteSetupOnLogout",
                "alt_body": "Description.AddEmailTextStrongMessaging",
                "alt_primary_button_text": "Action.FinishSetup",
                "alt_secondary_button_text": "Action.LogoutWithRisk"
            });
        });
    }
}