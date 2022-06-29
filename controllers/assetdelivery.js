const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const AdmZip = require('adm-zip');
const mime = require('mime');

module.exports = {
    init: (app, db) => {
        async function verifyUpload(req, res, next) {
            if (!req.user) {
                res.status(401).send("Unauthorized");
                return;
            }
            req.uploadedFiles = [];
            if (db.getSiteConfig().backend.massAssetUploadEnabled && db.getSiteConfig().backend.massAssetUploadIsAdminOnly && req.user.isAdmin) {
                next();
                return;
            } else if (db.getSiteConfig().backend.massAssetUploadEnabled && !db.getSiteConfig().backend.massAssetUploadIsAdminOnly) {
                next();
                return;
            }
            res.status(401).send("Unauthorized");
        }

        app.post("/v1/assets/upload", db.requireAuth2, verifyUpload, async (req, res) => {
            const zipFile = req.files.files;
            if (!zipFile) {
                res.status(400).send("No file uploaded");
                return;
            }
            if (zipFile.mimetype != "application/zip" && zipFile.mimetype != "application/x-zip-compressed") {
                res.status(400).send("Only zip files are allowed!");
                return;
            }
            const fp = path.resolve(`${__dirname}/../temp/${db.uuidv4()}.zip`);
            zipFile.mv(fp, async () => {
                try {
                    const zip = new AdmZip(fp);
                    const zipEntries = zip.getEntries();
                    for (let i = 0; i < zipEntries.length; i++) {
                        const entry = zipEntries[i];
                        if (entry.isDirectory) {
                            continue;
                        }
                        const fn = entry.entryName;
                        const fd = entry.getData();
                        const mimetype = mime.lookup(fn);
                        if (mimetype == "image/png" || mimetype == "image/jpg" || mimetype == "image/jpeg" || mimetype == "image/bmp" || mimetype == "audio/mpeg" || mimetype == "audio/wav" || mimetype == "audio/ogg" || mimetype == "video/webm") {
                            if (fd.length > 20 * 1024 * 1024) {
                                continue;
                            }
                            const assetId = await db.createAsset(req.user.userid, fn.split(".")[0], "", mimetype == "image/png" ? "image/png" : "image/jpeg" ? 13 : mimetype == "audio/mpeg" || mimetype == "audio/wav" || mimetype == "audio/ogg" ? 3 : mimetype == "video/webm" ? 62 : 0);
                            fs.writeFileSync(`${__dirname}/../assets/${assetId}.asset`, fd);
                            req.uploadedFiles.push(`${assetId}: ${fn} (SUCCESS)`);
                        } else {
                            req.uploadedFiles.push(`?: ${fn} (FAILED: Invalid file type)`);
                        }
                    }
                    try {
                        fs.unlinkSync(fp);
                    } catch {}
                } catch (e) {
                    try {
                        fs.unlinkSync(fp);
                    } catch {}
                    res.status(400).send("Invalid zip file!");
                    return;
                }

                res.send(req.uploadedFiles.length == 0 ? "None" : req.uploadedFiles.join("\n"));
            })
        });

        app.post('/v1/assets/batch', async (req, res) => {
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
                    requestId: asset.requestId,
                    location: `https://assetdelivery.rbx2016.tk/v1/asset/?id=${asset.assetId}`,
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

            const id0 = req.query.id.split("|");
            const id = parseInt(id0[0]);
            const apiKey = req.query.apiKey || (id0.length > 1 ? id0[1] : "");

            if (id0[0].startsWith("r") && db.getSiteConfig().backend.robloxAssetsUsingR == true) {
                res.redirect("https://assetdelivery.roblox.com/v1/asset/?id=" + parseInt(id0[0].substring(1)).toString());
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
            if (db.getPRIVATE_PLACE_KEYS().includes(apiKey)) {
                if (db.getPRIVATE_PLACE_KEYS().includes(apiKey)) {
                    db.removePrivatePlaceKey(apiKey);
                }
                if (game) {
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
    }
}