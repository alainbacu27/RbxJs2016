const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.post("/v2/CreateOrUpdate", db.requireAuth2, async (req, res) => {
            const apiKey = req.query.apiKey;
            if (apiKey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY) {
                if (req.user){
                    res.status(404).render("404", await db.getRenderObject(req.user));
                }else{
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const GameSessions = req.body.GameSessions;
            const placeId = parseInt(req.query.placeId);
            const gameID = req.query.gameID;
            const port = parseInt(req.query.port);
            
            const game = await db.getGame(placeId);
            if (game == null) {
                res.status(400).send()
                return;
            }
            if (game.lastHeartBeat != 0){
                await db.setGameProperty(placeId, "port", port);
            }
            res.send();
        });

        app.post("/v1/Close", db.requireAuth2, async (req, res) => {
            const apiKey = req.query.apiKey;
            if (apiKey != db.getSiteConfig().PRIVATE.PRIVATE_API_KEY){
                if (req.user){
                    res.status(404).render("404", await db.getRenderObject(req.user));
                }else{
                    res.status(404).render("404", await db.getBlankRenderObject());
                }
                return;
            }
            const placeId = parseInt(req.query.placeId);
            const gameID = req.query.gameID;

            const game = await db.getGame(placeId);
            if (game == null) {
                res.status(400).send()
                return;
            }
            await db.setGameProperty(placeId, "port", 0);
            res.send();
        });
    }
}