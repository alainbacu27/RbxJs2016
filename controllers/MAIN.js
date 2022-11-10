const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get("/", db.requireNonAuth, async (req, res) => {
            res.render("index", await db.getBlankRenderObject());
        });

        app.get("/games/getgamepassesinnerpartial", (req, res) => {
            const startIndex = parseInt(req.query.startIndex);
            const maxRows = parseInt(req.query.maxRows);
            const placeId = parseInt(req.query.placeId);
            res.send();
        });

        app.get("/account/signupredir", (req, res) => {
            res.redirect("/");
        })

        app.get("/info/roblox-badges", db.requireAuth, async (req, res) => {
            res.render("robloxbadges", await db.getRenderObject(req.user))
        });

        app.get("/users/friends", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("friends", await db.getRenderObject(req.user));
        });

        app.get("/search/users", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canSearchUsers == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("searchusers", await db.getRenderObject(req.user));
        });

        app.get("/search/users/metadata", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canSearchUsers == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            const keyword = req.query.keyword;
            res.json({
                "Keyword": keyword,
                "MaxRows": 12,
                "IsPhone": false,
                "IsTablet": false,
                "IsGuest": false,
                "FriendshipStatusValues": ["NoFriendship", "PendingOnOtherUser", "PendingOnCurrentUser", "Friends"],
                "CurrentUserId": req.user.userid,
                "InApp": false,
                "InAndroidApp": false,
                "IniOSApp": false,
                "KeywordMinLength": 3,
                "IsChatDisabledByPrivacySetting": false
            });
        });

        app.get("/my/messages", db.requireAuth, async (req, res) => {
            res.render("messages", await db.getRenderObject(req.user));
        });

        app.get("/authentication/is-logged-in", (req, res) => {
            res.send();
        })

        app.get("/crossdevicelogin/ConfirmCode", db.requireAuth, async (req, res) => {
            res.render("quicklogin", await db.getRenderObject(req.user));
        });

        app.get("/my/groups", db.requireAuth, async (req, res) => {
            res.render("groups", await db.getRenderObject(req.user));
        });

        app.get("/groups/create", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.groups.canCreateGroups == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("creategroup", await db.getRenderObject(req.user));
        });

        app.get("/search/groups", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.groups.groupsEnabled == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("groups", await db.getRenderObject(req.user));
        });

        app.get("/upgrades/robux", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.pages.robuxPurchasesVisible == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("robux", await db.getRenderObject(req.user));
        });

        app.get("/transactions", db.requireAuth, async (req, res) => {
            res.render("transactions", await db.getRenderObject(req.user));
        });

        app.get("/gamecards/redeem", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.giftcardsEnabled == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("redeem", await db.getRenderObject(req.user));
        });

        app.get("/giftcards-us", async (req, res) => {
            res.redirect("/giftcards?location=us")
        });

        app.get("/giftcards", async (req, res) => {
            if (db.getSiteConfig().shared.giftcardsEnabled == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("giftcards", await db.getBlankRenderObject());
        });

        app.get("/trades", db.requireAuth, async (req, res) => {
            res.render("trades", await db.getRenderObject(req.user));
        });

        app.get("/premium/membership", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.pages.premiumPurchasesVisible == false) {
                res.status(400).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("premium", await db.getRenderObject(req.user));
        });

        app.post("/games/shutdown-all-instances", (req, res) => {
            const placeId = parseInt(req.body.placeId);
            const replaceInstances = req.body.replaceInstances;
            res.status(501).send();
        });

        app.get("/search/users/results", async (req, res) => {
            const presenceEnabled = db.getSiteConfig().backend.presenceEnabled;
            const keyword = req.query.keyword;
            const maxRows = parseInt(req.query.maxRows);
            const startIndex = parseInt(req.query.startIndex);

            const users = await db.findUsers(keyword);
            let results = []
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                if (user.bannned)
                    continue;
                results.push({
                    "UserId": user.userid,
                    "Name": user.username,
                    "DisplayName": user.username,
                    "Blurb": user.description,
                    "PreviousUserNamesCsv": "",
                    "IsOnline": presenceEnabled ? (user.lastOnline || 0) > (db.getUnixTimestamp() - 60) : null,
                    "LastLocation": null,
                    "UserProfilePageUrl": "/users/" + user.userid.toString() + "/profile",
                    "LastSeenDate": presenceEnabled ? db.unixToDate((user.lastOnline || 0)).toISOString() : null,
                    "PrimaryGroup": null,
                    "PrimaryGroupUrl": null
                });
            }

            res.json({
                "Keyword": keyword,
                "StartIndex": startIndex,
                "MaxRows": maxRows,
                "TotalResults": results.length,
                "UserSearchResults": results.splice(startIndex, maxRows)
            });
        });

        app.get("/users/profile/robloxcollections-json/", (req, res) => {
            res.json({
                "CollectionsItems": [
                    /*
                                    {
                                        "Id": 1,
                                        "AssetSeoUrl": "https://www.roblox.com/catalog/1/",
                                        "Thumbnail": {
                                            "Final": true,
                                            "Url": "https://images.roblox.com/baseplate.png",
                                            "RetryUrl": null,
                                            "UserId": 0,
                                            "EndpointType": "Avatar"
                                        },
                                        "Name": "BASEPLATE",
                                        "FormatName": null,
                                        "Description": "The one and only. Available for a limited time only.",
                                        "AssetRestrictionIcon": {
                                            "TooltipText": null,
                                            "CssTag": null,
                                            "LoadAssetRestrictionIconCss": false,
                                            "HasTooltip": false
                                        },
                                        "HasPremiumBenefit": false
                                    }
                                */
                ]
            });
        });

        app.get("/users/:userid/profile", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canViewUsers == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const userid = parseInt(req.params.userid);
            const user = await db.getUser(userid);
            if (!user || user.banned) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const blocked = await db.areBlocked(req.user.userid, user.userid, true);

            const presenceType = (user.lastOnline || 0) > (db.getUnixTimestamp() - 60) ? (user.playing != 0 && user.playing != null) ? 2 : 1 : 0;

            res.render("profile", {
                ...(await db.getRenderObject(req.user)),
                auserid: user.userid,
                ausername: user.username,
                auserdesc: user.description,
                aUserIsPremium: user.isPremium,

                auserfriends: (await db.getFriends(user.userid)).length,
                auserfollowing: 0, // TODO
                auserfollowers: 0, // TODO
                arefriends: db.toString(await db.areFriends(req.user.userid, user.userid)),
                incommingfriendrequestpending: db.toString(await db.areFriendsPending(user.userid, req.user.userid)),
                maysendfriendinvation: db.toString(user.userid != req.user.userid && !blocked && !(await db.areFriends(req.user.userid, user.userid)) && !(await db.areFriendsPending(req.user.userid, user.userid))),
                friendrequestpending: db.toString(await db.areFriendsPending(req.user.userid, user.userid)),
                canfollow: db.toString(user.userid != req.user.userid && !blocked), // TODO
                canmessage: db.toString(user.userid != req.user.userid && !blocked), // TODO
                isfollowing: db.toString(false), // TODO
                canfollow: db.toString(false && !blocked), // TODO
                messagesdisabled: db.toString(false), // TODO
                canbefollowed: db.toString(false && !blocked), // TODO
                cantrade: db.toString(false && user.userid != req.user.userid && !blocked), // TODO
                blockvisible: db.toString(user.userid != req.user.userid), // TODO
                ismorevisible: db.toString(true), // TODO
                isviewblocked: db.toString(await db.areBlocked(req.user.userid, user.userid)), // TODO
                mayimpersonate: db.toString(user.userid == req.user.userid), // TODO
                mayupdatestatus: db.toString(user.userid == req.user.userid), // TODO

                playing: presenceType == 2,
                online: presenceType == 1,

                // Temporary
                gameid: 0,
                gamename: "",
                gamedesc: ""
            });
        });

        app.post("/userblock/blockuser", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const blockeeId = parseInt(req.body.blockeeId);
            const blocked = await db.block(req.user.userid, blockeeId);
            if (blocked) {
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

        app.post("/userblock/unblockuser", async (req, res) => {
            if (db.getSiteConfig().shared.users.canHaveFriends == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const blockeeId = parseInt(req.body.blockeeId);
            const unblocked = await db.unblock(req.user.userid, blockeeId);
            if (unblocked) {
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

        app.get("/user-sponsorship/1", async (req, res) => {
            res.send();
        });

        app.get("/user-sponsorship/2", async (req, res) => {
            res.send();
        });
        app.get("/user-sponsorship/3", async (req, res) => {
            res.send();
        });

        app.get("/v1/settings/application", (req, res) => {
            const applicationName = req.cookies.applicationName;
            res.json({
                "applicationSettings": {}
            });
        });

        app.get("/download", async (req, res) => {
            if (db.getSiteConfig().shared.CLIENT_DOWNLOAD_AVAIlABLE == false) {
                res.status(403).send("Forbidden");
                return;
            }
            res.render("download", await db.getBlankRenderObject());
        });

        app.get("/download/client", (req, res) => {
            res.redirect("/RobloxPlayerLauncher.exe");
        });

        app.post("/Login/Negotiate.ashx", async (req, res) => {
            if (typeof req.query.suggest === "undefined") {
                return res.status(400).json({});
            }
            const user = await db.findUserByToken(req.query.suggest);
            if (!user || user.banned) {
                return res.status(401).json({});
            }
            res.cookie('.ROBLOSECURITY', "delete", {
                maxAge: -1,
                path: "/",
                domain: ".roblox.com",
                httpOnly: true
            });
            res.cookie('.ROBLOSECURITY', user.cookie, {
                maxAge: 50 * 365 * 24 * 60 * 60 * 1000,
                path: "/",
                domain: ".roblox.com",
                httpOnly: true
            });
            res.json({});
        })

        app.get("/v1/autolocalization/games/:gameid", (req, res) => {
            const gameid = parseInt(req.params.gameid);
            res.send();
        });

        app.get("/playfab-universes-service/v1/rcc/playfab-title", async (req, res) => {
            const universeId = parseInt(req.query.universeId);
            const game = await db.getGame(universeId);
            if (!game) {
                res.status(404).json({
                    "error": "Game not found"
                });
                return;
            }
            const creator = await db.getUser(game.creatorid);
            if (!creator || creator.banned || game.deleted) {
                res.status(404).json({});
                return;
            }
            res.json({
                "JobSignature": "abc",
                "PlaceId": game.gameid,
                "GameId": game.gameid,
                "GameCode": game.gameid,
                "UniverseId": game.gameid,
                // "vipOwnerId": 1,
                "DatacenterId": 1,
                "PlaceFetchUrl": "http://www.roblox.com/v1/asset?id=1",
                "assetdelivery": "http://www.roblox.com/",
                "BaseUrl": "http://www.roblox.com/",
                "MatchmakingContextId": 1,
                "MachineAddress": "127.0.0.1",
                "CreatorId": game.creatorid,
                "CreatorType": "User",
                "PlaceVersion": 1,
                "GsmInterval": 10000,
                "MaxPlayers": 12,
                "MaxGameInstances": 1,
                // "ApiKey": db.getSiteConfig().PRIVATE.PRIVATE_API_KEY,
                "PreferredPlayerCapacity": 12,
                "Metadata": {
                    "MachineAddress": "127.0.0.1",
                    "GsmInterval": 60,
                    "MaxPlayers": 12,
                    "placeInformation": {
                        "placeId": game.gameid,
                        "placeVersionNumber": 1,
                        "gameInstanceId": "aaaa"
                    }
                }
            });
            res.send();
        });

        app.get("/login", db.requireNonAuth, async (req, res) => {
            res.render("login", await db.getBlankRenderObject());
        });

        app.post("/places/:placeid/update", db.requireAuth, async (req, res) => {
            const placeid = parseInt(req.params.placeid);
            const game = await db.getGame(placeid);
            if (game.creatorid != req.user.userid) {
                if (req.user) {
                    res.status(403).render("403", await db.getRenderObject(req.user));
                } else {
                    res.status(403).render("403", await db.getBlankRenderObject());
                }
                return;
            }
            const name = req.body.Name;
            const desc = req.body.Description;
            let genre = req.body.Genre;
            if (genre == "") genre = "All";
            const maxplayers = parseInt(req.body.NumberOfPlayersMax);
            if (maxplayers > 15) {
                if (req.user) {
                    res.status(400).render("400", await db.getRenderObject(req.user));
                } else {
                    res.status(400).render("400", await db.getBlankRenderObject());
                }
                return;
            }
            const access = req.body.Access;
            if (access != "Everyone" && access != "Friends") {
                if (req.user) {
                    res.status(400).render("400", await db.getRenderObject(req.user));
                } else {
                    res.status(400).render("400", await db.getBlankRenderObject());
                }
                return;
            }
            const isCopyingAlowed = req.body.IsCopyingAllowed == "true";
            const chattype = req.body.ChatType;
            if (chattype != "Classic" && chattype != "Bubble" && chattype != "Both") {
                if (req.user) {
                    res.status(400).render("400", await db.getRenderObject(req.user));
                } else {
                    res.status(400).render("400", await db.getBlankRenderObject());
                }
                return;
            }
            const allowplacetobecopiedingame = req.body.AllowPlaceToBeCopiedInGame == "true";
            const allowplacetobeupdatedingame = req.body.AllowPlaceToBeUpdatedInGame == "true";
            db.updatePlace(placeid, name, desc, genre, maxplayers, access, isCopyingAlowed, chattype)
            res.redirect(`/games/${placeid}`);
        });

        app.get("/places/version-history", db.requireAuth, async (req, res) => {
            const assetid = req.query.assetID;
            const page = req.query.page;
            res.render("versionhistory", await db.getBlankRenderObject());
        });

        app.get("/places/:placeid/update", db.requireAuth, async (req, res) => {
            const placeid = parseInt(req.params.placeid);
            const game = await db.getGame(placeid);
            if (game) {
                if (game.creatorid != req.user.userid) {
                    if (req.user) {
                        res.status(403).render("403", await db.getRenderObject(req.user));
                    } else {
                        res.status(403).render("403", await db.getBlankRenderObject());
                    }
                    return;
                }
                const creator = await db.getUser(game.creatorid);
                res.render("updateplace", {
                    ...(await db.getRenderObject(req.user)),
                    gameid: game.gameid,
                    gamename: game.gamename,
                    gamedesc: game.description,
                    creatorid: game.creatorid,
                    creatorname: creator.username,
                    gamegenre: game.genre,
                    maxPlayers: game.maxplayers,
                    everyonearg: game.access == "Everyone" ? "selected=\"selected\"" : "",
                    friendsarg: game.access == "Friends" ? "selected=\"selected\"" : "",
                    copiable: game.copiable ? "checked=\"checked\"" : "",
                    chattype: game.chattype
                });
            }
        });

        app.post("/universes/doconfigure", db.requireAuth, async (req, res) => {
            const gameid = parseInt(req.body.Id);
            const name = req.body.Name;
            const ispublic = req.body.IsPublic == "True";
            const allowstudioaccesstoapis = req.body.AllowStudioAccessToApis == "True";
            const game = await db.getGame(gameid);
            if (game == null) {
                res.redirect(`/universes/configure?id=${gameid}&isUpdateSuccess=False`);
                return;
            }
            if (game.creatorid != req.user.userid) {
                res.redirect(`/universes/configure?id=${gameid}&isUpdateSuccess=False`);
                return;
            }
            db.updateGame(gameid, name, allowstudioaccesstoapis, ispublic);
            res.redirect(`/universes/configure?id=${gameid}&isUpdateSuccess=True`);
        });

        app.get("/universes/configure", db.requireAuth, async (req, res) => {
            const gameid = parseInt(req.query.id);
            const game = await db.getGame(gameid);
            if (game === null) {
                res.redirect("/");
                return;
            }
            if (game.creatorid != req.user.userid) {
                if (req.user) {
                    res.status(403).render("403", await db.getRenderObject(req.user));
                } else {
                    res.status(403).render("403", await db.getBlankRenderObject());
                }
                return;
            }
            res.render("universeconfigure", {
                ...(await db.getRenderObject(req.user)),
                gameid: gameid,
                gamename: game.gamename,
                gamename2: db.filterText2(game.gamename).replaceAll(" ", "-"),
                public: game.isPublic,
                studioapiacessarg: game.allowstudioaccesstoapis ? "checked=\"checked\"" : "",
            });
        });

        app.post("/voting/vote", db.requireAuth, async (req, res) => {
            const assetid = parseInt(req.query.assetId);
            const vote = req.query.vote;
            const game = await db.getGame(assetid);
            // {"Success":false,"Message":null,"ModalType":"FloodCheckThresholdMet","Model":{"ShowVotes":true,"UpVotes":0,"DownVotes":0,"CanVote":false,"UserVote":true,"HasVoted":true,"ReasonForNotVoteable":"FloodCheckThresholdMet"}}
            if (game) {
                res.json({
                    "Success": false,
                    "Message": "Voting not enabled.",
                    "ModalType": "AssetNotVoteable",
                    "Model": {
                        "ShowVotes": true,
                        "UpVotes": 0,
                        "DownVotes": 0,
                        "CanVote": false,
                        "UserVote": true,
                        "HasVoted": true,
                        "ReasonForNotVoteable": "AssetNotVoteable"
                    }
                });
            } else {
                res.json({})
            }
        });

        app.post("/v2/favorite/toggle", db.requireAuth, (req, res) => {
            const assetId = parseInt(req.body.assetId);
            const game = db.getCatalogItem(assetId);
            if (game) {
                res.json({
                    "success": false,
                    "message": "Favorties not enabled."
                })
            } else {
                res.json({
                    "success": false,
                    "message": "Asset does not exist."
                })
            }
        });

        app.post("/favorite/toggle", db.requireAuth, async (req, res) => {
            const assetId = parseInt(req.body.assetId);
            const game = await db.getGame(assetId);
            if (game) {
                res.json({
                    "success": false,
                    "message": "Favorties not enabled."
                })
            } else {
                res.json({
                    "success": false,
                    "message": "Asset does not exist."
                })
            }
        });

        app.get("/games/votingservice/:gameid", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.votingServiceEnabled == false) {
                res.status(400).json({})
                return;
            }
            const gameid = parseInt(req.params.gameid);
            const game = await db.getGame(gameid);
            if (game) {
                res.render("votingservice", {
                    gameid: game.gameid,
                    likes: game.likes,
                    dislikes: game.dislikes
                });
            }
        });

        app.get("/develop", db.requireAuth, async (req, res) => {
            const View = req.query.View;
            const Page = req.query.Page;
            if ((Page != null && Page != "universes") || View != null) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const games = await db.getGamesByCreatorId(req.user.userid);
            const game_template = fs.readFileSync(__dirname + "/../views/template_mygame.ejs").toString();
            let games_html = "";
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                games_html += game_template.toString().replaceAll("<%= gameid %>", game.gameid).replaceAll("<%= gamename %>", game.gamename).replaceAll("<%= gamename2 %>", db.filterText2(game.gamename).replaceAll(" ", "-"));
            }
            res.render("develop", {
                ...(await db.getRenderObject(req.user)),
                games: games_html,
                tab: "MyCreations"
            });
        });

        app.get("/develop/:tab", db.requireAuth, async (req, res) => {
            const View = req.query.View;
            const Page = req.query.Page;
            const tab = req.params.tab;
            if ((Page != null && Page != "universes") || View != null) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const games = await db.getGamesByCreatorId(req.user.userid);
            const game_template = fs.readFileSync(__dirname + "/../views/template_mygame.ejs").toString();
            let games_html = "";
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                games_html += game_template.toString().replaceAll("<%= gameid %>", game.gameid).replaceAll("<%= gamename %>", game.gamename).replaceAll("<%= gamename2 %>", db.filterText2(game.gamename).replaceAll(" ", "-"));
            }
            let actual_tab = "MyCreations";
            switch (tab) {
                case null:
                    actual_tab = "MyCreations";
                    break;
                case "":
                    actual_tab = "MyCreations";
                    break;
                case "groups":
                    actual_tab = "GroupCreations";
                    break;
                case "library":
                    actual_tab = "Library";
                    break;
                case "developer-exchange":
                    actual_tab = "DevEx";
                    break;
                case "premium-payout":
                    actual_tab = "Payout";
                    break;
                default:
                    if (req.user) {
                        res.status(404).render("404", await db.getRenderObject(req.user));
                    } else {
                        res.status(404).render("404", await db.getBlankRenderObject());
                    }
                    return;
            }
            res.render("develop", {
                ...(await db.getRenderObject(req.user)),
                games: games_html,
                tab: actual_tab
            });
        });

        app.get("/my/avatar", db.requireAuth, async (req, res) => {
            res.render("avatar", await db.getRenderObject(req.user));
        });

        app.get("/library", db.requireAuth, async (req, res) => {
            const games = await db.getGamesByCreatorId(req.user.userid);
            const game_template = fs.readFileSync(__dirname + "/../views/template_mygame.ejs").toString();
            let games_html = "";
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                games_html += game_template.toString().replaceAll("<%= gameid %>", game.gameid).replaceAll("<%= gamename %>", game.gamename).replaceAll("<%= gamename2 %>", db.filterText2(game.gamename).replaceAll(" ", "-"));
            }
            res.render("develop", {
                ...(await db.getRenderObject(req.user)),
                games: games_html
            });
        });

        app.get("/build/universes", db.requireAuth, async (req, res) => {
            const games = await db.getGamesByCreatorId(req.user.userid);
            const game_template = fs.readFileSync(__dirname + "/../views/template_mygame.ejs").toString();
            let games_html = "";
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                games_html += game_template.toString().replaceAll("<%= gameid %>", game.gameid).replaceAll("<%= gamename %>", game.gamename).replaceAll("<%= gamename2 %>", db.filterText2(game.gamename).replaceAll(" ", "-"));
            }
            res.render("mygames", {
                ...(await db.getRenderObject(req.user)),
                games: games_html
            });
        });

        app.post("/login", async (req, res) => {
            res.send();
        });

        app.get("/places/:placeid/settings", (req, res) => {
            res.json({});
        });

        app.get("/install/GetInstallerCdns.ashx", async (req, res) => {
            res.json(db.getSiteConfig().shared.installerCdns);
        });

        app.get("/users/:userid/inventory", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.users.canViewInventory == false) {
                res.status(404).render("404", await db.getRenderObject(req.user));
                return;
            }
            const userid = parseInt(req.params.userid);
            const user = await db.getUser(userid);
            if (!user || user.banned) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            res.render("inventory", {
                ...(await db.getRenderObject(req.user)),
                auserid: user.userid,
                ausername: user.username,
                auserdesc: user.description,
                aUserIsPremium: user.isPremium,
            });
        });

        app.get("/users/inventory/list-json", (req, res) => {
            if (db.getSiteConfig().shared.users.canViewInventory == false) {
                res.status(404).json({});
                return;
            }
            const assetTypeId = parseInt(req.query.assetTypeId);
            const itemsPerPage = parseInt(req.query.itemsPerPage);
            const pageNumber = parseInt(req.query.pageNumber);
            const userId = parseInt(req.query.userId);

            const items = [
                /*
                        {
                                "AssetRestrictionIcon": {
                                    "TooltipText": null,
                                    "CssTag": null,
                                    "LoadAssetRestrictionIconCss": true,
                                    "HasTooltip": false
                                },
                                "Item": {
                                    "AssetId": 1,
                                    "UniverseId": null,
                                    "Name": "Test",
                                    "AbsoluteUrl": "https://www.roblox.com/catalog/1/Test",
                                    "AssetType": 8,
                                    "AssetTypeDisplayName": null,
                                    "AssetTypeFriendlyLabel": null,
                                    "Description": null,
                                    "Genres": null,
                                    "GearAttributes": null,
                                    "AssetCategory": 0,
                                    "CurrentVersionId": 0,
                                    "IsApproved": false,
                                    "LastUpdated": "\/Date(-62135575200000)\/",
                                    "LastUpdatedBy": null,
                                    "AudioUrl": null
                                },
                                "Creator": {
                                    "Id": 1,
                                    "Name": "Roblox",
                                    "Type": 1,
                                    "CreatorProfileLink": "https://www.roblox.com/users/1/profile/"
                                },
                                "Product": {
                                    "Id": 0,
                                    "PriceInRobux": null,
                                    "PremiumDiscountPercentage": null,
                                    "PremiumPriceInRobux": null,
                                    "IsForSale": false,
                                    "IsPublicDomain": true,
                                    "IsResellable": false,
                                    "IsLimited": false,
                                    "IsLimitedUnique": false,
                                    "SerialNumber": null,
                                    "IsRental": false,
                                    "RentalDurationInHours": 0,
                                    "BcRequirement": 0,
                                    "TotalPrivateSales": 0,
                                    "SellerId": 0,
                                    "SellerName": null,
                                    "LowestPrivateSaleUserAssetId": null,
                                    "IsXboxExclusiveItem": false,
                                    "OffsaleDeadline": null,
                                    "NoPriceText": "Free",
                                    "IsFree": true
                                },
                                "PrivateServer": null,
                                "Thumbnail": {
                                    "Final": true,
                                    "Url": "https://images.roblox.com/baseplate.png",
                                    "RetryUrl": "",
                                    "IsApproved": false
                                },
                                "UserItem": {
                                    "UserAsset": null,
                                    "IsItemOwned": false,
                                    "ItemOwnedCount": 0,
                                    "IsRentalExpired": false,
                                    "IsItemCurrentlyRented": false,
                                    "CanUserBuyItem": false,
                                    "RentalExpireTime": null,
                                    "CanUserRentItem": false
                                }
                            }
                        */
            ] // TODO: Implement this.

            res.json({
                "IsValid": true,
                "Data": {
                    "TotalItems": null,
                    "Start": 0,
                    "End": 14,
                    "Page": 1,
                    "nextPageCursor": null,
                    "previousPageCursor": null,
                    "ItemsPerPage": 100,
                    "PageType": "inventory",
                    "Items": items
                }
            });
        });

        app.get("/item-thumbnails", async (req, res) => {
            const jsoncallback = req.query.jsoncallback;
            const params = req.query.params;
            const assetid = parseInt(params.split("assetId\":\"")[1].split("\"")[0]);
            const item = await db.getCatalogItem(assetid);
            if (!item) {
                res.status(400).json({});
                return;
            }
            res.send(jsoncallback + "(" + JSON.stringify([{
                "id": item.itemid,
                "name": db.filterText2(item.itemname).replaceAll(" ", "-"),
                "url": "https://www.roblox.com/catalog/" + item.itemid.toString() + "/" + db.filterText2(item.itemname).replaceAll(" ", "-"),
                "thumbnailFinal": true,
                "thumbnailUrl": item.itemimage,
                "bcOverlayUrl": null,
                "limitedOverlayUrl": null,
                "deadlineOverlayUrl": null,
                "limitedAltText": null,
                "newOverlayUrl": null,
                "imageSize": "medium",
                "saleOverlayUrl": null,
                "iosOverlayUrl": null,
                "transparentBackground": false
            }]) + ")");
        });

        app.get("/home", db.requireAuth, async (req, res) => {
            res.render("home", await db.getRenderObject(req.user));
        });

        app.get("/discover", db.requireAuth, async (req, res) => {
            res.render("discover", await db.getRenderObject(req.user));
        });

        app.get("/games", db.requireAuth, async (req, res) => {
            res.redirect("/discover")
        });

        app.get("/catalog", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.pages.catalogEnabled == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            res.render("catalog", await db.getRenderObject(req.user));
        });

        app.get("/catalog/:itemid", db.requireAuth, async (req, res) => {
            const itemid = parseInt(req.params.itemid);
            const item = await db.getCatalogItem(itemid);
            if (!item) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            res.redirect(`/catalog/${item.itemid}/${db.filterText2(item.itemname).replaceAll(" ", "-")}`);
        });

        app.get("/catalog/:itemid/:itemname", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.pages.catalogEnabled == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const itemid = parseInt(req.params.itemid);
            const item = await db.getCatalogItem(itemid);
            if (!item) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const actualUrl = `/catalog/${item.itemid}/${db.filterText2(item.itemname).replaceAll(" ", "-")}`;
            if (req.url != actualUrl) {
                res.redirect(actualUrl);
                return;
            }
            const creator = await db.getUser(item.itemcreatorid);
            res.render("catalogitem", {
                ...(await db.getRenderObject(req.user)),
                itemname: item.itemname,
                itemname2: db.filterText2(item.itemname).replaceAll(" ", "-"),
                itemid: item.itemid,
                itemthumb: item.itemthumb,
                itemcreatorid: creator.userid,
                itemcreatorusername: creator.username,
                itemprice: item.itemprice,
                itemdesc: item.itemdescription,
                currenttime: db.formatAMPMFull(new Date()),
                itemfavorites: item.itemfavorites,

                owned: false, // TODO: Implement this.
            });
        });

        if (db.getSiteConfig().shared.ADMIN_AdminPanelEnabled == true) {
            app.get(db.getSiteConfig().shared.ADMIN_AdminPanelRoute, db.requireAuth, db.requireAdmin, async (req, res) => {
                res.render("admin", await db.getRenderObject(req.user));
            });
        }

        app.get("/not-approved", db.requireAuth, async (req, res) => {
            if (!req.user.banned) {
                res.redirect("/home");
                return;
            }
            res.render("banned", await db.getRenderObject(req.user));
        });

        app.get("/my/account", db.requireAuth, async (req, res) => {
            res.render("account", await db.getRenderObject(req.user));
        });

        app.get("/games/refer", async (req, res) => {
            const placeid = req.query.PlaceId;
            res.redirect(`/games/${placeid}/`);
        });

        app.get("/games/:gameid", db.requireAuth, async (req, res) => {
            const gameid = parseInt(req.params.gameid);
            const game = await db.getGame(gameid);
            if (!game) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            res.redirect("/games/" + game.gameid.toString() + "/" + db.filterText(game.gamename).replaceAll(" ", "-"));
        });

        app.get("/games/:gameid/:gamename", db.requireAuth, async (req, res) => {
            if (db.getSiteConfig().shared.games.canViewGames == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const gameid = parseInt(req.params.gameid);
            const game = await db.getGame(gameid);
            if (!game) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const actualUrl = `/games/${game.gameid}/${db.filterText2(game.gamename).replaceAll(" ", "-")}`;
            if (req.url != actualUrl) {
                res.redirect(actualUrl);
                return;
            }
            const creator = await db.getUser(game.creatorid);
            if (!creator || creator.banned || game.deleted) {
                res.status(404).json({});
                return;
            }
            res.render("game", {
                ...(await db.getRenderObject(req.user)),
                gameid: game.gameid,
                gamename: game.gamename,
                gamename2: game.gamename.replaceAll(" ", "-"),
                desc: game.description,
                serversize: 12,
                creatorname: creator.username,
                creatorid: game.creatorid,
                playing: game.playing,
                created: db.unixToDate(game.created).toISOString(),
                updated: db.unixToDate(game.updated).toISOString(),
                favorites: game.favorites,
                canManage: req.user.userid == creator.userid && db.getSiteConfig().shared.games.canManageGames,
                canCopy: (game.copiable || req.user.userid == creator.userid) && db.getSiteConfig().shared.games.canEditGames,
                canEdit: db.getSiteConfig().shared.games.canEditGames
            });
        });

        app.get("/places/:placeid/settings", async (req, res) => {
            if (db.getSiteConfig().shared.games.canManageGames == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const placeid = parseInt(req.params.placeid);
            const game = await db.getGame(placeid);
            if (req.user.userid != game.creatorid) {
                res.json({});
                return;
            }
            const creator = await db.getUser(game.creatorid);
            res.json({
                "DefaultFormatNameString": "{0}\u0027s Place Number: {1}",
                "IUser": null,
                "GameDetailsResources": {
                    "IsValueCreated": false,
                    "Value": {
                        "ActionShareGameToChatMetadata": {
                            "IsTranslated": true
                        },
                        "ActionShareGameToChat": "Share to chat",
                        "ActionSwapToSourceMetadata": {
                            "IsTranslated": true
                        },
                        "ActionSwapToSource": "Translate to Original Language",
                        "ActionSwapToTranslationMetadata": {
                            "IsTranslated": true
                        },
                        "DescriptionAllowCopyingDisclaimerMetadata": {
                            "IsTranslated": true
                        },
                        "HeadingDescriptionMetadata": {
                            "IsTranslated": true
                        },
                        "HeadingDescription": "Description",
                        "HeadingRecommendedGamesMetadata": {
                            "IsTranslated": true
                        },
                        "HeadingRecommendedGames": "Recommended Experiences",
                        "LabelAboutMetadata": {
                            "IsTranslated": true
                        },
                        "LabelAbout": "About",
                        "LabelAllowCopyingCheckboxMetadata": {
                            "IsTranslated": true
                        },
                        "LabelAllowCopyingCheckbox": "Allow Copying",
                        "LabelAllowedGearMetadata": {
                            "IsTranslated": true
                        },
                        "LabelAllowedGear": "Allowed Gear",
                        "LabelByMetadata": {
                            "IsTranslated": true
                        },
                        "LabelBy": "By",
                        "LabelByCreatorMetadata": {
                            "IsTranslated": true
                        },
                        "LabelCopyingTitleMetadata": {
                            "IsTranslated": true
                        },
                        "LabelCopyingTitle": "Copying",
                        "LabelCreatedMetadata": {
                            "IsTranslated": true
                        },
                        "LabelCreated": "Created",
                        "LabelExperimentalModeMetadata": {
                            "IsTranslated": true
                        },
                        "LabelExperimentalMode": "Experimental Mode",
                        "LabelExperimentalWarningMetadata": {
                            "IsTranslated": true
                        },
                        "LabelFavoritesMetadata": {
                            "IsTranslated": true
                        },
                        "LabelFavorites": "Favorites",
                        "LabelGameCopyLockedMetadata": {
                            "IsTranslated": true
                        },
                        "LabelGameCopyLocked": "This experience is copylocked",
                        "LabelGameDoesNotSellMetadata": {
                            "IsTranslated": true
                        },
                        "LabelGameDoesNotSell": "No passes available.",
                        "LabelGameRequiresBuildersClubMetadata": {
                            "IsTranslated": true
                        },
                        "LabelGameRequiresBuildersClub": "This Experience requires Builders Club",
                        "LabelGenreMetadata": {
                            "IsTranslated": true
                        },
                        "LabelGenre": "Genre",
                        "LabelLeaderboardsMetadata": {
                            "IsTranslated": true
                        },
                        "LabelLeaderboards": "Leaderboards",
                        "LabelMaxPlayersMetadata": {
                            "IsTranslated": true
                        },
                        "LabelMaxPlayers": "Server Size",
                        "LabelNoMetadata": {
                            "IsTranslated": true
                        },
                        "LabelNo": "No",
                        "LabelNoRunningGamesMetadata": {
                            "IsTranslated": true
                        },
                        "LabelNoRunningGames": "There are currently no running experiences.",
                        "LabelPlaceCopyingAllowedMetadata": {
                            "IsTranslated": true
                        },
                        "LabelPlaceCopyingAllowed": "This experience\u0027s source can be copied.",
                        "LabelPlayingMetadata": {
                            "IsTranslated": true
                        },
                        "LabelPlaying": "Active",
                        "LabelPrivateSourceMetadata": {
                            "IsTranslated": true
                        },
                        "LabelPrivateSource": "Private Source",
                        "LabelPrivateSourceDescriptionMetadata": {
                            "IsTranslated": true
                        },
                        "LabelPrivateSourceDescription": "This experience\u0027s source is private",
                        "LabelPublicPrivateSourceCheckBoxMetadata": {
                            "IsTranslated": true
                        },
                        "LabelPublicPrivateSourceCheckBox": "By leaving this checkbox checked, you are agreeing to allow every other user of Roblox the right to use (in various ways) the content you are now making available, as set out in the Terms. If you do not want to grant this right, please uncheck this box.",
                        "LabelPublicSourceMetadata": {
                            "IsTranslated": true
                        },
                        "LabelPublicSource": "Public Source",
                        "LabelPublicSourceDescriptionMetadata": {
                            "IsTranslated": true
                        },
                        "LabelPublicSourceDescription": "This experience\u0027s source is public",
                        "LabelReportAbuseMetadata": {
                            "IsTranslated": true
                        },
                        "LabelReportAbuse": "Report Abuse",
                        "LabelServersMetadata": {
                            "IsTranslated": true
                        },
                        "LabelServers": "Servers",
                        "LabelStoreMetadata": {
                            "IsTranslated": true
                        },
                        "LabelStore": "Store",
                        "LabelUpdatedMetadata": {
                            "IsTranslated": true
                        },
                        "LabelUpdated": "Updated",
                        "LabelVisitsMetadata": {
                            "IsTranslated": true
                        },
                        "LabelVisits": "Visits",
                        "LabelVoiceEnabledMetadata": {
                            "IsTranslated": true
                        },
                        "LabelVoiceEnabled": "Voice Enabled",
                        "LabelYesMetadata": {
                            "IsTranslated": true
                        },
                        "LabelYes": "Yes",
                        "MessageExternalLinkWarningMetadata": {
                            "IsTranslated": true
                        },
                        "MessageExternalLinkWarning": "By clicking \"continue\", you will be redirected to a website that is not owned or operated by Roblox. They may have different terms and privacy policies.",
                        "MessageLeavingRobloxTitleMetadata": {
                            "IsTranslated": true
                        },
                        "MessageLeavingRobloxTitle": "Leaving Roblox",
                        "State": 0
                    }
                },
                "ID": game.gameid,
                "DefaultUserName": creator.username,
                "DefaultPlaceNumber": (await db.getGamesByCreatorId(creator.userid)).length + 1,
                "Name": game.gamename,
                "Description": "",
                "DescriptionMaxCharacterCount": 1000,
                "Genre": "All",
                "Access": game.isPublic ? "Everyone" : "Friends",
                "IsPublic": game.isPublic,
                "DeviceSectionHeader": null,
                "SellGameAccessSectionHeader": null,
                "ShouldShowStartPlaceNameOrDescriptionUpdateAlsoUpdatesGames": true,
                "NumberOfMaxPlayersList": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
                "NumberOfPlayersList": [1, 2, 3, 4, 5],
                "IsAllGenresAllowed": false,
                "AllowedGearTypes": [{
                    "GearTypeDisplayName": "Melee",
                    "IsSelected": false,
                    "Category": 8
                }, {
                    "GearTypeDisplayName": "Power ups",
                    "IsSelected": false,
                    "Category": 11
                }, {
                    "GearTypeDisplayName": "Ranged",
                    "IsSelected": false,
                    "Category": 9
                }, {
                    "GearTypeDisplayName": "Navigation",
                    "IsSelected": false,
                    "Category": 12
                }, {
                    "GearTypeDisplayName": "Explosives",
                    "IsSelected": false,
                    "Category": 10
                }, {
                    "GearTypeDisplayName": "Musical",
                    "IsSelected": false,
                    "Category": 13
                }, {
                    "GearTypeDisplayName": "Social",
                    "IsSelected": false,
                    "Category": 14
                }, {
                    "GearTypeDisplayName": "Transport",
                    "IsSelected": false,
                    "Category": 22
                }, {
                    "GearTypeDisplayName": "Building",
                    "IsSelected": false,
                    "Category": 21
                }],
                "ChatType": "Both", // Classic
                "IsCopyingAllowed": game.copiable,
                "IsOldVersionAllowed": false,
                "ShouldForceRestart": false,
                "NumberOfPlayersMax": game.maxplayers,
                "NumberOfPlayersPreferred": game.maxplayers,
                "NumberOfCustomSocialSlots": 1,
                "SocialSlotType": 1,
                "SellGameAccess": false,
                "ShowAllowPrivateServers": true,
                "ArePrivateServersAllowed": false,
                "IsFreePrivateServer": false,
                "PrivateServersPrice": 100,
                "PrivateServerMinPrice": 10,
                "PrivateServerDefaultPrice": 100,
                "PrivateServersMarketplaceTaxRate": 0.3,
                "MarketplaceTaxRate": 0.3,
                "ActivePrivateServersCount": 0,
                "ActivePrivateServersSubscriptionsCount": 0,
                "PrivateServerConfigurationLink": "https://develop.roblox.com/v1/universes/configuration/vip-servers",
                "Price": 0,
                "PrivateServersHelpLink": "https://developer.roblox.com/en-us/articles/Creating-a-VIP-Server-on-Roblox",
                "OverridesDefaultAvatar": false,
                "UsePortraitMode": false,
                "BCSellRequirement": null,
                "BCSellReqirementMet": true,
                "SellingVisible": true,
                "Creator": {
                    "Name": creator.username,
                    "CreatorTargetId": creator.userid,
                    "CreatorType": 0
                },
                "PublishStep": 0,
                "MaxPublishStepReached": 0,
                "PlayableDevices": [{
                    "DeviceType": 1,
                    "Selected": true
                }, {
                    "DeviceType": 2,
                    "Selected": true
                }, {
                    "DeviceType": 3,
                    "Selected": true
                }, {
                    "DeviceType": 4,
                    "Selected": false
                }],
                "FinalPublishStep": 4,
                "VersionHistoryOnConfigurePageEnabled": true,
                "DefaultDevelopTabName": "Experience",
                "PortraitModeEnabled": false,
                "IsPremium": false,
                "IsEngagementPayoutEnabled": true,
                "EngagementPayoutUrl": "https://www.roblox.com/develop/premium-payout?ctx=gameDetail",
                "UserIsSellerBanned": false,
                "DeviceConfigurationEnabled": true,
                "ConsoleContentAgreementEnabled": true,
                "ShowDeveloperProducts": true,
                "CurrentUniverse": null,
                "AllowPlaceToBeCopiedInGame": false,
                "AllowPlaceToBeUpdatedInGame": false,
                "DeveloperProductUniverseId": 0,
                "TemplateID": null,
                "AccessTypesUsingPermissions": null,
                "AccessTypeSelectList": [{
                    "Disabled": false,
                    "Group": null,
                    "Selected": false,
                    "Text": "Everyone",
                    "Value": null
                }, {
                    "Disabled": false,
                    "Group": null,
                    "Selected": false,
                    "Text": "Friends",
                    "Value": null
                }],
                "UserAgreementModel": null,
                "MachineID": "WEB967",
                "BaseScripts": ["~/js/jquery/jquery-1.11.1.min.js", "~/js/jquery/jquery-migrate-1.2.1.min.js", "~/js/roblox.js", "~/js/jquery.tipsy.js", "~/js/GoogleAnalytics/GoogleAnalyticsEvents.js", "~/js/jquery.cookie.js", "~/js/common/forms.js", "~/js/jquery.simplemodal-1.3.5.js", "~/js/GenericConfirmation.js", "~/js/JavaScriptEndpoints.js"],
                "Title": "Roblox Studio",
                "Groups": null,
                "PrimaryGroupId": null,
                "MetaTagListViewModel": {
                    "FacebookMetaTags": null,
                    "TwitterMetaTags": null,
                    "StructuredDataTags": {
                        "StructuredDataContext": "http://schema.org",
                        "StructuredDataType": "Organization",
                        "StructuredDataName": "Roblox",
                        "RobloxUrl": "https://www.roblox.com/",
                        "RobloxLogoUrl": "https://images.roblox.com/cece570e37aa8f95a450ab0484a18d91",
                        "RobloxFacebookUrl": "https://www.facebook.com/roblox/",
                        "RobloxTwitterUrl": "https://twitter.com/roblox",
                        "RobloxLinkedInUrl": "https://www.linkedin.com/company/147977",
                        "RobloxInstagramUrl": "https://www.instagram.com/roblox/",
                        "RobloxYouTubeUrl": "https://www.youtube.com/user/roblox",
                        "RobloxGooglePlusUrl": "https://plus.google.com/+roblox",
                        "RobloxTwitchTvUrl": "https://www.twitch.tv/roblox",
                        "Title": "Roblox",
                        "Description": null,
                        "Images": null,
                        "ImageWidth": null,
                        "ImageHeight": null
                    },
                    "Description": "Roblox is a global platform that brings people together through play.",
                    "Keywords": "free games, online games, building games, virtual worlds, free mmo, gaming cloud, physics engine",
                    "NoIndexNoFollow": false,
                    "NoIndex": false,
                    "NoFollow": false,
                    "IncludeReferrerOriginTag": false,
                    "GoogleSiteVerificationTag": null,
                    "IncludeAppleAppIdTag": true,
                    "IncludeAngularContentSecurityPolicyTag": true
                },
                "JavascriptErrorTrackerViewModel": {
                    "InitializeParameter": "{ \u0027suppressConsoleError\u0027: true}"
                }
            });
        });

        app.post("/client-status/set", db.requireAuth, async (req, res) => {
            const status = req.query.status; // Unknown
            res.send("true")
        });

        app.get("/account/settings/account-country", async (req, res) => {
            res.json({
                "countryName": "USA",
                "localizedName": "USA",
                "countryId": 1,
                "success": true,
                "errorMessage": null
            });
        });

        app.get("/account/settings/account-restrictions", db.requireAuth, async (req, res) => {
            res.json({
                "IsEnabled": false
            });
        });

        app.get("/v1/gender", db.requireAuth, async (req, res) => {
            res.json({
                "gender": db.getSiteConfig().shared.users.gendersEnabled ? req.user.gender : 1
            });
        });

        app.get("/account/settings/private-server-invite-privacy", db.requireAuth, async (req, res) => {
            res.json({
                "PrivateServerInvitePrivacy": "Friends"
            });
        });

        app.get("/account/settings/follow-me-privacy", db.requireAuth, async (req, res) => {
            res.json({
                "FollowMePrivacy": "NoOne"
            });
        });

        app.get("/v1/trade-privacy", db.requireAuth, async (req, res) => {
            res.json({
                "tradePrivacy": "All"
            });
        });

        app.get("/v1/trade-value", db.requireAuth, async (req, res) => {
            res.json({
                "tradeValue": "None"
            });
        });

        app.get("/v1/inventory-privacy", db.requireAuth, async (req, res) => {
            res.json({
                "inventoryPrivacy": "AllUsers"
            });
        });

        app.get("/account/settings/app-chat-privacy", db.requireAuth, async (req, res) => {
            res.json({
                "AppChatPrivacy": "Friends"
            });
        });

        app.get("/account/settings/game-chat-privacy", db.requireAuth, async (req, res) => {
            res.json({
                "GameChatPrivacy": "AllUsers"
            });
        });

        app.get("/account/settings/private-message-privacy", db.requireAuth, async (req, res) => {
            res.json({
                "PrivateMessagePrivacy": "Friends"
            });
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

        app.get("/Error/Dmp.ashx", (req, res) => {
            res.send();
        });

        app.get("/Error/Grid.ashx", (req, res) => {
            res.send();
        });

        app.get("/universes/validate-place-join", (req, res) => {
            res.send("true")
        });

        app.get("/user-ads/create", db.requireAuth, async (req, res) => {
            const targetId = parseInt(req.query.targetId) || 0;
            const targetType = req.query.targetType;
            res.render("create_ad", {
                ...(await db.getRenderObject(req.user)),
                itemid: targetId
            });
        });

        app.get("/sponsored/experiences/:gameid/create", db.requireAuth, async (req, res) => {
            const gameid = parseInt(req.params.gameid);
            res.render("sponsor", {
                ...(await db.getRenderObject(req.user)),
                gameid: gameid
            });
        });

        app.get("/my/settings/json", db.requireAuth, async (req, res) => {
            res.json({
                "ChangeUsernameEnabled": true,
                "IsAdmin": req.user.isAdmin,
                "UserId": req.user.userid,
                "Name": req.user.username,
                "DisplayName": req.user.username,
                "IsEmailOnFile": req.user.emailverified,
                "IsEmailVerified": req.user.emailverified,
                "IsPhoneFeatureEnabled": false,
                "RobuxRemainingForUsernameChange": Math.max(0, 1000 - req.user.robux),
                "PreviousUserNames": "",
                "UseSuperSafePrivacyMode": false,
                "IsAppChatSettingEnabled": true,
                "IsGameChatSettingEnabled": true,
                "IsContentRatingsSettingEnabled": false,
                "IsParentalControlsTabEnabled": true,
                "IsParentalSpendControlsEnabled": true,
                "IsParentalScreentimeRestrictionsEnabled": false,
                "IsSetPasswordNotificationEnabled": false,
                "ChangePasswordRequiresTwoStepVerification": false,
                "ChangeEmailRequiresTwoStepVerification": false,
                "UserEmail": db.censorEmail(req.user.email),
                "UserEmailMasked": true,
                "UserEmailVerified": req.user.emailverified,
                "CanHideInventory": true,
                "CanTrade": false,
                "MissingParentEmail": false,
                "IsUpdateEmailSectionShown": true,
                "IsUnder13UpdateEmailMessageSectionShown": false,
                "IsUserConnectedToFacebook": false,
                "IsTwoStepToggleEnabled": false,
                "AgeBracket": 0,
                "UserAbove13": !(await db.isUserUnder13(req.user.userid)),
                "ClientIpAddress": "80.216.120.73",
                "AccountAgeInDays": 1105,
                "IsPremium": false,
                "IsBcRenewalMembership": false,
                "PremiumFeatureId": null,
                "HasCurrencyOperationError": false,
                "CurrencyOperationErrorMessage": null,
                "BlockedUsersModel": {
                    "BlockedUserIds": [],
                    "BlockedUsers": [],
                    "MaxBlockedUsers": 100,
                    "Total": 0,
                    "Page": 1
                },
                "Tab": null,
                "ChangePassword": false,
                "IsAccountPinEnabled": true,
                "IsAccountRestrictionsFeatureEnabled": true,
                "IsAccountRestrictionsSettingEnabled": false,
                "IsAccountSettingsSocialNetworksV2Enabled": false,
                "IsUiBootstrapModalV2Enabled": true,
                "IsDateTimeI18nPickerEnabled": true,
                "InApp": false,
                "MyAccountSecurityModel": {
                    "IsEmailSet": true,
                    "IsEmailVerified": true,
                    "IsTwoStepEnabled": false,
                    "ShowSignOutFromAllSessions": true,
                    "TwoStepVerificationViewModel": {
                        "UserId": req.user.userid,
                        "IsEnabled": false,
                        "CodeLength": 0,
                        "ValidCodeCharacters": null
                    }
                },
                "ApiProxyDomain": "https://api.roblox.com",
                "AccountSettingsApiDomain": "https://accountsettings.roblox.com",
                "AuthDomain": "https://auth.roblox.com",
                "IsDisconnectFacebookEnabled": true,
                "IsDisconnectXboxEnabled": true,
                "NotificationSettingsDomain": "https://notifications.roblox.com",
                "AllowedNotificationSourceTypes": ["Test", "FriendRequestReceived", "FriendRequestAccepted", "PartyInviteReceived", "PartyMemberJoined", "ChatNewMessage", "PrivateMessageReceived", "UserAddedToPrivateServerWhiteList", "ConversationUniverseChanged", "TeamCreateInvite", "GameUpdate", "DeveloperMetricsAvailable", "GroupJoinRequestAccepted", "Sendr"],
                "AllowedReceiverDestinationTypes": ["DesktopPush", "NotificationStream"],
                "BlacklistedNotificationSourceTypesForMobilePush": [],
                "MinimumChromeVersionForPushNotifications": 50,
                "PushNotificationsEnabledOnFirefox": true,
                "LocaleApiDomain": "https://locale.roblox.com",
                "HasValidPasswordSet": true,
                "FastTrackMember": null,
                "IsFastTrackAccessible": false,
                "HasFreeNameChange": false,
                "IsAgeDownEnabled": !(await db.isUserUnder13(req.user.userid)),
                "IsDisplayNamesEnabled": false,
                "IsBirthdateLocked": await db.isUserUnder13(req.user.userid)
            })
        });

        app.get("/users/profile/playergames-json", async (req, res) => {
            if (db.getSiteConfig().shared.games.canViewGames == false) {
                res.status(404).render("404", await db.getBlankRenderObject());
                return;
            }
            const userId = parseInt(req.query.userId);
            const user = await db.getUser(userId);
            if (!user || user.banned) {
                res.status(404).send();
                return;
            }

            let games_json = []
            const games = await db.getGamesByCreatorId(userId);
            for (let i = 0; i < games.length; i++) {
                const game = games[i];
                games_json.push({
                    "CreatorID": game.creatorid,
                    "CreatorName": user.username,
                    "CreatorAbsoluteUrl": "https://www.roblox.com/users/" + user.userid + "/profile/",
                    "Plays": 0,
                    "Price": 0,
                    "ProductID": 0,
                    "IsOwned": false,
                    "IsVotingEnabled": true,
                    "TotalUpVotes": 0,
                    "TotalDownVotes": 0,
                    "TotalBought": 0,
                    "UniverseID": game.gameid,
                    "HasErrorOcurred": false,
                    "Favorites": 0,
                    "Description": "",
                    "HideGameCardInfo": false,
                    "GameDetailReferralUrl": "https://www.roblox.com/games/refer?PlaceId=" + game.gameid + "\u0026Position=1\u0026PageType=Profile",
                    "Thumbnail": {
                        "Final": true,
                        "Url": "https://images.roblox.com/baseplate.png",
                        "RetryUrl": null,
                        "UserId": 0,
                        "EndpointType": "Avatar"
                    },
                    "UseDataSrc": false,
                    "IsAsyncThumbnailEnabled": false,
                    "GamePageResources": null,
                    "Name": "Basplate",
                    "PlaceID": game.gameid,
                    "PlayerCount": 0,
                    "ImageId": 0
                })
            }

            res.json({
                "Title": "Experiences",
                "Games": [],
                "ModalAssetViewType": 4,
                "ProfileLangResources": {
                    "ActionAcceptMetadata": {
                        "IsTranslated": true
                    },
                    "ActionAccept": "Accept",
                    "ActionAddFriendMetadata": {
                        "IsTranslated": true
                    },
                    "ActionAddFriend": "Add Friend",
                    "ActionBlockUserMetadata": {
                        "IsTranslated": true
                    },
                    "ActionBlockUser": "Block User",
                    "ActionCancelBlockUserMetadata": {
                        "IsTranslated": true
                    },
                    "ActionCancelBlockUser": "Cancel",
                    "ActionChatMetadata": {
                        "IsTranslated": true
                    },
                    "ActionChat": "Chat",
                    "ActionCloseMetadata": {
                        "IsTranslated": true
                    },
                    "ActionClose": "Close",
                    "ActionConfirmBlockUserMetadata": {
                        "IsTranslated": true
                    },
                    "ActionConfirmBlockUser": "Block",
                    "ActionConfirmUnblockUserMetadata": {
                        "IsTranslated": true
                    },
                    "ActionConfirmUnblockUser": "Unblock",
                    "ActionFavoritesMetadata": {
                        "IsTranslated": true
                    },
                    "ActionFavorites": "Favorites",
                    "ActionFollowMetadata": {
                        "IsTranslated": true
                    },
                    "ActionFollow": "Follow",
                    "ActionGridViewMetadata": {
                        "IsTranslated": true
                    },
                    "ActionGridView": "Grid View",
                    "ActionImpersonateUserMetadata": {
                        "IsTranslated": true
                    },
                    "ActionImpersonateUser": "Impersonate User",
                    "ActionInventoryMetadata": {
                        "IsTranslated": true
                    },
                    "ActionInventory": "Inventory",
                    "ActionJoinGameMetadata": {
                        "IsTranslated": true
                    },
                    "ActionJoinGame": "Join",
                    "ActionMessageMetadata": {
                        "IsTranslated": true
                    },
                    "ActionMessage": "Message",
                    "ActionPendingMetadata": {
                        "IsTranslated": true
                    },
                    "ActionPending": "Pending",
                    "ActionSaveMetadata": {
                        "IsTranslated": true
                    },
                    "ActionSave": "Save",
                    "ActionSeeAllMetadata": {
                        "IsTranslated": true
                    },
                    "ActionSeeAll": "See All",
                    "ActionSeeLessMetadata": {
                        "IsTranslated": true
                    },
                    "ActionSeeLess": "See Less",
                    "ActionSeeMoreMetadata": {
                        "IsTranslated": true
                    },
                    "ActionSeeMore": "See More",
                    "ActionSlideshowViewMetadata": {
                        "IsTranslated": true
                    },
                    "ActionSlideshowView": "Slideshow View",
                    "ActionTradeMetadata": {
                        "IsTranslated": true
                    },
                    "ActionTrade": "Trade",
                    "ActionTradeItemsMetadata": {
                        "IsTranslated": true
                    },
                    "ActionTradeItems": "Trade Items",
                    "ActionUnblockUserMetadata": {
                        "IsTranslated": true
                    },
                    "ActionUnblockUser": "Unblock User",
                    "ActionUnfollowMetadata": {
                        "IsTranslated": true
                    },
                    "ActionUnfollow": "Unfollow",
                    "ActionUnfriendMetadata": {
                        "IsTranslated": true
                    },
                    "ActionUnfriend": "Unfriend",
                    "ActionUpdateStatusMetadata": {
                        "IsTranslated": true
                    },
                    "ActionUpdateStatus": "Update Status",
                    "DescriptionAboutSuccessMetadata": {
                        "IsTranslated": true
                    },
                    "DescriptionAboutSuccess": "Successfully updated description.",
                    "DescriptionAboutWarningMetadata": {
                        "IsTranslated": true
                    },
                    "DescriptionAboutWarning": "Keep yourself safe, do not share personal details online.",
                    "DescriptionBlockUserFooterMetadata": {
                        "IsTranslated": true
                    },
                    "DescriptionBlockUserFooter": "When you\u0027ve blocked a user, neither of you can directly contact the other.",
                    "DescriptionBlockUserPromptMetadata": {
                        "IsTranslated": true
                    },
                    "DescriptionBlockUserPrompt": "Are you sure you want to block this user?",
                    "DescriptionChangeAliasMetadata": {
                        "IsTranslated": true
                    },
                    "DescriptionChangeAlias": "Only you can see this information",
                    "DescriptionErrorMetadata": {
                        "IsTranslated": true
                    },
                    "DescriptionError": "Unable to update description, please try again later.",
                    "DescriptionPlaceholderStatusMetadata": {
                        "IsTranslated": true
                    },
                    "DescriptionPlaceholderStatus": "Tell the Roblox community about what you like to make, build, and explore...",
                    "DescriptionUnblockUserPromptMetadata": {
                        "IsTranslated": true
                    },
                    "DescriptionUnblockUserPrompt": "Are you sure you want to unblock this user?",
                    "HeadingAboutTabMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingAboutTab": "About",
                    "HeadingBlockUserTitleMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingBlockUserTitle": "Warning",
                    "HeadingCollectionsMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingCollections": "Collections",
                    "HeadingCurrentlyWearingMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingCurrentlyWearing": "Currently Wearing",
                    "HeadingFavoriteGamesMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingFavoriteGames": "Favorites",
                    "HeadingFriendsMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingFriends": "Friends",
                    "HeadingFriendsNumMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingGamesMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingGames": "Experiences",
                    "HeadingGameTitleMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingGameTitle": "Experiences",
                    "HeadingGroupsMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingGroups": "Groups",
                    "HeadingPlayerAssetsBadgesMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingPlayerAssetsBadges": "Badges",
                    "HeadingPlayerAssetsClothingMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingPlayerAssetsClothing": "Clothing",
                    "HeadingPlayerAssetsModelsMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingPlayerAssetsModels": "Models",
                    "HeadingPlayerBadgeMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingPlayerBadge": "Badges",
                    "HeadingProfileMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingProfile": "Profile",
                    "HeadingProfileGroupsMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingProfileGroups": "Groups",
                    "HeadingRobloxBadgeMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingRobloxBadge": "Roblox Badges",
                    "HeadingStatisticsMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingStatistics": "Statistics",
                    "LabelAboutMetadata": {
                        "IsTranslated": true
                    },
                    "LabelAbout": "About",
                    "LabelAliasMetadata": {
                        "IsTranslated": true
                    },
                    "LabelAlias": "Alias",
                    "LabelBlockWarningBodyMetadata": {
                        "IsTranslated": true
                    },
                    "LabelBlockWarningBody": "Are you sure you want to block this user?",
                    "LabelBlockWarningConfirmMetadata": {
                        "IsTranslated": true
                    },
                    "LabelBlockWarningConfirm": "Block",
                    "LabelBlockWarningFooterMetadata": {
                        "IsTranslated": true
                    },
                    "LabelBlockWarningFooter": "When you\u0027ve blocked a user, neither of you can directly contact the other.",
                    "LabelCancelMetadata": {
                        "IsTranslated": true
                    },
                    "LabelCancel": "Cancel",
                    "LabelChangeAliasMetadata": {
                        "IsTranslated": true
                    },
                    "LabelChangeAlias": "Set Alias",
                    "LabelCreationsMetadata": {
                        "IsTranslated": true
                    },
                    "LabelCreations": "Creations",
                    "LabelFollowersMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFollowers": "Followers",
                    "LabelFollowingMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFollowing": "Following",
                    "LabelForumPostsMetadata": {
                        "IsTranslated": true
                    },
                    "LabelForumPosts": "Forum Posts",
                    "LabelFriendsMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFriends": "Friends",
                    "LabelGridViewMetadata": {
                        "IsTranslated": true
                    },
                    "LabelGridView": "Grid View",
                    "LabelJoinDateMetadata": {
                        "IsTranslated": true
                    },
                    "LabelJoinDate": "Join Date",
                    "LabelLoadMoreMetadata": {
                        "IsTranslated": true
                    },
                    "LabelLoadMore": "Load More",
                    "LabelMembersMetadata": {
                        "IsTranslated": true
                    },
                    "LabelMembers": "Members",
                    "LabelPastUsernameMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPastUsername": "Past Usernames",
                    "LabelPastUsernamesMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPastUsernames": "Previous usernames",
                    "LabelPlaceVisitsMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPlaceVisits": "Place Visits",
                    "LabelPlayingMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPlaying": "Active",
                    "LabelQuotationMetadata": {
                        "IsTranslated": true
                    },
                    "LabelRankMetadata": {
                        "IsTranslated": true
                    },
                    "LabelRank": "Rank",
                    "LabelReadMoreMetadata": {
                        "IsTranslated": true
                    },
                    "LabelReadMore": "Read More",
                    "LabelReportAbuseMetadata": {
                        "IsTranslated": true
                    },
                    "LabelReportAbuse": "Report Abuse",
                    "LabelShowLessMetadata": {
                        "IsTranslated": true
                    },
                    "LabelShowLess": "Show Less",
                    "LabelSlideshowViewMetadata": {
                        "IsTranslated": true
                    },
                    "LabelSlideshowView": "Slideshow View",
                    "LabelUnblockWarningBodyMetadata": {
                        "IsTranslated": true
                    },
                    "LabelUnblockWarningBody": "Are you sure you want to unblock this user?",
                    "LabelUnblockWarningConfirmMetadata": {
                        "IsTranslated": true
                    },
                    "LabelUnblockWarningConfirm": "Unblock",
                    "LabelVisitsMetadata": {
                        "IsTranslated": true
                    },
                    "LabelVisits": "Visits",
                    "LabelWarningTitleMetadata": {
                        "IsTranslated": true
                    },
                    "LabelWarningTitle": "Warning",
                    "MessageAcceptFriendRequestErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageAcceptFriendRequestError": "Unable to accept friend request.",
                    "MessageAliasHasErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageAliasHasError": "An error has occurred. Please try again later",
                    "MessageAliasIsModeratedMetadata": {
                        "IsTranslated": true
                    },
                    "MessageAliasIsModerated": "Please avoid using full names or offensive language.",
                    "MessageBlockErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageBlockError": "Unable to block user. You may have blocked too many people.",
                    "MessageBlockRequestErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageBlockRequestError": "Unable to block user.",
                    "MessageChangeStatusMetadata": {
                        "IsTranslated": true
                    },
                    "MessageChangeStatus": "What are you up to?",
                    "MessageErrorBlockLimitMetadata": {
                        "IsTranslated": true
                    },
                    "MessageErrorBlockLimit": "Operation failed! You may have blocked too many people.",
                    "MessageErrorGeneralMetadata": {
                        "IsTranslated": true
                    },
                    "MessageErrorGeneral": "Something went wrong. Please check back in a few minutes.",
                    "MessageFollowErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageFollowError": "Unable to follow user.",
                    "MessageImpersonateUserErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageImpersonateUserError": "Unable to impersonate user.",
                    "MessageNoCreationMetadata": {
                        "IsTranslated": true
                    },
                    "MessageRemoveFriendErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageRemoveFriendError": "Unable to unfriend user.",
                    "MessageSendFriendRequestErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageSendFriendRequestError": "Unable to send friend request.",
                    "MessageSharingMetadata": {
                        "IsTranslated": true
                    },
                    "MessageSharing": "Sharing...",
                    "MessageUnfollowErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageUnfollowError": "Unable to unfollow user.",
                    "MessageUpdateStatusErrorMetadata": {
                        "IsTranslated": true
                    },
                    "MessageUpdateStatusError": "Unable to update status.",
                    "ResponseTooManyAttemptsMetadata": {
                        "IsTranslated": true
                    },
                    "ResponseTooManyAttempts": "Too many attempts. Please try again later.",
                    "State": 0
                },
                "GamePageResources": {
                    "ActionDisableExperimentalModeMetadata": {
                        "IsTranslated": true
                    },
                    "ActionDisableExperimentalMode": "Disable",
                    "ActionSeeAllMetadata": {
                        "IsTranslated": true
                    },
                    "ActionSeeAll": "See All",
                    "HeadingExperimentalModeMetadata": {
                        "IsTranslated": true
                    },
                    "HeadingExperimentalMode": "Experimental Mode Experiences",
                    "LabelFilterExperimentalMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterExperimental": "Recommended",
                    "LabelFreeMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFree": "Free",
                    "LabelMoreResultsMetadata": {
                        "IsTranslated": true
                    },
                    "LabelMoreResults": "more results",
                    "LabelMoreResultsForMetadata": {
                        "IsTranslated": true
                    },
                    "LabelMoreResultsFor": "More Results For",
                    "LabelSponsoredMetadata": {
                        "IsTranslated": true
                    },
                    "LabelSponsored": "Sponsored",
                    "LabelSponsoredAdMetadata": {
                        "IsTranslated": true
                    },
                    "LabelSponsoredAd": "Sponsored Ad",
                    "LabelTopResultMetadata": {
                        "IsTranslated": true
                    },
                    "LabelTopResult": "Top Result",
                    "LabelCancelFieldMetadata": {
                        "IsTranslated": true
                    },
                    "LabelCancelField": "Cancel",
                    "LabelCreatorByMetadata": {
                        "IsTranslated": true
                    },
                    "LabelExperimentalMetadata": {
                        "IsTranslated": true
                    },
                    "LabelExperimental": "Experimental",
                    "LabelExperimentalHelpTextMetadata": {
                        "IsTranslated": true
                    },
                    "LabelExperimentalHelpText": "What\u0027s this?",
                    "LabelExperimentalModeMetadata": {
                        "IsTranslated": true
                    },
                    "LabelExperimentalMode": "Experimental Mode",
                    "LabelExperimentalResultsMetadata": {
                        "IsTranslated": true
                    },
                    "LabelExperimentalResults": "These results contain Experimental Mode experiences.",
                    "LabelFilterAllTimeMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterAllTime": "All Time",
                    "LabelFilterBecauseYouLikedMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterBuildersClubMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterBuildersClub": "Builders Club",
                    "LabelFilterByMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterBy": "Filter By",
                    "LabelFilterContestMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterContest": "Contest",
                    "LabelFilterContinuePlayingAndFavoritesMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterContinuePlayingAndFavorites": "Continue Playing + Favorites",
                    "LabelFilterDefaultMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterDefault": "Default",
                    "LabelFilterFeaturedMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterFeatured": "Featured",
                    "LabelFilterFriendActivityMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterFriendActivity": "Friend Activity",
                    "LabelFilterGenreMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterGenre": "Genre",
                    "LabelFilterMyFavoriteMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterMyFavorite": "My Favorite",
                    "LabelFilterMyFavoritesMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterMyFavorites": "My Favorites",
                    "LabelFilterMyLibraryMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterMyLibrary": "My Library",
                    "LabelFilterMyRecentMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterMyRecent": "My Recent",
                    "LabelFilterNowMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterNow": "Now",
                    "LabelFilterPastDayMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPastDay": "Past Day",
                    "LabelFilterPastWeekMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPastWeek": "Past Week",
                    "LabelFilterPersonalizedByLikedMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPersonalizedByLiked": "Because You Liked",
                    "LabelFilterPersonalServerMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPersonalServer": "Personal Server",
                    "LabelFilterPopularMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPopular": "Popular",
                    "LabelFilterPopularByCountryMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPopularInVrMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPopularInVr": "Popular in VR",
                    "LabelFilterPopularNearYouMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPopularNearYou": "Popular Near You",
                    "LabelFilterPopularWorldwideMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPopularWorldwide": "Popular Worldwide",
                    "LabelFilterPurchasedMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterPurchased": "Purchased",
                    "LabelFilterRecentlyPlayedMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterRecentlyPlayed": "Recently Played",
                    "LabelFilterRecommendedForYouMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterRecommendedForYou": "Recommended For You",
                    "LabelFilterTimeMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterTime": "Time",
                    "LabelFilterTopFavoriteMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterTopFavorite": "Top Favorite",
                    "LabelFilterTopGrossingMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterTopGrossing": "Top Earning",
                    "LabelFilterTopPaidMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterTopPaid": "Top Paid",
                    "LabelFilterTopRatedMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterTopRated": "Top Rated",
                    "LabelFilterTopRetainingMetadata": {
                        "IsTranslated": true
                    },
                    "LabelFilterTopRetaining": "Recommended",
                    "LabelNoSearchResultsMetadata": {
                        "IsTranslated": true
                    },
                    "LabelNoSearchResults": "No Results Found",
                    "LabelPlayingMultipleUsersMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPlayingOnePlusUsersMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPlayingOnePlusUsersWithCommaMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPlayingOneUserMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPlayingPhraseMetadata": {
                        "IsTranslated": true
                    },
                    "LabelPlayingTwoUsersFixedMetadata": {
                        "IsTranslated": true
                    },
                    "LabelRecommendedForYouMetadata": {
                        "IsTranslated": true
                    },
                    "LabelRecommendedForYou": "Recommended For You",
                    "LabelSearchFieldMetadata": {
                        "IsTranslated": true
                    },
                    "LabelSearchField": "Search",
                    "LabelSearchInsteadForMetadata": {
                        "IsTranslated": true
                    },
                    "LabelSearchInsteadFor": "Search instead for",
                    "LabelSearchYouMightMeanMetadata": {
                        "IsTranslated": true
                    },
                    "LabelSearchYouMightMean": "Did you mean:",
                    "LabelServerErrorMetadata": {
                        "IsTranslated": true
                    },
                    "LabelServerError": "An Error Occured",
                    "LabelShowingResultsForMetadata": {
                        "IsTranslated": true
                    },
                    "LabelShowingResultsFor": "Showing results for",
                    "State": 0
                }
            });
        });

        app.get("/account/settings/settings-groups", db.requireAuth, async (req, res) => {
            res.json([{
                "title": "Account Info",
                "url": "https://www.roblox.com/my/account#!/info",
                "suffix": "info"
            }, {
                "title": "Security",
                "url": "https://www.roblox.com/my/account#!/security",
                "suffix": "security"
            }, {
                "title": "Privacy",
                "url": "https://www.roblox.com/my/account#!/privacy",
                "suffix": "privacy"
            }, {
                "title": "Parental Controls",
                "url": "https://www.roblox.com/my/account#!/parental-controls",
                "suffix": "parental-controls"
            }, {
                "title": "Billing",
                "url": "https://www.roblox.com/my/account#!/billing",
                "suffix": "billing"
            }, {
                "title": "Notifications",
                "url": "https://www.roblox.com/my/account#!/notifications",
                "suffix": "notifications"
            }])
        });

        app.get("/game/report-stats", (req, res) => {
            res.send();
        });

        app.get("/usercheck/show-tos", (req, res) => {
            if (req.query.isLicensingTermsCheckNeeded == "True") {
                res.json({
                    "success": true
                });
                return;
            }
            res.json({
                "success": true
            });
        });
    }
}