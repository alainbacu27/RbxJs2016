const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.post('/v1/batch', async (req, res) => {
            if (db.getSiteConfig().backend.thumbnailServiceEnabled == false) {
                res.status(403).send("Forbidden");
                return;
            }
            const data = req.body;
            try {
                data = JSON.parse(data);
            } catch {}
            if (!data || !Array.isArray(data)) {
                res.end("Invalid data");
            }

            if (data.length > db.getSiteConfig().backend.maxBatchSize) {
                res.end("Too many requests");
                return;
            }

            let newReturn = []

            data.forEach(asset => {
                newReturn.push({
                    requestId: asset.requestId || asset.targetId,
                    location: `https://thumbnails.rbx2016.nl/v1/v1/thumbnail/?id=${asset.assetId}`,
                    IsHashDynamic: true,
                    IsCopyrightProtected: false,
                    isArchived: false,
                });
            });

            res.json(newReturn);
        });

        app.get("/v1/games/icons", async (req, res) => {
            if (db.getSiteConfig().backend.thumbnailServiceEnabled == false) {
                res.status(403).send("Forbidden");
                return;
            }
            const universeIds = req.query.universeIds.split(",");
            const size = req.query.size;
            const format = req.query.format;
            const returnPolicy = req.query.returnPolicy;
            let data = []

            for (let i = 0; i < universeIds.length; i++) {
                const universeId = universeIds[i];
                const game = await db.getGame(universeId);
                if (!game) {
                    continue;
                }
                data.push({
                    "targetId": universeId,
                    "state": "Completed",
                    "imageUrl": `https://thumbnails.rbx2016.nl/v1/icon?id=${game.gameid}`,
                })
            }

            res.json({
                "data": data
            });
        });

        app.get("/v1/thumbnail", async (req, res) => {
            if (db.getSiteConfig().backend.thumbnailServiceEnabled == false) {
                res.status(403).send("Forbidden");
                return;
            }
            const id = parseInt(req.query.id);
            const bp = path.resolve(__dirname + "/../thumbnails/thumbs/") + path.sep;
            const fp = path.resolve(bp + id.toString() + ".asset");
            if (!fp.startsWith(bp)) {
                res.status(403).send("Forbidden");
                return;
            }
            if (fs.existsSync(fp)) {
                res.attachment("Download");
                res.send(fs.readFileSync(fp));
            } else {
                res.status(404).send();
            }
        });

        app.get("/v1/assets-thumbnail-3d", (req, res) => {
            if (db.getSiteConfig().backend.thumbnailServiceEnabled == false) {
                res.status(403).send("Forbidden");
                return;
            }
            const assetid = parseInt(req.query.assetid);
            res.json({
                "targetId": assetid,
                "state": "Completed",
                "imageUrl": "https://thumbnails.rbx2016.nl/v1/v1/assets-thumbnail-3d2?assetid=" + assetid,
            });
        });

        app.get("/v1/assets-thumbnail-3d2", (req, res) => {
            if (db.getSiteConfig().backend.thumbnailServiceEnabled == false) {
                res.status(403).send("Forbidden");
                return;
            }
            const assetid = parseInt(req.query.assetId);
            res.json({
                "camera": {
                    "position": {
                        "x": -2.1635,
                        "y": 1.65301,
                        "z": -0.493074
                    },
                    "direction": {
                        "x": -0.89254,
                        "y": 0.40558,
                        "z": -0.197172
                    },
                    "fov": 47.0222
                },
                "aabb": {
                    "min": {
                        "x": -0.514558,
                        "y": 0.261465,
                        "z": -0.47145
                    },
                    "max": {
                        "x": 0.478677,
                        "y": 1.67979,
                        "z": 0.404311
                    }
                },
                "mtl": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "obj": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                "textures": ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]
            });
        });

        app.get("/v1/icon", async (req, res) => {
            const id = parseInt(req.query.id);
            const gamepass = await db.getGamepass(id);
            const badge = await db.getBadge(id);
            const internalId = gamepass && gamepass.internalId ? gamepass.internalId : badge && badge.internalId ? badge.internalId : id;
            const bp = path.resolve(__dirname + (internalId != id ? "/../assets/" : "/../thumbnails/thumbs/")) + path.sep;
            const fp = path.resolve(bp + internalId.toString() + ".asset");
            if (!fp.startsWith(bp)) {
                res.status(403).send("Forbidden");
                return;
            }
            if (fs.existsSync(fp)) {
                res.attachment("Download");
                res.send(fs.readFileSync(fp));
            } else {
                const item = await db.getCatalogItem(id);
                if (item) {
                    if (item.deleted) {
                        res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc8.png`);
                    } else {
                        res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/eb0f290fb60954fff9f7251a689b9088.jpg`);
                    }
                } else {
                    const asset = await db.getAsset(id);
                    if (asset && !asset.deleted) {
                        res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/eb0f290fb60954fff9f7251a689b9088.jpg`);
                    } else {
                        res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png`);
                    }
                }
            }
        });

        app.get("/v1/thumb", async (req, res) => {
            const id = parseInt(req.query.id);
            const gamepass = await db.getGamepass(id);
            const badge = await db.getBadge(id);
            const internalId = gamepass && gamepass.internalId ? gamepass.internalId : badge && badge.internalId ? badge.internalId : id;
            const bp = path.resolve(__dirname + (internalId != id ? "/../assets/" : "/../thumbnails/thumbs/")) + path.sep;
            const fp = path.resolve(bp + internalId.toString() + ".asset");
            if (!fp.startsWith(bp)) {
                res.status(403).send("Forbidden");
                return;
            }
            if (fs.existsSync(fp)) {
                res.attachment("Download");
                res.send(fs.readFileSync(fp));
            } else {
                const asset = await db.getAsset(id);
                if (asset && !asset.deleted) {
                    res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/eb0f290fb60954fff9f7251a689b9088.jpg`);
                } else {
                    res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png`);
                }
            }
        });

        app.get("/v1/avatar/icon", async (req, res) => {
            const bp = path.resolve(__dirname + "/../thumbnails/avatars/icons/") + path.sep;
            const fp = path.resolve(bp + req.query.id.toString() + ".asset");
            if (!fp.startsWith(bp)) {
                res.status(403).send("Forbidden");
                return;
            }
            if (fs.existsSync(fp)) {
                res.attachment("Download");
                res.send(fs.readFileSync(fp));
            } else {
                const asset = await db.getAsset(id);
                if (asset && !asset.deleted) {
                    res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/eb0f290fb60954fff9f7251a689b9088.jpg`);
                } else {
                    res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png`);
                }
            }
        });

        app.get("/v1/avatar/thumb", async (req, res) => {
            const bp = path.resolve(__dirname + "/../thumbnails/avatars/thumbs/") + path.sep;
            const fp = path.resolve(bp + req.query.id.toString() + ".asset");
            if (!fp.startsWith(bp)) {
                res.status(403).send("Forbidden");
                return;
            }
            if (fs.existsSync(fp)) {
                res.attachment("Download");
                res.send(fs.readFileSync(fp));
            } else {
                const asset = await db.getAsset(id);
                if (asset && !asset.deleted) {
                    res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/eb0f290fb60954fff9f7251a689b9088.jpg`);
                } else {
                    res.redirect(`${req.secure ? "https" : "http"}://static.rbx2016.nl/images/3970ad5c48ba1eaf9590824bbc739987f0d32dc9.png`);
                }
            }
        });
    }
}