const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const AdmZip = require('adm-zip');
const mime = require('mime');
const detectContentType = require('detect-content-type');
const get_ip = require('ipware')().get_ip;

module.exports = {
    init: (app, db) => {
        async function verifyUpload(req, res, next) {
            if (!req.user) {
                res.status(401).send("Unauthorized");
                return;
            }
            req.uploadedFiles = [];
            if (db.getSiteConfig().backend.massAssetUploadEnabled && db.getSiteConfig().backend.massAssetUploadIsAdminOnly && (req.user.role == "admin" || req.user.role == "owner")) {
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
                        let outputId = 0;
                        if (!isNaN(parseInt(fn.split(".")[0]))){
                            outputId = parseInt(fn.split(".")[0]);
                        }
                        if (outputId != 0){
                            const asset = await db.getAsset(outputId);
                            if (asset){
                                req.uploadedFiles.push(`?: ${fn} (FAILED: Asset with id ${outputId} already exists)`);
                                continue;
                            }
                        }
                        const mimetype = detectContentType(Buffer.from(fd));
                        if (mimetype == "image/png" || mimetype == "image/jpg" || mimetype == "image/jpeg" || mimetype == "audio/mpeg" || mimetype == "audio/wav" || mimetype == "application/ogg" || mimetype == "video/webm" || mimetype == "model/obj") {
                            if (fd.length > 5.5 * 1024 * 1024) {
                                req.uploadedFiles.push(`?: ${fn} (FAILED: Too big filesize)`);
                                continue;
                            }
                            if (fn.length >= 100) {
                                req.uploadedFiles.push(`?: ${fn} (FAILED: Too long filename)`);
                                continue;
                            }
                            let assetId = await db.createAsset(req.user.userid, fn.split(".")[0], "", (mimetype == "image/png" || mimetype == "image/jpeg") ? "Decal" : (mimetype == "audio/mpeg" || mimetype == "audio/wav" || mimetype == "application/ogg") ? "Audio" : mimetype == "video/webm" ? "Video" : mimetype == "model/obj" ? "Mesh" : "Unknown", true);
                            if (outputId != 0){
                                await db.setAssetProperty(assetId, "id", outputId);
                                assetId = outputId;
                            }
                            const fp3 =`${__dirname}/../assets/${assetId}.asset`;
                            fs.writeFileSync(fp3, fd);
                            if (db.isObjFile(fd)){
                                await db.convertMesh(fp2);
                            }
                            req.uploadedFiles.push(`${assetId}: ${fn} (SUCCESS)`);
                        } else {
                            try{
                                fs.unlinkSync(fp2);
                            }catch {}
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

                res.send(req.uploadedFiles.length == 0 ? "None" : req.uploadedFiles.join("\n<p>&nbsp;</p>"));
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
                    location: `https://assetdelivery.rbx2016.nl/v1/asset/?id=${asset.assetId}`,
                    IsHashDynamic: true,
                    IsCopyrightProtected: false,
                    isArchived: false,
                });
            });

            res.json(newReturn);
        });

        app.get("/v1/asset", db.requireAuth2, async (req, res) => {
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
    }
}