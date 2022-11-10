const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.post('/v1/assets/batch', async (req, res) => {
            const data = req.body;
            try {
                data = JSON.parse(data);
            } catch {}
            if (!data || !Array.isArray(data)) {
                res.end("Invalid data");
            }

            if (data.length > db.getSiteConfig().backend.maxBatchSize){
                res.end("Too many requests");
                return;
            }

            let newReturn = []

            data.forEach(asset => {
                newReturn.push({
                    requestId: asset.requestId,
                    location: `https://assetdelivery.roblox.com/v1/asset/?id=${asset.assetId}`,
                    IsHashDynamic: true,
                    IsCopyrightProtected: false,
                    isArchived: false,
                });
            });

            res.json(newReturn);
        });

        app.get("/v1/asset", db.requireAuth2, async (req, res) => {
            if (db.getSiteConfig().backend.assetdeliveryEnabled == false) {
                res.status(400).send();
                return;
            }

            let user = req.user;
            if (req.query.t) {
                user = await db.findUserByToken(req.query.t);
            }

            if (!req.query.id) {
                res.status(404).send();
                return;
            }
            const id0 = req.query.id.split("|");
            const id = parseInt(id0[0]);
            const apiKey = req.query.apiKey || (id0.length > 1 ? id0[1] : "");

            /*
            if (id0[0].startsWith("r") && db.getSiteConfig().backend.robloxAssetsUsingR == true) {
                res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + parseInt(id0[0].substring(1)).toString());
                return;
            }
            */

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
                    res.redirect("https://static.roblox.com/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png");
                }
                return;
            }

            const game = await db.getGame(id);
            if (game) {
                const creator = await db.getUser(game.creatorid);
                if (db.getPRIVATE_PLACE_KEYS().includes(apiKey) || (creator && !creator.banned && !game.deleted && ((user && user.userid == game.creatorid && user.inviteKey != "" && !user.banned)) || game.copiable)) {
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
            }

            const asset = await db.getAsset(id);
            if (asset && !asset.deleted && (asset.approvedBy != 0 || (user && (asset.creatorid == user.userid || user.isAdmin || user.isMod)))) {
                const bp = path.resolve(__dirname + "/../assets/") + path.sep;
                const fp = path.resolve(bp + id.toString() + ".asset");
                if (!fp.startsWith(bp)) {
                    res.status(403).send("Forbidden");
                    return;
                }
                if (fs.existsSync(fp)) {
                    res.download(fp, "Download");
                }/* else if (db.getSiteConfig().backend.fallbackToRobloxAssets == true) {
                    res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + id);
                    // res.sendStatus(404);
                }
                */ else {
                    res.sendStatus(404).send();
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
                }/* else if (db.getSiteConfig().backend.fallbackToRobloxAssets == true) {
                    res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + id);
                    // res.sendStatus(404);
                }
                */ else {
                    res.sendStatus(404).send();
                }
            }
        });
    }
}