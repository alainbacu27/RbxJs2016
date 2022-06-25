const fs = require("fs");
const path = require("path");
const cookieParser = require('cookie-parser');
const fetch = require('node-fetch');
const querystring = require('querystring');

module.exports = {
    init: (app, db) => {
        app.get('/v1/universes/:gameid/badges', (req, res) => {
            const gameid = req.params.gameid;
            const cursor = req.query.cursor; // ""
            const limit = parseInt(req.query.limit); // 100
            const sortOrder = req.query.sortOrder; // Asc
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });

        app.get("/v1/users/:userid/badges", (req, res) => {
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            });
        });

        app.get("/v1/universes/:universeid/badges", (req, res) => {
            const gameid = parseInt(req.params.universeid);
            const cursor = req.query.cursor;
            const limit = parseInt(req.query.limit);
            const sortOrder = req.query.sortOrder || "Asc";
            res.json({
                "previousPageCursor": null,
                "nextPageCursor": null,
                "data": []
            })
        })
    }
}