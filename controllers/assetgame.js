const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
const get_ip = require('ipware')().get_ip;

module.exports = {
    init: (app, db) => {
        app.post("/game/validate-machine", (req, res) => {
            res.json({
                "success": true,
                "message": ""
            });
        });

        app.get("/Game/LuaWebService/HandleSocialRequest.ashx", async (req, res) => {
            const method = req.query.method;
            if (method == "IsInGroup") {
                const groupid = parseInt(req.query.groupid);
                const playerid = parseInt(req.query.playerid);
                const user = await db.getUser(playerid);
                if (user && groupid == 1200769) {
                    res.send("<Value Type=\"boolean\">" + db.toString(user.role == "mod" || user.role == "admin" || user.role == "owner") + "</Value>");
                } else {
                    res.send("<Value Type=\"boolean\">false</Value>");
                }
            } else if (method == "GetGroupRank") {
                const groupid = parseInt(req.query.groupid);
                const playerid = parseInt(req.query.playerid);
                const user = await db.getUser(playerid);
                if (groupid == 1200769 && (user && (user.role == "mod" || user.role == "admin" || user.role == "owner"))) {
                    res.send("<Value Type=\"integer\">100</Value>");
                } else {
                    res.send("<Value Type=\"integer\">0</Value>");
                }
            } else if (method == "IsFriendsWith") {
                const playerid = parseInt(req.query.playerid);
                const userid = parseInt(req.query.userid);
                const user = await db.getUser(playerid);
                if (!user || playerid == userid) {
                    res.send("<Value Type=\"boolean\">false</Value>");
                    return;
                }
                res.send("<Value Type=\"boolean\">" + db.toString(await db.areFriends(playerid, userid)) + "</Value>");
            } else {
                res.send("<Value Type=\"boolean\">false</Value>");
            }
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
            const ip = get_ip(req).clientIp;
            if (db.getSiteConfig().backend.assetdeliveryEnabled == false) {
                res.status(400).send();
                return;
            }

            let user = req.user;
            if (req.query.t) {
                user = await db.findUserByToken(req.query.t);
            }

            if (!req.query.id && !req.query.assetversionid) {
                res.status(404).send();
                return;
            }
            const id0 = req.query.id ? req.query.id.split("|") : req.query.assetversionid.split("|");
            let id = parseInt(id0[0]);
            const apiKey = req.query.apiKey || (id0.length > 1 ? id0[1] : "");

            if (id0[0].startsWith("r") && db.getSiteConfig().backend.robloxAssetsUsingR == true) {
                res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + parseInt(id0[0].substring(1)).toString());
                return;
            }

            /*
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
                    res.redirect("https://static.rbx2016.nl/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png");
                }
                return;
            }
            */

            const game = await db.getGame(id);
            if (game) {
                const creator = await db.getUser(game.creatorid);
                if ((ip == "127.0.0.1" || ip == "::1") || db.getPRIVATE_PLACE_KEYS().includes(apiKey) || (creator && !creator.banned && !game.deleted && ((user && user.userid == game.creatorid && user.inviteKey != "" && !user.banned)) || game.copiable)) {
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
                return res.status(401).send("Unauthorized");
            }

            const item1 = await db.getCatalogItem(id);
            if (item1){
                id = item1.internalAssetId;
            }

            const asset = await db.getAsset(id);
            if (asset && !asset.deleted && (asset.approvedBy != 0 || (user && (asset.creatorid == user.userid || (user.role == "mod" || user.role == "admin" || user.role == "owner"))))) {
                const bp = path.resolve(__dirname + "/../assets/") + path.sep;
                const fp = path.resolve(bp + id.toString() + ".asset");
                if (!fp.startsWith(bp)) {
                    res.status(403).send("Forbidden");
                    return;
                }
                if (fs.existsSync(fp)) {
                    res.download(fp, "Download");
                } else if (db.getSiteConfig().backend.fallbackToRobloxAssets == true) {
                    res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + id);
                    // res.sendStatus(404);
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
                } else if (db.getSiteConfig().backend.fallbackToRobloxAssets == true) {
                    res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + id);
                    // res.sendStatus(404);
                }
            }
        });

        app.get("/Game/edit.ashx", db.requireAuth2, async (req, res) => {
            const ip = get_ip(req).clientIp;
            let user = req.user;
            if (!user && typeof db.pendingStudioAuthentications[ip] == "object" && db.pendingStudioAuthentications[ip].length > 0) {
                while (db.pendingStudioAuthentications[ip].length > 0 && !user) {
                    const cookieObject = db.pendingStudioAuthentications[ip].shift();
                    if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                        // return res.sendStatus(403);
                    } else {
                        user = await db.findUserByCookie(cookieObject[1]);
                    }
                }
            }
            /*
            if (!user) {
                return res.sendStatus(403);
            }
            */
            if (user) {
                if (typeof db.pendingStudioAuthentications[ip] == "object") {
                    if (!db.pendingStudioAuthentications[ip].includes(ip)) {
                        db.pendingStudioAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                    }
                } else {
                    db.pendingStudioAuthentications[ip] = [
                        [db.getUnixTimestamp(), user.cookie]
                    ];
                }
            }
            const placeId = parseInt(req.query.placeId) || parseInt(req.query.PlaceID);
            const upload = parseInt(req.query.upload) == 1;
            const testMode = req.query.testMode == "true";
            const game = await db.getGame(placeId);
            if (!game) {
                res.sendStatus(404);
                return;
            }
            let script = ``;
            if (!game.teamCreateEnabled) {
                let token2 = "";
                if (user) {
                    token2 = `&t=${await db.generateUserTokenByCookie(user.cookie)}`
                }
                script = `
                -- Prepended to Edit.lua and Visit.lua and Studio.lua--
                
                pcall(function() game:SetPlaceID(${game.gameid}) end)
                pcall(function() game:SetUniverseId(${game.gameid}) end)
                pcall(function() game:GetService("StudioService"):SetDocumentDisplayName("${game.gamename}") end)
                pcall(function() game.Name = "${game.gamename}" end)
                
                visit = game:GetService("Visit")
                
                local message = Instance.new("Message")
                message.Parent = workspace
                message.archivable = false
                
                game:GetService("ContentProvider"):SetThreadPool(16)
                pcall(function() game:GetService("InsertService"):SetFreeModelUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?type=fm&q=%s&pg=%d&rs=%d") end) -- Used for free model search (insert tool)
                pcall(function() game:GetService("InsertService"):SetFreeDecalUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?type=fd&q=%s&pg=%d&rs=%d") end) -- Used for free decal search (insert tool)
                
                settings().Diagnostics:LegacyScriptMode()
                
                game:GetService("InsertService"):SetBaseSetsUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
                game:GetService("InsertService"):SetUserSetsUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
                game:GetService("InsertService"):SetCollectionUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?sid=%d")
                game:GetService("InsertService"):SetAssetUrl("https://www.rbx2016.nl/Asset/?id=%d")
                game:GetService("InsertService"):SetAssetVersionUrl("https://www.rbx2016.nl/Asset/?assetversionid=%d")
                
                -- TODO: move this to a text file to be included with other scripts
                pcall(function() game:GetService("SocialService"):SetFriendUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsFriendsWith&playerid=%d&userid=%d") end)
                pcall(function() game:GetService("SocialService"):SetBestFriendUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsBestFriendsWith&playerid=%d&userid=%d") end)
                pcall(function() game:GetService("SocialService"):SetGroupUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsInGroup&playerid=%d&groupid=%d") end)
                pcall(function() game:GetService("SocialService"):SetGroupRankUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=%d&groupid=%d") end)
                pcall(function() game:GetService("SocialService"):SetGroupRoleUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=%d&groupid=%d") end)
                pcall(function() game:GetService("GamePassService"):SetPlayerHasPassUrl("https://api.rbx2016.nl/Game/GamePass/GamePassHandler.ashx?Action=HasPass&UserID=%d&PassID=%d") end)
                pcall(function() game:GetService("MarketplaceService"):SetProductInfoUrl("https://api.rbx2016.nl/marketplace/productinfo?assetId=%d") end)
                --pcall(function() game:GetService("MarketplaceService"):SetDevProductInfoUrl("https://api.rbx2016.nl/marketplace/productDetails?productId=%d") end)
                pcall(function() game:GetService("MarketplaceService"):SetPlayerOwnsAssetUrl("https://api.rbx2016.nl/ownership/hasasset?userId=%d&assetId=%d") end)
                pcall(function() game:SetCreatorID(${game.creatorid}, Enum.CreatorType.User) end)
                
                pcall(function() game:SetScreenshotInfo("") end)
                pcall(function() game:SetVideoInfo("") end)
                
                message.Text = "Loading Place. Please wait..." 
                coroutine.yield()
                game:Load("http://www.rbx2016.nl/asset?id=${game.gameid}${token2}")
                
                visit:SetUploadUrl("${upload ? `http://data.rbx2016.nl/Data/Upload.ashx?assetid=${game.gameid}&ispublic=${db.toString(game.isPublic)}&c=${user.cookie}&groupId=` : ""}")
                
                message.Parent = nil
                
                game:GetService("ChangeHistoryService"):SetEnabled(true)
                
                `;
                if (user) {
                    script += `spawn(function()
                    while true do
                        loadfile("http://assetgame.rbx2016.nl/game/studiobeat.ashx?cookie=${user.cookie}")()
                        wait(25)
                    end
                end)

                game:SetCreatorId(${user.userid})
                
                game.OnClose = function()
                    loadfile("http://assetgame.rbx2016.nl/game/quit.ashx?cookie=${user.cookie}")()
                end`
                }
            } else {
                if (!user) {
                    return res.sendStatus(403);
                }
                let token2 = "";
                if (user) {
                    token2 = `&t=${await db.generateUserTokenByCookie(user.cookie)}`
                }
                if (db.getSiteConfig().backend.hostingTeamCreateEnabled == false) {
                    script = `
                -- Prepended to Edit.lua and Visit.lua and Studio.lua--
                
                pcall(function() game:SetPlaceID(${game.gameid}) end)
                pcall(function() game:SetUniverseId(${game.gameid}) end)
                pcall(function() game:GetService("StudioService"):SetDocumentDisplayName("${game.gamename}") end)
                pcall(function() game.Name = "${game.gamename}" end)
                
                visit = game:GetService("Visit")
                
                local message = Instance.new("Message")
                message.Parent = workspace
                message.archivable = false

                local message2 = Instance.new("Message")
                message2.Parent = workspace
                message2.archivable = false
                message2.Text = "TeamCreate is currently disabled and a local copy is being loaded instead."
                
                game:GetService("ContentProvider"):SetThreadPool(16)
                pcall(function() game:GetService("InsertService"):SetFreeModelUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?type=fm&q=%s&pg=%d&rs=%d") end) -- Used for free model search (insert tool)
                pcall(function() game:GetService("InsertService"):SetFreeDecalUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?type=fd&q=%s&pg=%d&rs=%d") end) -- Used for free decal search (insert tool)
                
                settings().Diagnostics:LegacyScriptMode()
                
                game:GetService("InsertService"):SetBaseSetsUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
                game:GetService("InsertService"):SetUserSetsUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
                game:GetService("InsertService"):SetCollectionUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?sid=%d")
                game:GetService("InsertService"):SetAssetUrl("https://www.rbx2016.nl/Asset/?id=%d")
                game:GetService("InsertService"):SetAssetVersionUrl("https://www.rbx2016.nl/Asset/?assetversionid=%d")
                
                -- TODO: move this to a text file to be included with other scripts
                pcall(function() game:GetService("SocialService"):SetFriendUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsFriendsWith&playerid=%d&userid=%d") end)
                pcall(function() game:GetService("SocialService"):SetBestFriendUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsBestFriendsWith&playerid=%d&userid=%d") end)
                pcall(function() game:GetService("SocialService"):SetGroupUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsInGroup&playerid=%d&groupid=%d") end)
                pcall(function() game:GetService("SocialService"):SetGroupRankUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=%d&groupid=%d") end)
                pcall(function() game:GetService("SocialService"):SetGroupRoleUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=%d&groupid=%d") end)
                pcall(function() game:GetService("GamePassService"):SetPlayerHasPassUrl("https://api.rbx2016.nl/Game/GamePass/GamePassHandler.ashx?Action=HasPass&UserID=%d&PassID=%d") end)
                pcall(function() game:GetService("MarketplaceService"):SetProductInfoUrl("https://api.rbx2016.nl/marketplace/productinfo?assetId=%d") end)
                --pcall(function() game:GetService("MarketplaceService"):SetDevProductInfoUrl("https://api.rbx2016.nl/marketplace/productDetails?productId=%d") end)
                pcall(function() game:GetService("MarketplaceService"):SetPlayerOwnsAssetUrl("https://api.rbx2016.nl/ownership/hasasset?userId=%d&assetId=%d") end)
                pcall(function() game:SetCreatorID(${game.creatorid}, Enum.CreatorType.User) end)
                
                pcall(function() game:SetScreenshotInfo("") end)
                pcall(function() game:SetVideoInfo("") end)
                
                message.Text = "Loading Place. Please wait..." 
                coroutine.yield()
                game:Load("http://www.rbx2016.nl/asset?id=${game.gameid}${token2}")
                
                visit:SetUploadUrl("${upload ? `http://data.rbx2016.nl/Data/Upload.ashx?assetid=${game.gameid}&ispublic=${db.toString(game.isPublic)}&c=${user.cookie}&groupId=` : ""}")
                
                message.Parent = nil
                spawn(function()
                    wait(3)
                    message2.Parent = nil
                end)
                
                game:GetService("ChangeHistoryService"):SetEnabled(true)
                
                spawn(function()
                    while true do
                        loadfile("http://assetgame.rbx2016.nl/game/studiobeat.ashx?cookie=${user.cookie}")()
                        wait(25)
                    end
                end)

                game:SetCreatorId(${user.userid})
                
                game.OnClose = function()
                    loadfile("http://assetgame.rbx2016.nl/game/quit.ashx?cookie=${user.cookie}")()
                end
                `;
                } else {
                    script = `
                    -- Prepended to Edit.lua and Visit.lua and Studio.lua--
                    
                    game:SetRemoteBuildMode(true)
                    pcall(function() settings().Diagnostics:LegacyScriptMode() end)
    
                    pcall(function() game:SetPlaceID(${game.gameid}) end)
                    pcall(function() game:SetUniverseId(${game.gameid}) end)
                    pcall(function() game:GetService("StudioService"):SetDocumentDisplayName("${game.gamename}") end)
                    pcall(function() game.Name = "${game.gamename}" end)
                    
                    visit = game:GetService("Visit")
                    
                    local message = Instance.new("Message")
                    message.Parent = workspace
                    message.archivable = false
                    
                    game:GetService("ContentProvider"):SetThreadPool(16)
                    pcall(function() game:GetService("InsertService"):SetFreeModelUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?type=fm&q=%s&pg=%d&rs=%d") end) -- Used for free model search (insert tool)
                    pcall(function() game:GetService("InsertService"):SetFreeDecalUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?type=fd&q=%s&pg=%d&rs=%d") end) -- Used for free decal search (insert tool)
                    
                    settings().Diagnostics:LegacyScriptMode()
                    
                    game:GetService("InsertService"):SetBaseSetsUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
                    game:GetService("InsertService"):SetUserSetsUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
                    game:GetService("InsertService"):SetCollectionUrl("https://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?sid=%d")
                    game:GetService("InsertService"):SetAssetUrl("https://www.rbx2016.nl/Asset/?id=%d")
                    game:GetService("InsertService"):SetAssetVersionUrl("https://www.rbx2016.nl/Asset/?assetversionid=%d")
                    
                    -- TODO: move this to a text file to be included with other scripts
                    pcall(function() game:GetService("SocialService"):SetFriendUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsFriendsWith&playerid=%d&userid=%d") end)
                    pcall(function() game:GetService("SocialService"):SetBestFriendUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsBestFriendsWith&playerid=%d&userid=%d") end)
                    pcall(function() game:GetService("SocialService"):SetGroupUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsInGroup&playerid=%d&groupid=%d") end)
                    pcall(function() game:GetService("SocialService"):SetGroupRankUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=%d&groupid=%d") end)
                    pcall(function() game:GetService("SocialService"):SetGroupRoleUrl("https://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=%d&groupid=%d") end)
                    pcall(function() game:GetService("GamePassService"):SetPlayerHasPassUrl("https://api.rbx2016.nl/Game/GamePass/GamePassHandler.ashx?Action=HasPass&UserID=%d&PassID=%d") end)
                    pcall(function() game:GetService("MarketplaceService"):SetProductInfoUrl("https://api.rbx2016.nl/marketplace/productinfo?assetId=%d") end)
                    --pcall(function() game:GetService("MarketplaceService"):SetDevProductInfoUrl("https://api.rbx2016.nl/marketplace/productDetails?productId=%d") end)
                    pcall(function() game:GetService("MarketplaceService"):SetPlayerOwnsAssetUrl("https://api.rbx2016.nl/ownership/hasasset?userId=%d&assetId=%d") end)
                    pcall(function() game:SetCreatorID(${game.creatorid}, Enum.CreatorType.User) end)
                    
                    pcall(function() game:SetScreenshotInfo("") end)
                    pcall(function() game:SetVideoInfo("") end)
                    
                    message.Text = "Loading Place. Please wait..." 
                    coroutine.yield()
                    -- game:Load("http://www.rbx2016.nl/asset?id=${game.gameid}|${await db.generateUserTokenByCookie(user.cookie)}")
                    local nc = game:GetService("NetworkClient")
                    nc.ConnectionFailed:Connect(function()
                        message.Text = "Connection failed. Please try again later."
                        wait(5)
                        game:FinishShutdown(false)
                    end)
                    nc.ConnectionAccepted:Connect(function()
                        message.Text = "Connected to server."
                    end)
                    local threadSleepTime = 15
                    local playerConnectSuccess, player = pcall(function() return client:PlayerConnect(${user.userid}, "${game.teamCreateIp}", ${game.teamCreatePort}, 0, threadSleepTime) end)
                    if not playerConnectSuccess then
                        --Old player connection scheme
                        player = game:GetService("Players"):CreateLocalPlayer(0)
                        analytics("Created Player")
                        client:Connect("${game.teamCreateIp}", ${game.teamCreatePort}, 0, threadSleepTime)
                    else
                        analytics("Created Player")
                    end
                    
                    visit:SetUploadUrl("${upload ? `http://data.rbx2016.nl/Data/Upload.ashx?assetid=${game.gameid}&ispublic=${db.toString(game.isPublic)}&c=${user.cookie}&groupId=` : ""}")
                    
                    message.Parent = nil
                    
                    game:GetService("ChangeHistoryService"):SetEnabled(true)
                    
                    spawn(function()
                        while true do
                            loadfile("http://assetgame.rbx2016.nl/game/studiobeat.ashx?cookie=${user.cookie}")()
                            wait(25)
                        end
                    end)

                    game:SetCreatorId(${user.userid})
                    
                    game.OnClose = function()
                        loadfile("http://assetgame.rbx2016.nl/game/quit.ashx?cookie=${user.cookie}")()
                    end
                    `;
                }
            }
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/my/settings/json", db.requireAuth, async (req, res) => {
            const ip = get_ip(req).clientIp;
            res.json({
                "ChangeUsernameEnabled": true,
                "IsAdmin": req.user.role == "mod" || req.user.role == "admin" || req.user.role == "owner",
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
                "ClientIpAddress": ip,
                "AccountAgeInDays": 1105,
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
                "ApiProxyDomain": "https://api.rbx2016.nl",
                "AccountSettingsApiDomain": "https://accountsettings.rbx2016.nl",
                "AuthDomain": "https://auth.rbx2016.nl",
                "IsDisconnectFacebookEnabled": true,
                "IsDisconnectXboxEnabled": true,
                "NotificationSettingsDomain": "https://notifications.rbx2016.nl",
                "AllowedNotificationSourceTypes": ["Test", "FriendRequestReceived", "FriendRequestAccepted", "PartyInviteReceived", "PartyMemberJoined", "ChatNewMessage", "PrivateMessageReceived", "UserAddedToPrivateServerWhiteList", "ConversationUniverseChanged", "TeamCreateInvite", "GameUpdate", "DeveloperMetricsAvailable", "GroupJoinRequestAccepted", "Sendr"],
                "AllowedReceiverDestinationTypes": ["DesktopPush", "NotificationStream"],
                "BlacklistedNotificationSourceTypesForMobilePush": [],
                "MinimumChromeVersionForPushNotifications": 50,
                "PushNotificationsEnabledOnFirefox": true,
                "LocaleApiDomain": "https://locale.rbx2016.nl",
                "HasValidPasswordSet": true,
                "FastTrackMember": null,
                "IsFastTrackAccessible": false,
                "HasFreeNameChange": false,
                "IsAgeDownEnabled": !(await db.isUserUnder13(req.user.userid)),
                "IsDisplayNamesEnabled": false,
                "IsBirthdateLocked": await db.isUserUnder13(req.user.userid)
            })
        });

        app.get("/Game/JoinRate.ashx", (req, res) => {
            res.send();
        });

        app.post("/auth/invalidate", (req, res) => {
            res.json({});
        });

        app.get("/Thumbs/Avatar.ashx", async (req, res) => {
            const userId = parseInt(req.query.userId);
            const x = parseInt(req.query.x);
            const y = parseInt(req.query.y);
            const user = await db.getUser(userId);
            if (!user) {
                res.sendStatus(404);
                return;
            }
            res.redirect("http://images.rbx2016.nl/e6ea624485b22e528cc719f04560fe78.png");
            // res.json([{
            //     id: user.userid,
            //     name: user.username,
            //     url: "/user.aspx?id=" + user.userid.toString(),
            //     thumbnailFinal: true, // if false, thumbnailUrl will be a placeholder
            //     thumbnailUrl: "http://images.rbx2016.nl/e6ea624485b22e528cc719f04560fe78.png",
            //     bcOverlayUrl: null // null if NBC
            // }])
        });

        app.get("/Asset/CharacterFetch.ashx", async (req, res) => {
            const userId = parseInt(req.query.player) || parseInt(req.query.userId);
            const user = await db.getUser(userId);
            if (!user) {
                res.sendStatus(404);
                return;
            }
            const items = await db.getEquippedCatalogItems(userId);
            let itemsResponse = ``;
            for (const itemid of items) {
                itemsResponse += `;http://www.rbx2016.nl/asset/?id=${itemid}`;
            }
            res.send(`https://www.rbx2016.nl/asset/BodyColors.ashx?userId=${userId}${itemsResponse}`) // ;http://www.rbx2016.nl/asset/?id=63690008&version=5;http://www.rbx2016.nl/asset/?id=144076358;http://www.rbx2016.nl/asset/?id=144076760;http://www.rbx2016.nl/asset/?id=144075659;http://www.rbx2016.nl/asset/?id=86500054&version=1;http://www.rbx2016.nl/asset/?id=86500078&version=1;http://www.rbx2016.nl/asset/?id=86500036&version=1;http://www.rbx2016.nl/asset/?id=86500008&version=1;http://www.rbx2016.nl/asset/?id=86500064&version=1;http://www.rbx2016.nl/asset/?id=86498048&version=1
        });

        app.get("/Assets/CharacterFetch.php", async (req, res) => {
            const userId = parseInt(req.query.player) || parseInt(req.query.userId);
            const user = await db.getUser(userId);
            if (!user) {
                res.sendStatus(404);
                return;
            }
            const items = await db.getEquippedCatalogItems(userId);
            let itemsResponse = ``;
            for (const itemid of items) {
                itemsResponse += `;http://www.rbx2016.nl/asset/?id=${itemid}`;
            }
            res.send(`https://www.rbx2016.nl/asset/BodyColors.ashx?userId=${userId}${itemsResponse}`) // ;http://www.rbx2016.nl/asset/?id=63690008&version=5;http://www.rbx2016.nl/asset/?id=144076358;http://www.rbx2016.nl/asset/?id=144076760;http://www.rbx2016.nl/asset/?id=144075659;http://www.rbx2016.nl/asset/?id=86500054&version=1;http://www.rbx2016.nl/asset/?id=86500078&version=1;http://www.rbx2016.nl/asset/?id=86500036&version=1;http://www.rbx2016.nl/asset/?id=86500008&version=1;http://www.rbx2016.nl/asset/?id=86500064&version=1;http://www.rbx2016.nl/asset/?id=86498048&version=1
        });
        
        app.get("/asset/BodyColors.ashx", async (req, res) => {
            const userId = parseInt(req.query.userId);
            const avatarColors = await db.getUserProperty(userId, "avatarColors") || [1002, 1002, 1002, 1002, 1002, 1002];
            
            res.send(`<?xml version="1.0" encoding="utf-8" ?>
            <roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.rbx2016.nl/roblox.xsd" version="4">
                <External>null</External>
                <External>nil</External>
                <Item class="BodyColors">
                    <Properties>
                        <int name="HeadColor">${avatarColors[0]}</int>
                        <int name="LeftArmColor">${avatarColors[1]}</int>
                        <int name="LeftLegColor">${avatarColors[2]}</int>
                        <string name="Name">Body Colors</string>
                        <int name="RightArmColor">${avatarColors[3]}</int>
                        <int name="RightLegColor">${avatarColors[4]}</int>
                        <int name="TorsoColor">${avatarColors[5]}</int>
                        <bool name="archivable">true</bool>
                    </Properties>
                </Item>
            </roblox>`)
        });

        app.get("/game/studiobeat.ashx", async (req, res) => {
            const cookie = req.query.cookie;
            const user = await db.findUserByCookie(cookie);
            if (user) {
                await db.setUserProperty(user.userid, "lastStudio", db.getUnixTimestamp());
            }
            const script = ``;
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/game/quit.ashx", async (req, res) => {
            const cookie = req.query.cookie;
            const user = await db.findUserByCookie(cookie);
            if (user) {
                await db.setUserProperty(user.userid, "lastStudio", 0);
            }
            const script = ``;
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/Game/gameserver.ashx", async (req, res) => {
            const port = 53640;
            const script = `
            -- Start Game Script Arguments

            ------------------- UTILITY FUNCTIONS --------------------------
            
            local cdnSuccess = 0
            local cdnFailure = 0
            
            function table_find(tab,val)
                for i,v in ipairs(tab) do
                    if v == val then
                        return v
                    end
                end
                return nil
            end
            
            function waitForChild(parent, childName)
                while true do
                    local child = parent:findFirstChild(childName)
                    if child then
                        return child
                    end
                    parent.ChildAdded:wait()
                end
            end
            
            -- returns the player object that killed this humanoid
            -- returns nil if the killer is no longer in the game
            function getKillerOfHumanoidIfStillInGame(humanoid)
            
                -- check for kill tag on humanoid - may be more than one - todo: deal with this
                local tag = humanoid:findFirstChild("creator")
            
                -- find player with name on tag
                if tag then
                    local killer = tag.Value
                    if killer.Parent then -- killer still in game
                        return killer
                    end
                end
            
                return nil
            end
            -----------------------------------END UTILITY FUNCTIONS -------------------------
            
            -----------------------------------"CUSTOM" SHARED CODE----------------------------------
            
            pcall(function() settings().Network.UseInstancePacketCache = true end)
            pcall(function() settings().Network.UsePhysicsPacketCache = true end)
            pcall(function() settings()["Task Scheduler"].PriorityMethod = Enum.PriorityMethod.AccumulatedError end)
            
            
            settings().Network.PhysicsSend = Enum.PhysicsSendMethod.TopNErrors
            settings().Network.ExperimentalPhysicsEnabled = true
            settings().Network.WaitingForCharacterLogRate = 100
            pcall(function() settings().Diagnostics:LegacyScriptMode() end)
            
            -----------------------------------START GAME SHARED SCRIPT------------------------------
            
            -- establish this peer as the Server
            local ns = game:GetService("NetworkServer")
            
            local badgeUrlFlagExists, badgeUrlFlagValue = pcall(function () return settings():GetFFlag("NewBadgeServiceUrlEnabled") end)
            local newBadgeUrlEnabled = badgeUrlFlagExists and badgeUrlFlagValue
            if url~=nil then
                local url = "http://www.rbx2016.nl/"
            
                pcall(function() game:GetService("Players"):SetAbuseReportUrl(url .. "/AbuseReport/InGameChatHandler.ashx") end)
                pcall(function() game:GetService("ScriptInformationProvider"):SetAssetUrl(url .. "/Asset/") end)
                pcall(function() game:GetService("ContentProvider"):SetBaseUrl(url .. "/") end)
                pcall(function() game:GetService("Players"):SetChatFilterUrl(url .. "/Game/ChatFilter.ashx") end)
                
                if gameCode then
                    game:SetVIPServerId(tostring(gameCode))
                end
            
                game:GetService("BadgeService"):SetPlaceId(1)
                game:SetPlaceId(1)
                -- game:SetCreatorId(-1)
            
            
                if newBadgeUrlEnabled then
                    game:GetService("BadgeService"):SetAwardBadgeUrl(apiProxyUrl .. "/assets/award-badge?userId=%d&badgeId=%d&placeId=%d")
                end
            
                if access~=nil then
                    if not newBadgeUrlEnabled then
                        game:GetService("BadgeService"):SetAwardBadgeUrl(url .. "/Game/Badge/AwardBadge.ashx?UserID=%d&BadgeID=%d&PlaceID=%d&" .. access)
                    end
            
                    game:GetService("BadgeService"):SetHasBadgeUrl(url .. "/Game/Badge/HasBadge.ashx?UserID=%d&BadgeID=%d&" .. access)
                    game:GetService("BadgeService"):SetIsBadgeDisabledUrl(url .. "/Game/Badge/IsBadgeDisabled.ashx?BadgeID=%d&PlaceID=%d&" .. access)
            
                    game:GetService("FriendService"):SetMakeFriendUrl(url .. "/Game/CreateFriend?firstUserId=%d&secondUserId=%d")
                    game:GetService("FriendService"):SetBreakFriendUrl(url .. "/Game/BreakFriend?firstUserId=%d&secondUserId=%d")
                    game:GetService("FriendService"):SetGetFriendsUrl(url .. "/Game/AreFriends?userId=%d")
                end
                game:GetService("BadgeService"):SetIsBadgeLegalUrl("")
                game:GetService("InsertService"):SetBaseSetsUrl(url .. "/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
                game:GetService("InsertService"):SetUserSetsUrl(url .. "/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
                game:GetService("InsertService"):SetCollectionUrl(url .. "/Game/Tools/InsertAsset.ashx?sid=%d")
                game:GetService("InsertService"):SetAssetUrl(url .. "/Asset/?id=%d")
                game:GetService("InsertService"):SetAssetVersionUrl(url .. "/Asset/?assetversionid=%d")
                
                pcall(function() loadfile(url .. "/Game/LoadPlaceInfo.ashx?PlaceId=" .. placeId)() end)
                
                pcall(function() 
                            if access then
                                loadfile(url .. "/Game/PlaceSpecificScript.ashx?PlaceId=" .. placeId .. "&" .. access)()
                            end
                        end)
            end
            
            pcall(function() game:GetService("NetworkServer"):SetIsPlayerAuthenticationRequired(true) end)
            settings().Diagnostics.LuaRamLimit = 0
            
            game.Workspace.ChildRemoved:connect(function(obj)
                pcall(function()
                    local plr = game.Players:GetPlayerFromCharacter(obj)
                    if plr then
                        local start = tick()
                        repeat wait(0.5) until plr.Character or tick() - start >= 6
                        if not plr.Character then
                            pcall(function()
                                plr:LoadCharacter()
                            end)
                        end
                    end
                end)
            end)
            
            if placeId~=nil and killID~=nil and deathID~=nil and url~=nil then
                -- listen for the death of a Player
                function createDeathMonitor(player)
                    -- we don't need to clean up old monitors or connections since the Character will be destroyed soon
                    if player.Character then
                        local humanoid = waitForChild(player.Character, "Humanoid")
                        humanoid.Died:connect(
                            function ()
                                onDied(player, humanoid)
                            end
                        )
                    end
                end
            
                -- listen to all Players' Characters
                game:GetService("Players").ChildAdded:connect(
                    function (player)
                        createDeathMonitor(player)
                        player.Changed:connect(
                            function (property)
                                if property=="Character" then
                                    createDeathMonitor(player)
                                end
                            end
                        )
                    end
                )
            end
            
            function Split(s, delimiter)
                result = {};
                for match in (s..delimiter):gmatch("(.-)"..delimiter) do
                    table.insert(result, match);
                end
                return result;
            end
            
            game:GetService("Players").PlayerAdded:connect(function(player)
                print("Player " .. player.userId .. " added")
            end)
            
            
            game:GetService("Players").PlayerRemoving:connect(function(player)
                print("Player " .. player.userId .. " leaving")	
            end)
            
            -- Now start the connection
            -- game:Load("rbxasset://temp.rbxl")
            ns:Start(${port}, sleeptime)  
            pcall(function() game.LocalSaveEnabled = true end)
            
            -- StartGame --
            Game:GetService("RunService"):Run()`;
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/game/join.ashx", db.requireAuth2, async (req, res) => {
            const ip = get_ip(req).clientIp;
            const isAndroid = req.headers["user-agent"].toLowerCase().includes("android");
            if (typeof req.query.serverPort !== "undefined") {
                const userid = parseInt(req.query.UserID);
                const port = parseInt(req.query.serverPort);
                const universeId = parseInt(req.query.universeId);
                const game = await db.getGame(universeId);
                let creatorid = 0;
                if (game) {
                    creatorid = game.creatorid;
                }
                let isUnder13 = false;
                if (req.user) {
                    isUnder13 = await db.isUserUnder13(req.user.userid);
                }
                const joinScript = `

-- Vars generated by ashx --

local isTeleporting = false
local waitingForCharacterGuid = "${db.uuidv4()}"
local rbxApiTicket = "00000000000000000000000000000000"
local isSuperSafeChat = ${isUnder13 ? "true" : "false"}
local isUnder13 = ${isUnder13 ? "true" : "false"}

-- Vars end --

-- functions --------------------------
function onPlayerAdded(player)
	-- override
end



-- MultiplayerSharedScript.lua inserted here ------ Prepended to Join.lua --

-- log app init time
pcall(function()
	local t = ElapsedTime()
	local platform = settings().Diagnostics.OsPlatform
	game:HttpGet("http://www.rbx2016.nl/Game/JoinRate.ashx?st=0&i=0&p=-1&c=GameAppInit&r=Success&d=" .. (math.floor(t*1000)) .. "&ip=localhost&errorType=&platform=" .. platform, false)
end)

pcall(function() game:SetPlaceID(-1, false) end)

local startTime = tick()
local connectResolved = false
local loadResolved = false
local joinResolved = false
local playResolved = true
local playStartTime = 0

local cdnSuccess = 0
local cdnFailure = 0

-- if we are on a touch device, no blocking http calls allowed! This can cause a crash on iOS
-- In general we need a long term strategy to remove blocking http calls from all platforms
local isTouchDevice = Game:GetService("UserInputService").TouchEnabled

settings()["Game Options"].CollisionSoundEnabled = true
pcall(function() settings().Rendering.EnableFRM = true end)
pcall(function() settings().Physics.Is30FpsThrottleEnabled = true end)
pcall(function() settings()["Task Scheduler"].PriorityMethod = Enum.PriorityMethod.AccumulatedError end)
pcall(function() settings().Physics.PhysicsEnvironmentalThrottle = Enum.EnviromentalPhysicsThrottle.DefaultAuto end)

function reportContentProvider(time, queueLength, blocking)
	pcall(function()
		game:HttpGet("http://www.rbx2016.nl/Analytics/ContentProvider.ashx?t=" .. time .. "&ql=" .. queueLength, blocking and not isTouchDevice)
	end)
end
function reportCdn(blocking)
	pcall(function()
		local newCdnSuccess = settings().Diagnostics.CdnSuccessCount
		local newCdnFailure = settings().Diagnostics.CdnFailureCount
		local successDelta = newCdnSuccess - cdnSuccess
		local failureDelta = newCdnFailure - cdnFailure
		cdnSuccess = newCdnSuccess
		cdnFailure = newCdnFailure
		if successDelta > 0 or failureDelta > 0 then
			game:HttpGet("http://www.rbx2016.nl/Game/Cdn.ashx?source=client&success=" .. successDelta .. "&failure=" .. failureDelta, blocking and not isTouchDevice)
		end
	end)
end

function reportDuration(category, result, duration, blocking,errorType)
	if not errorType then
		errorType = ''
	end
	local platform = settings().Diagnostics.OsPlatform
	local bytesReceived = -1
	if stats().Network:getChildren()[2] ~= nil then
		bytesReceived = stats().Network:getChildren()[2].Stats.totalBytesReceived:GetValue()
	end
	pcall(function() game:HttpGet("http://www.rbx2016.nl/Game/JoinRate.ashx?st=0&i=0&p=-1&c=" .. category .. "&r=" .. result .. "&d=" .. (math.floor(duration*1000)) .. "&b=" .. bytesReceived .. "&ip=localhost&errorType=" .. errorType .. "&platform=" .. platform, blocking and not isTouchDevice) end)
end
-- arguments ---------------------------------------
local threadSleepTime = ...

if threadSleepTime==nil then
	threadSleepTime = 15
end

local test = true

print("! Joining game '' place -1 at localhost")
local closeConnection = game.Close:connect(function() 
	if 0 then
		reportCdn(true)
		if not connectResolved then
			local duration = tick() - startTime;
			reportDuration("GameConnect", "Failure", duration, true)
		elseif (not loadResolved) or (not joinResolved) then
			local duration = tick() - startTime;
			if not loadResolved then
				loadResolved = true
				reportDuration("GameLoad","Cancel", duration, true)
			end
			if not joinResolved then
				joinResolved = true
				reportDuration("GameJoin","Cancel", duration, true)
			end
		elseif not playResolved then
			local duration = tick() - playStartTime;
			playResolved = true
			reportDuration("GameDuration","Success", duration, true)
		end
		if true then pcall(function() game:HttpPost("https://api.rbx2016.nl/auth/invalidate", "invalidate") end) end
	end
end)

game:GetService("ChangeHistoryService"):SetEnabled(false)
game:GetService("ContentProvider"):SetThreadPool(16)
game:GetService("InsertService"):SetBaseSetsUrl("http://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
game:GetService("InsertService"):SetUserSetsUrl("http://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
game:GetService("InsertService"):SetCollectionUrl("http://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?sid=%d")
game:GetService("InsertService"):SetAssetUrl("http://www.rbx2016.nl/Asset/?id=%d")
game:GetService("InsertService"):SetAssetVersionUrl("http://www.rbx2016.nl/Asset/?assetversionid=%d")

pcall(function() game:GetService("SocialService"):SetFriendUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsFriendsWith&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetBestFriendUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsBestFriendsWith&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsInGroup&playerid=%d&groupid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupRankUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=%d&groupid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupRoleUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=%d&groupid=%d") end)
pcall(function() game:GetService("GamePassService"):SetPlayerHasPassUrl("http://www.rbx2016.nl/Game/GamePass/GamePassHandler.ashx?Action=HasPass&UserID=%d&PassID=%d") end)
pcall(function() game:GetService("MarketplaceService"):SetProductInfoUrl("https://api.rbx2016.nl/marketplace/productinfo?assetId=%d") end)
pcall(function() game:GetService("MarketplaceService"):SetPlayerOwnsAssetUrl("https://api.rbx2016.nl/ownership/hasasset?userId=%d&assetId=%d") end)
pcall(function() game:SetCreatorID(0, Enum.CreatorType.User) end)

-- Bubble chat.  This is all-encapsulated to allow us to turn it off with a config setting
pcall(function() game:GetService("Players"):SetChatStyle(Enum.ChatStyle.Classic) end)

local waitingForCharacter = false

pcall( function()
	if settings().Network.MtuOverride == 0 then
	  settings().Network.MtuOverride = 1400
	end
end)


-- globals -----------------------------------------

client = game:GetService("NetworkClient")
visit = game:GetService("Visit")

-- functions ---------------------------------------
function ifSeleniumThenSetCookie(key, value)
	if false then
		game:GetService("CookiesService"):SetCookieValue(key, value)
	end
end

function setMessage(message)
	-- todo: animated "..."
	if not isTeleporting then
		game:SetMessage(message)
	else
		-- hack, good enought for now
		game:SetMessage("Teleporting ...")
	end
end

function showErrorWindow(message, errorType, errorCategory)
	if 0 then
		if (not loadResolved) or (not joinResolved) then
			local duration = tick() - startTime;
			if not loadResolved then
				loadResolved = true
				reportDuration("GameLoad","Failure", duration, false,errorType)
			end
			if not joinResolved then
				joinResolved = true
				reportDuration("GameJoin",errorCategory, duration, false,errorType)
			end
			
			pcall(function() game:HttpGet("?FilterName=Type&FilterValue=" .. errorType .. "&Type=JoinFailure", false) end)
		elseif not playResolved then
			local duration = tick() - playStartTime;
			playResolved = true
			reportDuration("GameDuration",errorCategory, duration, false,errorType)

			pcall(function() game:HttpGet("?FilterName=Type&FilterValue=" .. errorType .. "&Type=GameDisconnect", false) end)
		end
	end
	
	game:SetMessage(message)
end

function registerPlay(key)
	if true and game:GetService("CookiesService"):GetCookieValue(key) == "" then
		game:GetService("CookiesService"):SetCookieValue(key, "{ \\"userId\\" : 0, \\"placeId\\" : -1, \\"os\\" : \\"" .. settings().Diagnostics.OsPlatform .. "\\" }")
	end
end

function analytics(name)
	if not test and false then 
		pcall(function() game:HttpGet("?IPFilter=Primary&SecondaryFilterName=UserId&SecondaryFilterValue=0&Type=" .. name, false) end)
	end
end

function analyticsGuid(name, guid)
	if not test and false then 
		pcall(function() game:HttpGet("?IPFilter=Primary&SecondaryFilterName=guid&SecondaryFilterValue=" .. guid .. "&Type=" .. name, false) end)
	end
end

function reportError(err, message)
	print("***ERROR*** " .. err)
	if not test then visit:SetUploadUrl("") end
	client:Disconnect()
	wait(4)
	showErrorWindow("Error: " .. err, message, "Other")
end

-- called when the client connection closes
function onDisconnection(peer, lostConnection)
	if lostConnection then
	    if waitingForCharacter then analyticsGuid("Waiting for Character Lost Connection",waitingForCharacterGuid) end
		showErrorWindow("You have lost the connection to the game", "LostConnection", "LostConnection")
	else
	    if waitingForCharacter then analyticsGuid("Waiting for Character Game Shutdown",waitingForCharacterGuid) end
		showErrorWindow("This game has shut down", "Kick", "Kick")
	end
	pcall(function() game:HttpGet("&disconnect=true", true) end)
	if true then pcall(function() game:HttpPost("https://api.rbx2016.nl/auth/invalidate", "invalidate") end) end
end

function requestCharacter(replicator)
	
	-- prepare code for when the Character appears
	local connection
	connection = player.Changed:connect(function (property)
		if property=="Character" then
			game:ClearMessage()
			waitingForCharacter = false
			analyticsGuid("Waiting for Character Success", waitingForCharacterGuid)
			
			connection:disconnect()
		
			if 0 then
				if not joinResolved then
					local duration = tick() - startTime;
					joinResolved = true
					reportDuration("GameJoin","Success", duration, false)
					
					playStartTime = tick()
					playResolved = false
				end
			end
		end
	end)
	
	setMessage("Requesting character")
	
	if 0 and not loadResolved then
		local duration = tick() - startTime;
		loadResolved = true
		reportDuration("GameLoad","Success", duration, false)
	end

	local success, err = pcall(function()	
		replicator:RequestCharacter()
		setMessage("Waiting for character")
		waitingForCharacter = true
		analyticsGuid("Waiting for Character Begin",waitingForCharacterGuid);
	end)
	if not success then
		reportError(err,"W4C")
		return
	end
end

-- called when the client connection is established
function onConnectionAccepted(url, replicator)
	connectResolved = true
	reportDuration("GameConnect", "Success", tick() - startTime, false)

	local waitingForMarker = true
	
	local success, err = pcall(function()	
		if not test then 
		    visit:SetPing("", 300) 
		end
		
		if not false then
			game:SetMessageBrickCount()
		else
			setMessage("Teleporting ...")
		end

		replicator.Disconnection:connect(onDisconnection)
		
		-- Wait for a marker to return before creating the Player
		local marker = replicator:SendMarker()
		
		marker.Received:connect(function()
			waitingForMarker = false
			requestCharacter(replicator)
		end)
	end)
	
	if not success then
		reportError(err,"ConnectionAccepted")
		return
	end
	
	-- TODO: report marker progress
	
	while waitingForMarker do
		workspace:ZoomToExtents()
		wait(0.5)
	end
end

-- called when the client connection fails
function onConnectionFailed(_, error)
	showErrorWindow("Failed to connect to the Game. (ID=" .. error .. ")", "ID" .. error, "Other")
end

-- called when the client connection is rejected
function onConnectionRejected()
	connectionFailed:disconnect()
	showErrorWindow("This game is not available. Please try another", "WrongVersion", "WrongVersion")
end

idled = false
function onPlayerIdled(time)
	if time > 20*60 then
		showErrorWindow(string.format("You were disconnected for being idle %d minutes", time/60), "Idle", "Idle")
		client:Disconnect()
		if not idled then
			idled = true
		end
	end
end


-- main ------------------------------------------------------------

analytics("Start Join Script")

ifSeleniumThenSetCookie("SeleniumTest1", "Started join script")

pcall(function() settings().Diagnostics:LegacyScriptMode() end)
local success, err = pcall(function()	

	game:SetRemoteBuildMode(true)
	
	setMessage("Connecting to Server")
	client.ConnectionAccepted:connect(onConnectionAccepted)
	client.ConnectionRejected:connect(onConnectionRejected)
	connectionFailed = client.ConnectionFailed:connect(onConnectionFailed)
	client.Ticket = ""	
	ifSeleniumThenSetCookie("SeleniumTest2", "Successfully connected to server")
	
	playerConnectSucces, player = pcall(function() return client:PlayerConnect(0, "localhost", 53640, 0, threadSleepTime) end)
	if not playerConnectSucces then
		--Old player connection scheme
		player = game:GetService("Players"):CreateLocalPlayer(0)
		analytics("Created Player")
		client:Connect("localhost", 53640, 0, threadSleepTime)
	else
		analytics("Created Player")
	end

	pcall(function()
		registerPlay("rbx_evt_ftp")
		delay(60*5, function() registerPlay("rbx_evt_fmp") end)
	end)

	-- negotiate an auth token (Not needed for studio testing .-.)
	--[[
        if true then
            pcall(function() game:HttpPost("https://api.rbx2016.nl/auth/negotiate?ticket=" .. rbxApiTicket, "negotiate") end)
            delay(300, function()
                while true do
                    pcall(function() game:HttpPost("https://api.rbx2016.nl/auth/renew", "renew") end)
                    wait(300)
                end
            end)
        end
    ]]

	player:SetSuperSafeChat(isSuperSafeChat)
	pcall(function() player:SetUnder13(isUnder13) end)
	pcall(function() player:SetMembershipType(Enum.MembershipType.None) end)
	pcall(function() player:SetAccountAge(0) end)
	player.Idled:connect(onPlayerIdled)
	
	-- Overriden
	onPlayerAdded(player)
	
	pcall(function() player.Name = [========[Player]========] end)
	player.CharacterAppearance = ""	
	if not test then visit:SetUploadUrl("")end
	
	analytics("Connect Client")
		
end)

if not success then
	reportError(err,"CreatePlayer")
end

ifSeleniumThenSetCookie("SeleniumTest3", "Successfully created player")

if not test then
	-- TODO: Async get?
	loadfile("")("", -1, 0)
end

if 0 then
 delay(60*5, function()
	while true do
		reportCdn(false)
		wait(60*5)
	end
 end)
 local cpTime = 30
 delay(cpTime, function()
    while cpTime <= 480 do 
	   reportContentProvider(cpTime, game:GetService("ContentProvider").RequestQueueSize, false)
       wait(cpTime)
       cpTime = cpTime * 2
    end
 end) 
end

pcall(function() game:SetScreenshotInfo("") end)
pcall(function() game:SetVideoInfo('<?xml version="1.0"?><entry xmlns="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/" xmlns:yt="http://gdata.youtube.com/schemas/2007"><media:group><media:title type="plain"><![CDATA[ROBLOX Place]]></media:title><media:description type="plain"><![CDATA[ For more games visit http://www.rbx2016.nl]]></media:description><media:category scheme="http://gdata.youtube.com/schemas/2007/categories.cat">Games</media:category><media:keywords>ROBLOX, video, free game, online virtual world</media:keywords></media:group></entry>') end)
-- use single quotes here because the video info string may have unescaped double quotes

analytics("Join Finished")

ifSeleniumThenSetCookie("SeleniumTest4", "Finished join")`;
                const signature = db.sign(joinScript);
                res.send(`--rbxsig%${signature}%` + joinScript);
                return;
            }
            const teamCreate = req.query.teamCreate == "true";
            const gameid = parseInt(req.query.gameid);
            const ticket = req.query.ticket;
            const user = await db.findUserByToken(ticket);
            if (!user || user.banned || user.inviteKey == "") {
                res.status(401).json({});
                return;
            }
            const game = await db.getGame(gameid);
            if (!game) {
                res.status(400).json({});
                return;
            }

            const isUserUnder13 = await db.isUserUnder13(user.userid);

            let joinScript = "";
            if (!teamCreate) {
                joinScript = "\r\n" + JSON.stringify({
                    "ClientPort": 0,
                    "MachineAddress": game.ip,
                    "ServerPort": game.port,
                    "PingUrl": `https://assetgame.rbx2016.nl/Game/ClientPresence.ashx?version=old&PlaceID=${game.gameid}&GameID=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&UserID=${user.userid}`,
                    "PingInterval": 20,
                    "UserName": user.username,
                    "SeleniumTestMode": false,
                    "UserId": user.userid,
                    "SuperSafeChat": isUserUnder13,
                    "ClientTicket": user.token,
                    "GameId": game.gameid,
                    "PlaceId": game.gameid,
                    "MeasurementUrl": "",
                    "WaitingForCharacterGuid": db.uuidv4(),
                    "BaseUrl": "http://rbx2016.nl",
                    "ChatStyle": "ClassicAndBubble",
                    "VendorId": 0,
                    "ScreenShotInfo": "",
                    "VideoInfo": "",
                    "CreatorId": game.creatorid,
                    "CreatorTypeEnum": "User",
                    "MembershipType": user.membership == 3 ? "OutragiousBuildersClub" : user.membership == 2 ? "TurboBuildersClub" : user.membership == 1 ? "BuildersClub" : "None",
                    "AccountAge": Math.floor(db.getUnixTimestamp() - db.unixToDate(user.created) / 86400),
                    "CookieStoreFirstTimePlayKey": "rbx_evt_ftp",
                    "CookieStoreFiveMinutePlayKey": "rbx_evt_fmp",
                    "CookieStoreEnabled": true,
                    "IsRobloxPlace": true,
                    "GenerateTeleportJoin": false,
                    "IsUnknownOrUnder13": isUserUnder13,
                    "SessionId": `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa|00000000-0000-0000-0000-000000000000|0|${ip}|8|${new Date().toISOString()}|${user.cookie.replaceAll("|","§")}|null|null`,
                    "DataCenterId": 0,
                    "UniverseId": game.gameid,
                    "BrowserTrackerId": 0,
                    "UsePortraitMode": false,
                    "FollowUserId": 0,
                    "CharacterAppearanceId": user.userid,
                    "CharacterAppearance": `http://rbx2016.nl/Assets/CharacterFetch.php?player=${user.userid}`
                });
            } else {
                joinScript = "\r\n" + JSON.stringify({
                    "ClientPort": 0,
                    "MachineAddress": game.teamCreateIp,
                    "ServerPort": game.teamCreatePort,
                    "PingUrl": `https://assetgame.rbx2016.nl/Game/ClientPresence.ashx?version=old&PlaceID=${game.gameid}&GameID=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&UserID=${user.userid}`,
                    "PingInterval": 20,
                    "UserName": user.username,
                    "SeleniumTestMode": false,
                    "UserId": user.userid,
                    "SuperSafeChat": isUserUnder13,
                    "ClientTicket": user.token,
                    "GameId": game.gameid,
                    "PlaceId": game.gameid,
                    "MeasurementUrl": "",
                    "WaitingForCharacterGuid": db.uuidv4(),
                    "BaseUrl": "http://rbx2016.nl",
                    "ChatStyle": "ClassicAndBubble",
                    "VendorId": 0,
                    "ScreenShotInfo": "",
                    "VideoInfo": "",
                    "CreatorId": game.creatorid,
                    "CreatorTypeEnum": "User",
                    "MembershipType": user.membership == 3 ? "OutragiousBuildersClub" : user.membership == 2 ? "TurboBuildersClub" : user.membership == 1 ? "BuildersClub" : "None",
                    "AccountAge": Math.floor(db.getUnixTimestamp() - db.unixToDate(user.created) / 86400),
                    "CookieStoreFirstTimePlayKey": "rbx_evt_ftp",
                    "CookieStoreFiveMinutePlayKey": "rbx_evt_fmp",
                    "CookieStoreEnabled": true,
                    "IsRobloxPlace": true,
                    "GenerateTeleportJoin": false,
                    "IsUnknownOrUnder13": isUserUnder13,
                    "SessionId": `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa|00000000-0000-0000-0000-000000000000|0|${ip}|8|${new Date().toISOString()}|${user.cookie.replaceAll("|","§")}|null|null`,
                    "DataCenterId": 0,
                    "UniverseId": game.gameid,
                    "BrowserTrackerId": 0,
                    "UsePortraitMode": false,
                    "FollowUserId": 0,
                    "CharacterAppearanceId": user.userid,
                    "CharacterAppearance": `http://rbx2016.nl/Assets/CharacterFetch.php?player=${user.userid}`
                });
            }

            const signature = db.sign(joinScript, isAndroid);
            res.send(`--rbxsig%${signature}%` + joinScript);
        });

        app.get("/game/visit.ashx", (req, res) => {
            const isAndroid = req.headers["user-agent"].toLowerCase().includes("android");
            const IsPlaySolo = req.query.IsPlaySolo = "1";
            const UserID = parseInt(req.query.UserID) || 0;
            const PlaceId = parseInt(req.query.PlaceId) || 0;
            const universeId = parseInt(req.query.universeId) || PlaceId;
            const script = `
-- Prepended to Edit.lua and Visit.lua and Studio.lua and PlaySolo.lua--

function ifSeleniumThenSetCookie(key, value)
    if false then
        game:GetService("CookiesService"):SetCookieValue(key, value)
    end
end

ifSeleniumThenSetCookie("SeleniumTest1", "Inside the visit lua script")

pcall(function() game:SetPlaceID(${PlaceId}) end)

visit = game:GetService("Visit")

local message = Instance.new("Message")
message.Parent = workspace
message.archivable = false

game:GetService("ScriptInformationProvider"):SetAssetUrl("http://www.rbx2016.nl/Asset/")
game:GetService("ContentProvider"):SetThreadPool(16)
pcall(function() game:GetService("InsertService"):SetFreeModelUrl("http://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?type=fm&q=%s&pg=%d&rs=%d") end) -- Used for free model search (insert tool)
pcall(function() game:GetService("InsertService"):SetFreeDecalUrl("http://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?type=fd&q=%s&pg=%d&rs=%d") end) -- Used for free decal search (insert tool)

ifSeleniumThenSetCookie("SeleniumTest2", "Set URL service")

settings().Diagnostics:LegacyScriptMode()

game:GetService("InsertService"):SetBaseSetsUrl("http://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=10&type=base")
game:GetService("InsertService"):SetUserSetsUrl("http://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?nsets=20&type=user&userid=%d")
game:GetService("InsertService"):SetCollectionUrl("http://www.rbx2016.nl/Game/Tools/InsertAsset.ashx?sid=%d")
game:GetService("InsertService"):SetAssetUrl("http://www.rbx2016.nl/Asset/?id=%d")
game:GetService("InsertService"):SetAssetVersionUrl("http://www.rbx2016.nl/Asset/?assetversionid=%d")

pcall(function() game:GetService("SocialService"):SetFriendUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsFriendsWith&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetBestFriendUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsBestFriendsWith&playerid=%d&userid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=IsInGroup&playerid=%d&groupid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupRankUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=%d&groupid=%d") end)
pcall(function() game:GetService("SocialService"):SetGroupRoleUrl("http://www.rbx2016.nl/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=%d&groupid=%d") end)
pcall(function() game:GetService("GamePassService"):SetPlayerHasPassUrl("http://www.rbx2016.nl/Game/GamePass/GamePassHandler.ashx?Action=HasPass&UserID=%d&PassID=%d") end)
pcall(function() game:GetService("MarketplaceService"):SetProductInfoUrl("https://api.rbx2016.nl/marketplace/productinfo?assetId=%d") end)
pcall(function() game:GetService("MarketplaceService"):SetDevProductInfoUrl("https://api.rbx2016.nl/marketplace/productDetails?productId=%d") end)
pcall(function() game:GetService("MarketplaceService"):SetPlayerOwnsAssetUrl("https://api.rbx2016.nl/ownership/hasasset?userId=%d&assetId=%d") end)
pcall(function() game:SetCreatorID(0, Enum.CreatorType.User) end)

ifSeleniumThenSetCookie("SeleniumTest3", "Set creator ID")

pcall(function() game:SetScreenshotInfo("") end)
pcall(function() game:SetVideoInfo("") end)

function registerPlay(key)
    if true and game:GetService("CookiesService"):GetCookieValue(key) == "" then
        game:GetService("CookiesService"):SetCookieValue(key, "{ \\"userId\\" : ${UserID}, \\"placeId\\" : ${PlaceId}, \\"os\\" : \\"" .. settings().Diagnostics.OsPlatform .. "\\"}")
    end
end

pcall(function()
    registerPlay("rbx_evt_ftp")
    delay(60*5, function() registerPlay("rbx_evt_fmp") end)
end)

ifSeleniumThenSetCookie("SeleniumTest4", "Exiting SingleplayerSharedScript")-- SingleplayerSharedScript.lua inserted here --

pcall(function() settings().Rendering.EnableFRM = true end)
pcall(function() settings()["Task Scheduler"].PriorityMethod = Enum.PriorityMethod.AccumulatedError end)

game:GetService("ChangeHistoryService"):SetEnabled(false)
pcall(function() game:GetService("Players"):SetBuildUserPermissionsUrl("http://www.rbx2016.nl//Game/BuildActionPermissionCheck.ashx?assetId=0&userId=%d&isSolo=true") end)

workspace:SetPhysicsThrottleEnabled(true)

local addedBuildTools = false
local screenGui = game:GetService("CoreGui"):FindFirstChild("RobloxGui")

local inStudio = false or false

function doVisit()
    message.Text = "Loading Game"
    if false then
        if false then
            success, err = pcall(function() game:Load("") end)
            if not success then
                message.Text = "Could not teleport"
                return
            end
        end
    else
        if false then
            game:Load("")
            pcall(function() visit:SetUploadUrl("") end)
        else
            pcall(function() visit:SetUploadUrl("") end)
        end
    end

    message.Text = "Running"
    game:GetService("RunService"):Run()

    message.Text = "Creating Player"
    if false then
        player = game:GetService("Players"):CreateLocalPlayer(0)
        if not inStudio then
            player.Name = "Player${UserID.toString().replace("-","")}"
        end
    else
        player = game:GetService("Players"):CreateLocalPlayer(0)
    end
    player.CharacterAppearance = "http://www.rbx2016.nl/Asset/CharacterFetch.ashx?userId=${UserID}&placeId=${PlaceId}"
    pcall(function()
        player.UserId = ${UserID}
    end)
    local propExists, canAutoLoadChar = false
    propExists = pcall(function()  canAutoLoadChar = game.Players.CharacterAutoLoads end)

    if (propExists and canAutoLoadChar) or (not propExists) then
        player:LoadCharacter()
    end
    
    message.Text = "Setting GUI"
    player:SetSuperSafeChat(true)
    pcall(function() player:SetUnder13(True) end)
    pcall(function() player:SetMembershipType(None) end)
    pcall(function() player:SetAccountAge(0) end)
    
    if not inStudio and false then
        message.Text = "Setting Ping"
        visit:SetPing("http://www.rbx2016.nl/Game/ClientPresence.ashx?version=old&PlaceID=${PlaceId}", 120)

        message.Text = "Sending Stats"
        game:HttpGet("")
    end
    
end

success, err = pcall(doVisit)

if not inStudio and not addedBuildTools then
    local playerName = Instance.new("StringValue")
    playerName.Name = "PlayerName"
    playerName.Value = player.Name
    playerName.RobloxLocked = true
    playerName.Parent = screenGui
                
    pcall(function() game:GetService("ScriptContext"):AddCoreScript(59431535,screenGui,"BuildToolsScript") end)
    addedBuildTools = true
end

if success then
    message.Parent = nil
else
    print(err)
    if not inStudio then
        if false then
            pcall(function() visit:SetUploadUrl("") end)
        end
    end
    wait(5)
    message.Text = "Error on visit: " .. err
    if not inStudio then
        if false then
            game:HttpPost("http://www.rbx2016.nl/Error/Lua.ashx?", "Visit.lua: " .. err)
        end
    end
end
            `;
            const signature = db.sign(script, isAndroid);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/game/GetCurrentUser.ashx", db.requireAuth2, async (req, res) => {
            const ip = get_ip(req).clientIp;
            let user = req.user;
            if (!user && typeof db.pendingStudioAuthentications[ip] == "object" && db.pendingStudioAuthentications[ip].length > 0) {
                while (db.pendingStudioAuthentications[ip].length > 0 && !user) {
                    const cookieObject = db.pendingStudioAuthentications[ip].shift();
                    if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                        // return res.sendStatus(403);
                    } else {
                        user = await db.findUserByCookie(cookieObject[1]);
                    }
                }
            }
            if (user) {
                if (typeof db.pendingStudioAuthentications[ip] == "object") {
                    if (!db.pendingStudioAuthentications[ip].includes(ip)) {
                        db.pendingStudioAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                    }
                } else {
                    db.pendingStudioAuthentications[ip] = [
                        [db.getUnixTimestamp(), user.cookie]
                    ];
                }
                res.send(user.userid.toString());
            } else {
                // res.status(403).send();
                res.send("1");
            }
        });

        app.get("/game/logout.aspx", db.requireAuth, async (req, res) => {
            res.setHeader('x-csrf-token', await db.generateUserCsrfToken(req.user.userid));
            res.json({});
        });

        app.post("/game/PlaceLauncher.ashx", db.requireAuth2, async (req, res) => {
            const ip = get_ip(req).clientIp;
            let user = req.user
            const request = req.query.request;
            const browserTrackerId = req.query.browserTrackerId;
            const placeId = parseInt(req.query.placeId);
            const isPlayTogetherGame = req.query.isPlayTogetherGame == "true";
            if (request == "RequestGame") {
                if (!user && typeof db.pendingPlayerAuthentications[ip] == "object" && db.pendingPlayerAuthentications[ip].length > 0) {
                    while (db.pendingPlayerAuthentications[ip].length > 0 && !user) {
                        const cookieObject = db.pendingPlayerAuthentications[ip].shift();
                        if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                            // return res.sendStatus(403);
                        } else {
                            user = await db.findUserByCookie(cookieObject[1]);
                        }
                    }
                }
                if (!user || user.banned || user.inviteKey == "") {
                    res.status(401).json({});
                    return;
                }
                const game = await db.getGame(placeId);
                if (!game) {
                    res.status(404).json({});
                    return;
                }
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                }

                const gameSession = await db.newJob(game.gameid);
                if (gameSession) {
                    setImmediate(async () => {
                        await gameSession.host();
                        setTimeout(() => {
                            let interval;
                            interval = setInterval(async () => {
                                if (await gameSession.update()) {
                                    clearInterval(interval);
                                }
                            }, 5000);
                        }, 5000);
                    });
                }

                setTimeout(async () => {
                    if (game.port == 0) {
                        res.json({
                            "jobId": "",
                            "status": 0,
                            "joinScriptUrl": "",
                            "authenticationUrl": "",
                            "authenticationTicket": "",
                            "message": "",
                            "joinScript": "",
                        });
                        if (typeof db.pendingPlayerAuthentications[ip] == "object") {
                            if (!db.pendingPlayerAuthentications[ip].includes(ip)) {
                                db.pendingPlayerAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                            }
                        } else {
                            db.pendingPlayerAuthentications[ip] = [
                                [db.getUnixTimestamp(), user.cookie]
                            ];
                        }
                        return;
                    }

                    res.json({
                        "jobId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        "status": 2,
                        "joinScriptUrl": "https://assetgame.rbx2016.nl/game/join.ashx?gameid=" + game.gameid.toString() + "&ticket=" + await db.generateUserToken(user.xcsrftoken),
                        "authenticationUrl": "",
                        "authenticationTicket": "",
                        "message": ""
                    });
                }, 5000);
            } else if(request == "RequestPrivateGame"){
                // Not currently private. (Used for android.)
                if (!user && typeof db.pendingPlayerAuthentications[ip] == "object" && db.pendingPlayerAuthentications[ip].length > 0) {
                    while (db.pendingPlayerAuthentications[ip].length > 0 && !user) {
                        const cookieObject = db.pendingPlayerAuthentications[ip].shift();
                        if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                            // return res.sendStatus(403);
                        } else {
                            user = await db.findUserByCookie(cookieObject[1]);
                        }
                    }
                }
                if (!user || user.banned || user.inviteKey == "") {
                    res.status(401).json({});
                    return;
                }
                const game = await db.getGame(placeId);
                if (!game) {
                    res.status(404).json({});
                    return;
                }
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                }

                const gameSession = await db.newJob(game.gameid);
                if (gameSession) {
                    setImmediate(async () => {
                        await gameSession.host();
                        setTimeout(() => {
                            let interval;
                            interval = setInterval(async () => {
                                if (await gameSession.update()) {
                                    clearInterval(interval);
                                }
                            }, 5000);
                        }, 5000);
                    });
                }

                setTimeout(async () => {
                    if (game.port == 0) {
                        res.json({
                            "jobId": "",
                            "status": 0,
                            "joinScriptUrl": "",
                            "authenticationUrl": "",
                            "authenticationTicket": "",
                            "message": "",
                            "joinScript": "",
                        });
                        if (typeof db.pendingPlayerAuthentications[ip] == "object") {
                            if (!db.pendingPlayerAuthentications[ip].includes(ip)) {
                                db.pendingPlayerAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                            }
                        } else {
                            db.pendingPlayerAuthentications[ip] = [
                                [db.getUnixTimestamp(), user.cookie]
                            ];
                        }
                        return;
                    }

                    res.json({
                        "jobId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        "status": 2,
                        "joinScriptUrl": "https://assetgame.rbx2016.nl/game/join.ashx?gameid=" + game.gameid.toString() + "&ticket=" + await db.generateUserToken(user.xcsrftoken),
                        "authenticationUrl": "",
                        "authenticationTicket": "",
                        "message": ""
                    });
                }, 5000);
            } else if (request == "CloudEdit") {
                if (!user && typeof db.pendingStudioAuthentications[ip] == "object" && db.pendingStudioAuthentications[ip].length > 0) {
                    while (db.pendingStudioAuthentications[ip].length > 0 && !user) {
                        const cookieObject = db.pendingStudioAuthentications[ip].shift();
                        if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                            // return res.sendStatus(403);
                        } else {
                            user = await db.findUserByCookie(cookieObject[1]);
                        }
                    }
                }
                if (!user || user.banned || user.inviteKey == "") {
                    res.status(401).json({});
                    return;
                }
                const game = await db.getGame(placeId);
                if (!game) {
                    res.status(404).json({});
                    return;
                }

                if (!game.teamCreateEnabled) {
                    res.status(403).json({});
                    return;
                }

                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                }

                if (user.userid != game.creatorid) {
                    res.status(401).json({});
                    return;
                }


                const gameSession = await db.newJob(game.gameid, true);
                if (gameSession) {
                    setImmediate(async () => {
                        await gameSession.host();
                        setTimeout(() => {
                            let interval;
                            interval = setInterval(async () => {
                                if (await gameSession.update()) {
                                    clearInterval(interval);
                                }
                            }, 5000);
                        }, 5000);
                    });
                }

                setTimeout(async () => {
                    if (game.teamCreatePort == 0) {
                        res.json({
                            "jobId": "",
                            "status": 0,
                            "joinScriptUrl": "",
                            "authenticationUrl": "",
                            "authenticationTicket": "",
                            "message": ""
                        });
                        if (typeof db.pendingStudioAuthentications[ip] == "object") {
                            if (!db.pendingStudioAuthentications[ip].includes(ip)) {
                                db.pendingStudioAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                            }
                        } else {
                            db.pendingStudioAuthentications[ip] = [
                                [db.getUnixTimestamp(), user.cookie]
                            ];
                        }
                        return;
                    }

                    res.json({
                        "jobId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        "status": 2,
                        "joinScriptUrl": "https://assetgame.rbx2016.nl/game/join.ashx?teamCreate=true&gameid=" + game.gameid.toString() + "&ticket=" + await db.generateUserToken(user.xcsrftoken),
                        "authenticationUrl": "http://",
                        "authenticationTicket": "",
                        "message": ""
                    });
                }, 5000);
            } else {
                res.status(400).json({});
            }
        });

        app.get("/Game/MachineConfiguration.ashx", (req, res) => {
            res.json({
                "success": true
            });
        });

        app.post("/Game/MachineConfiguration.ashx", (req, res) => {
            res.json({
                "success": true
            });
        });

        app.get("/my/settings/json", db.requireAuth, async (req, res) => {
            const ip = get_ip(req).clientIp;
            res.json({
                "ChangeUsernameEnabled": true,
                "IsAdmin": req.user.role == "mod" || req.user.role == "admin" || req.user.role == "owner",
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
                "ClientIpAddress": ip,
                "AccountAgeInDays": 1105,
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
                "ApiProxyDomain": "https://api.rbx2016.nl",
                "AccountSettingsApiDomain": "https://accountsettings.rbx2016.nl",
                "AuthDomain": "https://auth.rbx2016.nl",
                "IsDisconnectFacebookEnabled": true,
                "IsDisconnectXboxEnabled": true,
                "NotificationSettingsDomain": "https://notifications.rbx2016.nl",
                "AllowedNotificationSourceTypes": ["Test", "FriendRequestReceived", "FriendRequestAccepted", "PartyInviteReceived", "PartyMemberJoined", "ChatNewMessage", "PrivateMessageReceived", "UserAddedToPrivateServerWhiteList", "ConversationUniverseChanged", "TeamCreateInvite", "GameUpdate", "DeveloperMetricsAvailable", "GroupJoinRequestAccepted", "Sendr"],
                "AllowedReceiverDestinationTypes": ["DesktopPush", "NotificationStream"],
                "BlacklistedNotificationSourceTypesForMobilePush": [],
                "MinimumChromeVersionForPushNotifications": 50,
                "PushNotificationsEnabledOnFirefox": true,
                "LocaleApiDomain": "https://locale.rbx2016.nl",
                "HasValidPasswordSet": true,
                "FastTrackMember": null,
                "IsFastTrackAccessible": false,
                "HasFreeNameChange": false,
                "IsAgeDownEnabled": !(await db.isUserUnder13(req.user.userid)),
                "IsDisplayNamesEnabled": false,
                "IsBirthdateLocked": await db.isUserUnder13(req.user.userid)
            })
        });

        app.get("/Game/api/v1/GetPublicIp", async (req, res) => {
            let ip = get_ip(req).clientIp;
            if (!db.getHostPublicIps().includes(ip)){
                return res.sendStatus(403);
            }
            const apiKey = req.query.apiKey;
            if (apiKey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user) {
                    res.status(404).render("404", await db.getRenderObject(req.user));
                } else {
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            if (ip == "127.0.0.1" || ip == "::1" || ip == "") {
                ip = db.getHostPublicIp();
            }
            const script = `
publicIp = "${ip}"`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/game/PlaceLauncher.ashx", db.requireAuth2, async (req, res) => {
            const ip = get_ip(req).clientIp;
            let user = req.user
            const request = req.query.request;
            const browserTrackerId = req.query.browserTrackerId;
            const placeId = parseInt(req.query.placeId);
            const isPlayTogetherGame = req.query.isPlayTogetherGame == "true";
            if (request == "RequestGame") {
                if (!user && typeof db.pendingPlayerAuthentications[ip] == "object" && db.pendingPlayerAuthentications[ip].length > 0) {
                    while (db.pendingPlayerAuthentications[ip].length > 0 && !user) {
                        const cookieObject = db.pendingPlayerAuthentications[ip].shift();
                        if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                            // return res.sendStatus(403);
                        } else {
                            user = await db.findUserByCookie(cookieObject[1]);
                        }
                    }
                }
                if (!user || user.banned || user.inviteKey == "") {
                    res.status(401).json({});
                    return;
                }
                const game = await db.getGame(placeId);
                if (!game) {
                    res.status(404).json({});
                    return;
                }
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                }

                const gameSession = await db.newJob(game.gameid);
                if (gameSession) {
                    setImmediate(async () => {
                        await gameSession.host();
                        setTimeout(() => {
                            let interval;
                            interval = setInterval(async () => {
                                if (await gameSession.update()) {
                                    clearInterval(interval);
                                }
                            }, 5000);
                        }, 5000);
                    });
                }

                setTimeout(async () => {
                    if (game.port == 0) {
                        res.json({
                            "jobId": "",
                            "status": 0,
                            "joinScriptUrl": "",
                            "authenticationUrl": "",
                            "authenticationTicket": "",
                            "message": "",
                            "joinScript": "",
                        });
                        if (typeof db.pendingPlayerAuthentications[ip] == "object") {
                            if (!db.pendingPlayerAuthentications[ip].includes(ip)) {
                                db.pendingPlayerAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                            }
                        } else {
                            db.pendingPlayerAuthentications[ip] = [
                                [db.getUnixTimestamp(), user.cookie]
                            ];
                        }
                        return;
                    }

                    res.json({
                        "jobId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        "status": 2,
                        "joinScriptUrl": "https://assetgame.rbx2016.nl/game/join.ashx?gameid=" + game.gameid.toString() + "&ticket=" + await db.generateUserToken(user.xcsrftoken),
                        "authenticationUrl": "",
                        "authenticationTicket": "",
                        "message": ""
                    });
                }, 5000);
            } else if(request == "RequestPrivateGame"){
                // Not currently private. (Used for android.)
                if (!user && typeof db.pendingPlayerAuthentications[ip] == "object" && db.pendingPlayerAuthentications[ip].length > 0) {
                    while (db.pendingPlayerAuthentications[ip].length > 0 && !user) {
                        const cookieObject = db.pendingPlayerAuthentications[ip].shift();
                        if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                            // return res.sendStatus(403);
                        } else {
                            user = await db.findUserByCookie(cookieObject[1]);
                        }
                    }
                }
                if (!user || user.banned || user.inviteKey == "") {
                    res.status(401).json({});
                    return;
                }
                const game = await db.getGame(placeId);
                if (!game) {
                    res.status(404).json({});
                    return;
                }
                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                }

                const gameSession = await db.newJob(game.gameid);
                if (gameSession) {
                    setImmediate(async () => {
                        await gameSession.host();
                        setTimeout(() => {
                            let interval;
                            interval = setInterval(async () => {
                                if (await gameSession.update()) {
                                    clearInterval(interval);
                                }
                            }, 5000);
                        }, 5000);
                    });
                }

                setTimeout(async () => {
                    if (game.port == 0) {
                        res.json({
                            "jobId": "",
                            "status": 0,
                            "joinScriptUrl": "",
                            "authenticationUrl": "",
                            "authenticationTicket": "",
                            "message": "",
                            "joinScript": "",
                        });
                        if (typeof db.pendingPlayerAuthentications[ip] == "object") {
                            if (!db.pendingPlayerAuthentications[ip].includes(ip)) {
                                db.pendingPlayerAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                            }
                        } else {
                            db.pendingPlayerAuthentications[ip] = [
                                [db.getUnixTimestamp(), user.cookie]
                            ];
                        }
                        return;
                    }

                    res.json({
                        "jobId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        "status": 2,
                        "joinScriptUrl": "https://assetgame.rbx2016.nl/game/join.ashx?gameid=" + game.gameid.toString() + "&ticket=" + await db.generateUserToken(user.xcsrftoken),
                        "authenticationUrl": "",
                        "authenticationTicket": "",
                        "message": ""
                    });
                }, 5000);
            } else if (request == "CloudEdit") {
                if (!user && typeof db.pendingStudioAuthentications[ip] == "object" && db.pendingStudioAuthentications[ip].length > 0) {
                    while (db.pendingStudioAuthentications[ip].length > 0 && !user) {
                        const cookieObject = db.pendingStudioAuthentications[ip].shift();
                        if (db.getUnixTimestamp() - cookieObject[0] >= 30) {
                            // return res.sendStatus(403);
                        } else {
                            user = await db.findUserByCookie(cookieObject[1]);
                        }
                    }
                }
                if (!user || user.banned || user.inviteKey == "") {
                    res.status(401).json({});
                    return;
                }
                const game = await db.getGame(placeId);
                if (!game) {
                    res.status(404).json({});
                    return;
                }

                if (!game.teamCreateEnabled) {
                    res.status(403).json({});
                    return;
                }

                const creator = await db.getUser(game.creatorid);
                if (!creator || creator.banned || game.deleted || creator.inviteKey == "") {
                    res.status(404).json({});
                }

                if (user.userid != game.creatorid) {
                    res.status(401).json({});
                    return;
                }


                const gameSession = await db.newJob(game.gameid, true);
                if (gameSession) {
                    setImmediate(async () => {
                        await gameSession.host();
                        setTimeout(() => {
                            let interval;
                            interval = setInterval(async () => {
                                if (await gameSession.update()) {
                                    clearInterval(interval);
                                }
                            }, 5000);
                        }, 5000);
                    });
                }

                setTimeout(async () => {
                    if (game.teamCreatePort == 0) {
                        res.json({
                            "jobId": "",
                            "status": 0,
                            "joinScriptUrl": "",
                            "authenticationUrl": "",
                            "authenticationTicket": "",
                            "message": ""
                        });
                        if (typeof db.pendingStudioAuthentications[ip] == "object") {
                            if (!db.pendingStudioAuthentications[ip].includes(ip)) {
                                db.pendingStudioAuthentications[ip].push([db.getUnixTimestamp(), user.cookie]);
                            }
                        } else {
                            db.pendingStudioAuthentications[ip] = [
                                [db.getUnixTimestamp(), user.cookie]
                            ];
                        }
                        return;
                    }

                    res.json({
                        "jobId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                        "status": 2,
                        "joinScriptUrl": "https://assetgame.rbx2016.nl/game/join.ashx?teamCreate=true&gameid=" + game.gameid.toString() + "&ticket=" + await db.generateUserToken(user.xcsrftoken),
                        "authenticationUrl": "http://",
                        "authenticationTicket": "",
                        "message": ""
                    });
                }, 5000);
            } else {
                res.status(400).json({});
            }
        });

        app.get("/Game/Badge/HasBadge.ashx", async (req, res) => {
            const ip = get_ip(req).clientIp;
            if (!db.getHostPublicIps().includes(ip)){
                return res.sendStatus(403);
            }
            const UserID = req.query.UserID;
            const BadgeID = req.query.BadgeID;
            const owned = await db.userOwnsAsset(UserID, BadgeID);
            if (owned){
                res.send("<Value Type=\"boolean\">true</Value>");
            }else{
                res.send("<Value Type=\"boolean\">false</Value>");
            }
        });

        app.post("/Game/Badge/AwardBadge.ashx", async (req, res) => {
            const ip = get_ip(req).clientIp;
            if (!db.getHostPublicIps().includes(ip)){
                return res.sendStatus(403);
            }
            const tmp = req.query.UserID;

            let userId = parseInt(req.query.UserId);
            let badgeId = parseInt(req.query.BadgeId);
            let placeId = parseInt(req.query.PlaceId);

            if (tmp && tmp.includes("=")){
                const split = tmp.split("=");
                userId = parseInt(split[0]);
                badgeId = parseInt(split[1]);
                placeId = parseInt(split[2]);
            }
            
            const user = await db.getUser(userId);
            if (!user) {
                res.sendStatus(404);
                return;
            }
            const badge = await db.getBadge(badgeId);
            if (!badge || !badge.onSale) {
                res.sendStatus(404);
                return;
            }
            if (badge.gameid != placeId) {
                res.sendStatus(404);
                return;
            }
            const owned = await db.userOwnsAsset(userId, badgeId);
            if (owned) {
                res.status(400).json({});
                return;
            }
            const creator = await db.getUser(badge.creatorid);
            const awarded = await db.awardBadge(user, badgeId);
            if (awarded) {
                res.send(`${user.username} won ${creator.username}'s\n"${badge.name}" award!`);
            } else {
                res.sendStatus(500);
            }
        });

        app.get("/Game/Badge/IsBadgeDisabled.ashx", async (req, res) => {
            const BadgeID = req.query.BadgeID;
            const PlaceID = req.query.PlaceID;
            const badge = await db.getBadge(BadgeID);
            if (!badge) {
                res.sendStatus(404);
                return;
            }
            if (badge.gameid != PlaceID) {
                res.sendStatus(404);
                return;
            }
            if (!badge.onSale) {
                res.send("<Value Type=\"boolean\">true</Value>");
            }else{
                res.send("<Value Type=\"boolean\">false</Value>");
            }
        });

        app.post("/api/v1/Close", db.requireAuth2, async (req, res) => {
            const ip = get_ip(req).clientIp;
            if (!db.getHostPublicIps().includes(ip)){
                return res.sendStatus(403);
            }
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
            const games = await db.getJobsByGameId(placeId);
            for (let i = 0; i < games.length; i++) {
                const job = await db.getJob(games[i]);
                await job.stop();
            }
            const script = `
`
            const signature = db.sign(script);
            res.send(`--rbxsig%${signature}%` + script);
        });

        app.get("/game/LuaWebService", async (req, res) => {
            const method = req.query.method;
            if (method == "IsInGroup") {
                const playerid = req.query.playerid;
                const groupid = req.query.groupid;
                if (groupid == "1200769") {
                    const user = await db.getUser(playerid);
                    if (!user || user.banned || user.inviteKey == "") {
                        res.status(400).json("<Value Type=\"boolean\">false</Value>");
                        return;
                    }
                    if (user.role == "mod" || user.role == "admin" || user.role == "owner") {
                        res.send("<Value Type=\"boolean\">true</Value>");
                    } else {
                        res.send("<Value Type=\"boolean\">false</Value>");
                    }
                } else {
                    res.send("<Value Type=\"boolean\">false</Value>");
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

        app.get("/game/report-stats", (req, res) => {
            res.send();
        });

        app.get("/Game/GamePass/GamePassHandler.ashx", async (req, res) => {
            const action = req.query.Action;
            const userid = req.query.UserID;
            const passid = req.query.PassID;
            if (action == "HasPass" && userid < 0) {
                return res.send("<Value Type=\"boolean\">true</Value>");
            }
            const user = await db.getUser(userid);
            if (action == "HasPass") {
                if (user != null && await db.userOwnsAsset(user.userid, passid)){
                    res.send("<Value Type=\"boolean\">true</Value>");
                }else{
                    res.send("<Value Type=\"boolean\">false</Value>");
                }
            }else{
                res.stauts(404).send("Unknown Action");
            }
        });
    }
}