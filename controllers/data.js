const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');
const fileUpload = require('express-fileupload');
const zlib = require('zlib');

module.exports = {
    init: (app, db) => {
        app.post("/Data/Upload.ashx", db.requireAuth, async function (req, res, next) {
            const assetid = parseInt(req.query.assetid);
            const issavedversiononly = req.query.issavedversiononly == "true";

            const game = await db.getGame(assetid);
            if (game == null) {
                res.status(404).send("Game not found.");
                return;
            }
            if (req.user.userid != game.creatorid) {
                res.status(403).send("You are not the creator of this game.");
                return;
            }
            await db.setGameProperty(assetid, "lastUpdated", db.getUnixTimestamp());
            req.pipe(zlib.createGunzip()).pipe(fs.createWriteStream(__dirname + "/../games/" + assetid + ".asset"));
            let totalUploadSize = 0;
            req.on("data", (chunk) => {
                totalUploadSize += chunk.length;
                if (totalUploadSize > 10000000) {
                    try{
                        fs.unlink(__dirname + "/../games/" + assetid + ".asset");
                    }catch{}
                    res.status(413).send("File too large.");
                    return;
                }
            });
            req.on('end', () => {
                res.send(assetid + " 1");
            });
    });
    }
}